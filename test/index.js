const assert = require('assert');
const fs = require('fs');
const path = require('path');
const promisify = require('@nlib/promisify');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const test = require('@nlib/test');
const {Entries, Translator} = require('..');

test('nLingual', (test) => {
	test('valid', (test) => {
		const projects = [];
		test('load projects', () => {
			const projectsDir = path.join(__dirname, 'projects');
			return readdir(projectsDir)
			.then((names) => {
				projects.push(...names.map((name) => path.join(projectsDir, name)));
			});
		});
		test('run nLingual in the projects', (test) => {
			for (const directory of projects) {
				test(directory, (test) => {
					const entries = new Entries();
					const files = [];
					test('get a list of files', () => {
						return readdir(path.join(directory, 'src'))
						.then((names) => {
							files.push(
								...names.reverse()
								.filter((name) => name.endsWith('.js'))
								.map((name) => path.join(directory, 'src', name))
							);
						});
					});
					test('parse files', (test) => {
						files.forEach((file, index) => {
							test(file, (test) => {
								return readFile(file, 'utf8')
								.then((code) => {
									const src = index % 2 === 0
									? path.relative(process.cwd(), file)
									: file;
									test('parse', () => {
										entries.parse(code, src);
									});
									test('minify', (test) => {
										const result = entries.minify(code, src);
										const splitted = file.split(path.sep);
										splitted[splitted.length - 2] = 'minified';
										return readFile(splitted.join(path.sep), 'utf8')
										.then((expected) => {
											test.compare(result.code, expected);
										});
									});
								});
							});
						});
					});
					test('load translations', () => {
						return readFile(path.join(directory, 'src', 'translation.json'), 'utf8')
						.then(JSON.parse)
						.then((data) => {
							entries.load(data);
						});
					});
					test('load expected translations', (test) => {
						return readFile(path.join(directory, 'expected-translation.json'), 'utf8')
						.then(JSON.parse)
						.then((expected) => {
							test.compare(entries.toJSON(), expected);
						});
					});
					test('toMinifiedJSON', (test) => {
						return readFile(path.join(directory, 'expected-minified.json'), 'utf8')
						.then(JSON.parse)
						.then((expected) => {
							test.compare(entries.toMinifiedJSON({silent: true}), expected);
						});
					});
					test('run tests', (test) => {
						return readFile(path.join(directory, 'tests.json'), 'utf8')
						.then((json) => {
							JSON.parse(json)
							.forEach(([lang, tests]) => {
								test(lang, (test) => {
									test('from JSON', (test) => {
										const translator = new Translator(entries.toJSON({silent: true}));
										test(`use ${lang}`, () => {
											translator.use(lang);
										});
										for (const [phrase, params, expected] of tests) {
											test(`${phrase} ${JSON.stringify(params)} → ${expected}`, () => {
												assert.equal(translator.translate(phrase, params), expected);
											});
										}
									});
									test('from minifiedJSON', (test) => {
										const translator = new Translator(entries.toMinifiedJSON({silent: true}));
										test(`use ${lang}`, () => {
											assert.equal(translator.use(lang), translator);
										});
										for (const [phrase, params, expected] of tests) {
											test(`${phrase} ${JSON.stringify(params)} → ${expected}`, () => {
												const index = entries.findIndex(phrase);
												assert.equal(translator.translate(0 <= index ? index : phrase, params), expected);
											});
										}
									});
								});
							});
							test('Unknown rule', () => {
								const translator = new Translator(entries.toJSON({silent: true}));
								const currentLang = translator.lang;
								translator.use();
								assert.equal(translator.lang, currentLang);
							});
						});
					});
				});
			}
		});
	});
	test('strict', (test) => {
		const projects = [];
		test('load projects', () => {
			const projectsDir = path.join(__dirname, 'strict');
			return readdir(projectsDir)
			.then((names) => {
				projects.push(...names.map((name) => path.join(projectsDir, name)));
			});
		});
		test('run nLingual in the projects', (test) => {
			for (const directory of projects) {
				test(directory, (test) => {
					const entries = new Entries({strictMode: true});
					const files = [];
					test('get a list of files', () => {
						return readdir(path.join(directory, 'src'))
						.then((names) => {
							files.push(
								...names
								.filter((name) => name.endsWith('.js'))
								.map((name) => path.join(directory, 'src', name))
							);
						});
					});
					test('parse files', (test) => {
						files.forEach((file, index) => {
							test(file, () => {
								return readFile(file, 'utf8')
								.then((code) => {
									const src = index % 2 === 0
									? path.relative(process.cwd(), file)
									: file;
									entries.parse(code, src);
								});
							});
						});
					});
					test('load translations', () => {
						return readFile(path.join(directory, 'src', 'translation.json'), 'utf8')
						.then(JSON.parse)
						.then((data) => {
							entries.load(data);
						});
					});
					test('toJSON() throws an error', (test) => {
						Promise.resolve()
						.then(() => entries.toJSON())
						.then(() => {
							throw new Error('Resolved unexpectedly');
						})
						.catch((error) => {
							test.compare(error, {code: (code) => ['ENOTTRANSLATED', 'EUNUSED'].includes(code)});
						});
					});
				});
			}
		});
	});
	test('reset src', () => {
		const entries = new Entries({strictMode: true});
		entries.parse('translate("foo")', 'foo.js');
		assert.deepEqual(
			Array.from(entries).map((entry) => Array.from(entry.src)),
			[['foo.js:1']]
		);
		entries.parse('\ntranslate("foo")', 'foo.js');
		assert.deepEqual(
			Array.from(entries).map((entry) => Array.from(entry.src)),
			[['foo.js:2']]
		);
	});
	test('keep unused phrases', (test) => {
		const entries = new Entries();
		entries.load({
			langs: {en: 1},
			phrases: {
				bar: {en: 'bar'},
			},
		});
		test.compare(entries.toJSON(), {
			langs: {en: 1},
			phrases: {
				bar: {
					'en': 'bar',
					'@': {length: 0},
				},
			},
		});
	});
	test('Translator', (test) => {
		test('set translations on construction', () => {
			const translator = new Translator({
				langs: {en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			assert.equal(translator.translate('foo'), 'bar');
		});
		test('set translations later', () => {
			const translator = new Translator();
			translator.load({
				langs: {en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			assert.equal(translator.translate('foo'), 'bar');
		});
		test('use current lang', () => {
			const translator = new Translator();
			translator.load({
				langs: {en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			translator.load({
				langs: {es: 1, en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			assert.equal(translator.lang, 'en');
		});
		test('use available lang', () => {
			const translator = new Translator();
			translator.load({
				langs: {en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			translator.load({
				langs: {es: 1},
				phrases: {foo: {en: 'bar'}},
			});
			assert.equal(translator.lang, 'es');
		});
		test('ignore undefined', () => {
			const translator = new Translator({
				langs: {en: 1},
				phrases: {},
			});
			translator.use('en');
			assert.equal(translator.translate('foo'), 'foo');
		});
		test('ignore null', () => {
			const translator = new Translator({
				langs: {en: 1},
				phrases: {foo: {en: null}},
			});
			translator.use('en');
			assert.equal(translator.translate('foo'), 'foo');
		});
	});
});
