const path = require('path');
const console = require('console');
const acorn = require('acorn');
const MagicString = require('magic-string');
const {walker} = require('@nlib/ast');
const noop = () => {};

export class LineBreaks extends Array {

	constructor(source) {
		super();
		source.replace(/\r\n|\r|\n/g, (match, index) => {
			this.push(index);
		});
		this.push(Infinity);
	}

	lineAt(index) {
		return this.findIndex((x) => index < x) + 1;
	}

}

export class Entry {

	constructor(phrase, entries) {
		Object.assign(this, {
			entries,
			phrase,
			src: new Set(),
			translations: {},
		});
	}

	get langs() {
		return Object.keys(this.entries.langs);
	}

	get strictMode() {
		return this.entries.strictMode;
	}

	get cwd() {
		return this.entries.cwd;
	}

	get index() {
		return this.entries.indexOf(this);
	}

	normalizeSrc(src) {
		return (path.isAbsolute(src) ? path.relative(this.cwd, src) : src).split(path.sep).join('/');
	}

	addSrc(src, line) {
		this.src.add(`${this.normalizeSrc(src)}:${line}`);
	}

	resetSrc(src) {
		src = this.normalizeSrc(src);
		for (const label of this.src) {
			if (label.startsWith(src)) {
				this.src.delete(label);
			}
		}
	}

	setTranslations(translations) {
		for (const lang of this.langs) {
			this.translations[lang] = translations[lang];
		}
	}

	toJSON({silent = false} = {}) {
		const translations = {};
		for (const lang of this.langs) {
			let translation = this.translations[lang];
			if (typeof translation !== 'string') {
				const message = `[n-lingual] ${this.phrase} is not translated to ${lang}.`;
				if (this.strictMode) {
					const error = new Error(message);
					error.code = 'ENOTTRANSLATED';
					throw error;
				} else if (!silent) {
					console.log(message);
				}
				translation = null;
			}
			translations[lang] = translation;
		}
		translations['@'] = Array.from(this.src).sort();
		return [this.phrase, translations];
	}

}

export class Entries extends Array {

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

	checkUsage() {
		for (const entry of this) {
			if (!(0 < entry.src.size)) {
				throw Object.assign(new Error(`${entry.phrase} is not used`), {code: 'EUNUSED'});
			}
		}
		return this;
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
	}

	minify(code, src) {
		const s = new MagicString(code);
		this.parse(code, src, (entry, node) => s.overwrite(node.start, node.end, `${entry.index}`));
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
		for (const entry of this.strictMode ? this.checkUsage() : this) {
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
			result.push([lang, this.langs[lang], ...(this.strictMode ? this.checkUsage() : this).map((entry) => {
				const [, translations] = entry.toJSON(options);
				return translations[lang];
			})]);
		}
		return result;
	}

}

// http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
// https://developer.mozilla.org/docs/Mozilla/Localization/Localization_and_Plurals
// https://hg.mozilla.org/integration/autoland/file/tip/intl/locale/PluralForm.jsm
// https://github.com/mozilla/gecko-dev/blob/master/intl/locale/PluralForm.jsm
const isIn = (x, min, max) => min <= x && x <= max;
exports const pluralRules = [
	() => 0,
	(n) => n === 1 ? 0 : 1,
	(n) => 1 < n ? 1 : 0,
	(n) => n % 10 === 0 ? 0 : n % 10 === 1 && n % 100 !== 11 ? 1 : 2,
	(n) => n === 1 || n === 11 ? 0 : n === 2 || n === 12 ? 1 : isIn(n, 3, 10) || isIn(n, 13, 19) ? 2 : 3,
	(n) => n === 1 ? 0 : n === 0 || isIn(n % 100, 1, 19) ? 1 : 2,
	(n) => {
		const d1 = n % 100;
		const d2 = d1 % 10;
		return d2 === 1 && d1 !== 11 ? 0 : d2 === 0 || isIn(d1, 10, 20) ? 1 : 2;
	},
	(n) => {
		const d1 = n % 100;
		const d2 = d1 % 10;
		return d2 === 1 && d1 !== 11 ? 0 : isIn(d2, 2, 4) && !isIn(d1, 12, 14) ? 1 : 2;
	},
	(n) => n === 1 ? 0 : isIn(n, 2, 4) ? 1 : 2,
	(n) => n === 1 ? 0 : isIn(n % 10, 2, 4) && !isIn(n % 100, 12, 14) ? 1 : 2,
	(n) => {
		const d = n % 100;
		return d === 1 ? 0 : d === 2 ? 1 : d === 3 || d === 4 ? 2 : 3;
	},
	(n) => n === 1 ? 0 : n === 2 ? 1 : isIn(n, 3, 6) ? 2 : isIn(n, 7, 10) ? 3 : 4,
	(n) => {
		const d = n % 100;
		return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : isIn(d, 3, 10) ? 3 : isIn(d, 11, 99) ? 4 : 5;
	},
	(n) => {
		const d = n % 100;
		return n === 1 ? 0 : n === 0 || isIn(d, 1, 10) ? 1 : isIn(d, 11, 19) ? 2 : 3;
	},
	(n) => {
		const d = n % 10;
		return d === 1 ? 0 : d === 2 ? 1 : 2;
	},
	(n) => n % 10 === 1 && n !== 11 ? 0 : 1,
	(n) => {
		if (n === 1) {
			return 0;
		} else {
			const dd = n % 100;
			const d1 = dd % 10;
			const d2 = (dd - d1) / 10;
			const not179 = d2 !== 1 && d2 !== 7 && d2 !== 9;
			if (d1 === 1 && not179) {
				return 1;
			} else if (d1 === 2 && not179) {
				return 2;
			} else if ((d1 === 3 || d1 === 4 || d1 === 9) && not179) {
				return 3;
			} else if (n !== 0 && n % 1000000 === 0) {
				return 4;
			} else {
				return 5;
			}
		}
	},
	(n) => n === 0 ? 0 : 1,
];

export class Translator {

	constructor(entries, pluralFunctions = defaultPluralFunctions) {
		Object.assign(
			this,
			{
				pluralFunctions,
				translate: this.translate.bind(this),
			}
		);
		if (entries) {
			this.load(entries);
		}
	}

	load(entries) {
		const langs = {};
		const translations = {};
		let phrases;
		if (Array.isArray(entries)) {
			for (const entry of entries) {
				const lang = entry.shift();
				const rule = entry.shift();
				langs[lang] = rule;
				translations[lang] = entry;
			}
		} else {
			Object.assign(langs, entries.langs);
			const langKeys = Object.keys(langs);
			for (const lang of langKeys) {
				translations[lang] = [];
			}
			phrases = [];
			for (const phrase of Object.keys(entries.phrases)) {
				phrases.push(phrase);
				const translation = entries.phrases[phrase];
				for (const lang of langKeys) {
					translations[lang].push(translation[lang]);
				}
			}
		}
		Object.assign(this, {langs, phrases, translations})
		.use(this.lang in langs ? this.lang : Object.keys(langs)[0]);
	}

	use(lang) {
		const pluralFunction = this.pluralFunctions[this.langs[lang]];
		if (pluralFunction) {
			this.lang = lang;
			this.pluralFunction = pluralFunction;
			const dictionary = new Map();
			const translations = this.translations[lang];
			if (this.phrases) {
				for (let i = 0; i < translations.length; i++) {
					dictionary.set(this.phrases[i], translations[i]);
				}
			} else {
				for (let i = 0; i < translations.length; i++) {
					dictionary.set(i, translations[i]);
				}
			}
			this.dictionary = dictionary;
		}
		return this;
	}

	translate(phrase, params) {
		const translated = this.dictionary.get(phrase);
		if (typeof translated !== 'string') {
			return phrase;
		}
		return params
		? translated
		.replace(/\{\{\s*([^{}\r\n]+?)\s*\}\}/g, (match, translation) => {
			const [key, forms] = translation.split(/\s*\|\s*/);
			const value = params[key];
			return forms ? forms.split(/\s*,\s*/)[this.pluralFunction(value)] : value;
		})
		: translated;
	}

}
