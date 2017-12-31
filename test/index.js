const assert = require('assert');
const fs = require('fs');
const path = require('path');
const promisify = require('@nlib/promisify');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const test = require('@nlib/test');
const {Entries, Translator} = require('..');

test('nLingual', (test) => {
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
							...names
							.filter((name) => name.endsWith('.js'))
							.map((name) => path.join(directory, 'src', name))
						);
					});
				});
				test('parse files', (test) => {
					for (const file of files) {
						test(file, () => entries.parseFile(file));
					}
				});
				test('load translations', () => {
					return entries.loadJSON(path.join(directory, 'src', 'translation.json'));
				});
				test('load an empty object', () => {
					entries.load({});
				});
				test('load expected translations', (test) => {
					return readFile(path.join(directory, 'expected-translation.json'), 'utf8')
					.then(JSON.parse)
					.then((expected) => {
						test.object(entries.toJSON(), expected);
					});
				});
				test('run tests', (test) => {
					const translator = new Translator(entries);
					return readFile(path.join(directory, 'tests.json'), 'utf8')
					.then((json) => {
						for (const [lang, tests] of JSON.parse(json)) {
							translator.use(lang);
							for (const [phrase, params, expected] of tests) {
								test(`${phrase} ${JSON.stringify(params)} → ${expected}`, () => {
									assert.equal(translator.translate(phrase, params), expected);
								});
							}
						}
					});
				});
			});
		}
	});
});
