const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {promisify} = require('@nlib/util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const {Entries, Translator} = require('..');
const t = require('tap');

t.test('nLingual', (t) => {
	t.test('valid', (t) => {
		const projects = [];
		t.test('load projects', () => {
			const projectsDir = path.join(__dirname, 'projects');
			return readdir(projectsDir)
			.then((names) => {
				projects.push(...names.map((name) => path.join(projectsDir, name)));
			});
		});
		t.test('run nLingual in the projects', (t) => {
			for (const directory of projects) {
				t.test(directory, (t) => {
					const entries = new Entries();
					const files = [];
					t.test('get a list of files', () => {
						return readdir(path.join(directory, 'src'))
						.then((names) => {
							files.push(
								...names.reverse()
								.filter((name) => name.endsWith('.js'))
								.map((name) => path.join(directory, 'src', name))
							);
						});
					});
					t.test('parse files', (t) => {
						files.forEach((file, index) => {
							t.test(file, (t) => {
								return readFile(file, 'utf8')
								.then((code) => {
									const src = index % 2 === 0
									? path.relative(process.cwd(), file)
									: file;
									t.test('parse', (t) => {
										entries.parse(code, src);
										t.end();
									});
									t.test('minify', (t) => {
										const result = entries.minify(code, src);
										const splitted = file.split(path.sep);
										splitted[splitted.length - 2] = 'minified';
										return readFile(splitted.join(path.sep), 'utf8')
										.then((expected) => {
											t.match(result.code, expected);
										});
									});
								});
							});
						});
						t.end();
					});
					t.test('load translations', () => {
						return readFile(path.join(directory, 'src', 'translation.json'), 'utf8')
						.then(JSON.parse)
						.then((data) => {
							entries.load(data);
						});
					});
					t.test('load expected translations', (t) => {
						return readFile(path.join(directory, 'expected-translation.json'), 'utf8')
						.then(JSON.parse)
						.then((expected) => {
							t.match(entries.toJSON(), expected);
						});
					});
					t.test('toMinifiedJSON', (t) => {
						return readFile(path.join(directory, 'expected-minified.json'), 'utf8')
						.then(JSON.parse)
						.then((expected) => {
							t.match(entries.toMinifiedJSON({silent: true}), expected);
						});
					});
					t.test('run tests', (t) => {
						return readFile(path.join(directory, 'tests.json'), 'utf8')
						.then((json) => {
							JSON.parse(json)
							.forEach(([lang, tests]) => {
								t.test(lang, (t) => {
									t.test('from JSON', (t) => {
										const translator = new Translator(entries.toJSON({silent: true}));
										t.test(`use ${lang}`, (t) => {
											translator.use(lang);
											t.end();
										});
										for (const [phrase, params, expected] of tests) {
											t.test(`${phrase} ${JSON.stringify(params)} → ${expected}`, (t) => {
												t.equal(translator.translate(phrase, params), expected);
												t.end();
											});
										}
										t.end();
									});
									t.test('from minifiedJSON', (t) => {
										const translator = new Translator(entries.toMinifiedJSON({silent: true}));
										t.test(`use ${lang}`, (t) => {
											t.equal(translator.use(lang), translator);
											t.end();
										});
										for (const [phrase, params, expected] of tests) {
											t.test(`${phrase} ${JSON.stringify(params)} → ${expected}`, (t) => {
												const index = entries.findIndex(phrase);
												t.equal(translator.translate(0 <= index ? index : phrase, params), expected);
												t.end();
											});
										}
										t.end();
									});
									t.end();
								});
							});
							t.test('Unknown rule', (t) => {
								const translator = new Translator(entries.toJSON({silent: true}));
								const currentLang = translator.lang;
								translator.use();
								t.equal(translator.lang, currentLang);
								t.end();
							});
						});
					});
					t.end();
				});
			}
			t.end();
		});
		t.end();
	});
	t.test('strict', (t) => {
		const projects = [];
		t.test('load projects', () => {
			const projectsDir = path.join(__dirname, 'strict');
			return readdir(projectsDir)
			.then((names) => {
				projects.push(...names.map((name) => path.join(projectsDir, name)));
			});
		});
		t.test('run nLingual in the projects', (t) => {
			for (const directory of projects) {
				t.test(directory, (t) => {
					const entries = new Entries({strictMode: true});
					const files = [];
					t.test('get a list of files', () => {
						return readdir(path.join(directory, 'src'))
						.then((names) => {
							files.push(
								...names
								.filter((name) => name.endsWith('.js'))
								.map((name) => path.join(directory, 'src', name))
							);
						});
					});
					t.test('parse files', (t) => {
						files.forEach((file, index) => {
							t.test(file, () => {
								return readFile(file, 'utf8')
								.then((code) => {
									const src = index % 2 === 0
									? path.relative(process.cwd(), file)
									: file;
									entries.parse(code, src);
								});
							});
						});
						t.end();
					});
					t.test('load translations', () => {
						return readFile(path.join(directory, 'src', 'translation.json'), 'utf8')
						.then(JSON.parse)
						.then((data) => {
							entries.load(data);
						});
					});
					t.test('toJSON() throws an error', (t) => {
						return Promise.resolve()
						.then(() => entries.toJSON())
						.then(() => {
							throw new Error('Resolved unexpectedly');
						})
						.catch((error) => {
							t.ok(['ENOTTRANSLATED', 'EUNUSED'].includes(error.code));
						});
					});
					t.end();
				});
			}
			t.end();
		});
		t.end();
	});
	t.test('reset src', (t) => {
		const entries = new Entries({strictMode: true});
		entries.parse('translate("foo")', 'foo.js');
		t.match(
			Array.from(entries).map((entry) => Array.from(entry.src)),
			[['foo.js:1']]
		);
		entries.parse('\ntranslate("foo")', 'foo.js');
		t.match(
			Array.from(entries).map((entry) => Array.from(entry.src)),
			[['foo.js:2']]
		);
		t.end();
	});
	t.test('keep unused phrases', (t) => {
		const entries = new Entries();
		entries.load({
			langs: {en: 1},
			phrases: {
				bar: {en: 'bar'},
			},
		});
		t.match(entries.toJSON(), {
			langs: {en: 1},
			phrases: {
				bar: {
					'en': 'bar',
					'@': {length: 0},
				},
			},
		});
		t.end();
	});
	t.test('Translator', (t) => {
		t.test('set translations on construction', (t) => {
			const translator = new Translator({
				langs: {en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			t.equal(translator.translate('foo'), 'bar');
			t.end();
		});
		t.test('set translations later', (t) => {
			const translator = new Translator();
			translator.load({
				langs: {en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			t.equal(translator.translate('foo'), 'bar');
			t.end();
		});
		t.test('use current lang', (t) => {
			const translator = new Translator();
			translator.load({
				langs: {en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			translator.load({
				langs: {es: 1, en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			t.equal(translator.lang, 'en');
			t.end();
		});
		t.test('use available lang', (t) => {
			const translator = new Translator();
			translator.load({
				langs: {en: 1},
				phrases: {foo: {en: 'bar'}},
			});
			translator.load({
				langs: {es: 1},
				phrases: {foo: {en: 'bar'}},
			});
			t.equal(translator.lang, 'es');
			t.end();
		});
		t.test('ignore undefined', (t) => {
			const translator = new Translator({
				langs: {en: 1},
				phrases: {},
			});
			translator.use('en');
			t.equal(translator.translate('foo'), 'foo');
			t.end();
		});
		t.test('ignore null', (t) => {
			const translator = new Translator({
				langs: {en: 1},
				phrases: {foo: {en: null}},
			});
			translator.use('en');
			assert.equal(translator.translate('foo'), 'foo');
			t.end();
		});
		t.end();
	});
	t.end();
});
