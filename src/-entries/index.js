const fs = require('fs');
const console = require('console');
const acorn = require('acorn');
const {walker} = require('@nlib/ast');
const promisify = require('@nlib/promisify');
const readFile = promisify(fs.readFile);
const Entry = require('../-entry');
const LineBreaks = require('../-line-breaks');

module.exports = class Entries extends Array {

	constructor({
		cwd = process.cwd(),
		acorn = {
			ecmaVersion: 8,
			sourceType: 'module',
		},
		functionNames = [
			'translate',
			'addPhrase',
		],
		langs = {en: 1},
		strictMode = false,
	} = {}) {
		Object.assign(super(), {
			cwd,
			acorn,
			functionNames,
			langs,
			strictMode,
		});
	}

	find(phrase) {
		return super.find((entry) => entry.phrase === phrase);
	}

	add({phrase, src, line}) {
		let ph = this.find(phrase);
		if (!ph) {
			ph = new Entry(phrase, this);
			this.push(ph);
		}
		ph.addSrc(src, line);
		return ph;
	}

	parseCode(code, src) {
		const ast = acorn.parse(code, this.acorn);
		const lineBreaks = new LineBreaks(code);
		for (const {type, callee, arguments: args} of walker(ast)) {
			if (type === 'CallExpression' && this.functionNames.includes(callee.name) && args) {
				const [arg] = args;
				if (arg) {
					this.add({
						phrase: arg.value,
						src,
						line: lineBreaks.lineAt(arg.start),
					});
				}
			}
		}
	}

	parseFile(file) {
		return readFile(file, 'utf8')
		.then((code) => this.parseCode(code, file));
	}

	loadJSON(file) {
		return readFile(file, 'utf8')
		.then(JSON.parse)
		.then((data) => {
			return this.load(data);
		});
	}

	load(data) {
		if (data.langs) {
			this.langs = data.langs;
			delete data.langs;
		}
		for (const phrase of Object.keys(data)) {
			const entry = this.find(phrase);
			if (entry) {
				entry.setTranslations(data[phrase]);
			} else {
				console.log(`Deleted: ${phrase}`);
			}
		}
	}

	toJSON() {
		return this.reduce((result, entry) => {
			const [key, value] = entry.toJSON();
			result[key] = value;
			return result;
		}, {langs: this.langs});
	}

};
