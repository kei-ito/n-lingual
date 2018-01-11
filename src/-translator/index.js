const defaultPluralFunctions = require('../plural-rules');

module.exports = class Translator {

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
		Object.assign(
			this,
			{
				langs,
				phrases,
				translations,
			}
		);
		this.use(this.lang in langs ? this.lang : Object.keys(langs)[0]);
	}

	use(lang) {
		this.lang = lang;
		this.pluralFunction = this.pluralFunctions[this.langs[lang]];
		if (!this.pluralFunction) {
			throw new Error(`Invalid plural rule: ${this.langs[lang]}`);
		}
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

};
