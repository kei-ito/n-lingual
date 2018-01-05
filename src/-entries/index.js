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

	findIndex(phrase) {
		return super.findIndex((entry) => entry.phrase === phrase);
	}

	find(phrase) {
		return this[this.findIndex(phrase)];
	}

	add({phrase, src, line}) {
		let found = this.find(phrase);
		if (!found) {
			let label = phrase.toLowerCase();
			found = new Entry(phrase, this);
			for (let i = 0; i < this.length; i++) {
				const entry = this[i];
				if (label < entry.phrase.toLowerCase()) {
					this.splice(i, 0, found);
					label = null;
					break;
				}
			}
			if (label) {
				this.push(found);
			}
		}
		found.addSrc(src, line);
		return found;
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

	load([langs, ...entries]) {
		this.langs = langs;
		for (const [phrase, translations] of entries) {
			const entry = this.find(phrase);
			if (entry) {
				entry.setTranslations(translations);
			} else {
				console.log(`Deleted: ${phrase}`);
			}
		}
	}

	toJSON(options) {
		return [
			this.langs,
			...super.map((entry) => entry.toJSON(options))
		];
	}

	toMinifiedJSON(options) {
		const result = [];
		for (const lang of Object.keys(this.langs)) {
			result.push([lang, this.langs[lang], ...super.map((entry) => {
				const [, translations] = entry.toJSON(options);
				return translations[lang];
			})]);
		}
		return result;
	}

};
