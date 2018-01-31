const acorn = require('acorn');
const MagicString = require('magic-string');
const {walker} = require('@nlib/ast');
const Entry = require('../-entry');
const LineBreaks = require('../-line-breaks');
const noop = () => {};

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
		extractor = ({type, callee, arguments: args}, src, fn, lineBreaks) => {
			if (type === 'CallExpression' && functionNames.includes(callee.name) && args) {
				const [arg] = args;
				if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
					const entry = this.add({
						phrase: arg.value,
						src,
						line: lineBreaks.lineAt(arg.start),
					});
					fn(entry, arg);
				}
			}
		},
	} = {}) {
		Object.assign(super(), {
			cwd,
			acorn,
			langs,
			strictMode,
			extractor,
		});
	}

	get usedPhrases() {
		return super.filter(({src}) => 0 < src.size);
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
			found = new Entry(phrase, this);
			this.push(found);
		}
		if (src) {
			found.addSrc(src, line);
		}
		return found;
	}

	resetSrc(src) {
		for (const phrase of this) {
			phrase.resetSrc(src);
		}
	}

	parse(code, src, fn = noop) {
		this.resetSrc(src);
		const ast = acorn.parse(code, this.acorn);
		const lineBreaks = new LineBreaks(code);
		for (const node of walker(ast)) {
			this.extractor(node, src, fn, lineBreaks);
		}
		// for (const {type, callee, arguments: args} of walker(ast)) {
		// 	if (type === 'CallExpression' && this.functionNames.includes(callee.name) && args) {
		// 		const [arg] = args;
		// 		if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
		// 			const entry = this.add({
		// 				phrase: arg.value,
		// 				src,
		// 				line: lineBreaks.lineAt(arg.start),
		// 			});
		// 			fn(entry, arg);
		// 		}
		// 	}
		// }
	}

	minify(code, src) {
		const s = new MagicString(code);
		this.parse(code, src, (entry, node) => {
			s.overwrite(node.start, node.end, `${entry.index}`);
		});
		return {
			code: s.toString(),
			map: s.generateMap(),
		};
	}

	load({langs, phrases}) {
		this.langs = langs;
		for (const phrase of Object.keys(phrases)) {
			this.add({phrase}).setTranslations(phrases[phrase]);
		}
	}

	getPhrases(options) {
		const phrases = {};
		for (const entry of this.strictMode ? this.usedPhrases : this) {
			const [phrase, translations] = entry.toJSON(options);
			phrases[phrase] = translations;
		}
		return phrases;
	}

	toJSON(options) {
		return {
			langs: this.langs,
			phrases: this.getPhrases(options),
		};
	}

	toMinifiedJSON(options) {
		const result = [];
		for (const lang of Object.keys(this.langs)) {
			result.push([lang, this.langs[lang], ...(this.strictMode ? this.usedPhrases : this).map((entry) => {
				const [, translations] = entry.toJSON(options);
				return translations[lang];
			})]);
		}
		return result;
	}

};
