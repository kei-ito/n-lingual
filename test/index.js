const fs = require('fs');
const path = require('path');
const promisify = require('@nlib/promisify');
const readdir = promisify(fs.readdir);
const test = require('@nlib/test');
const {Entries} = require('..');

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
				test('toJSON', (test) => {
					test.object(entries.toJSON(), {
						foo: {
							en: 'baz',
						},
						bar: {
							en: null,
						},
					});
				});
			});
		}
	});
});
