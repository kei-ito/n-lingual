const defaultPluralFunctions = require('../plural-rules');

module.exports = class Translator extends Map {

	constructor(entries, pluralFunctions = defaultPluralFunctions) {
		super();
		this.pluralFunctions = pluralFunctions;
		if (entries) {
			this.load(entries);
		}
	}

	load(entries) {
		const langs = {};
		const translations = {};
		let phrases;
		if (Array.isArray(entries[0])) {
			for (const entry of entries) {
				const lang = entry.shift();
				const rule = entry.shift();
				langs[lang] = rule;
				translations[lang] = entry;
			}
		} else {
			Object.assign(langs, entries.shift());
			phrases = entries.map((entry) => entry[0]);
			for (const lang of Object.keys(langs)) {
				translations[lang] = entries.map(([, translations]) => translations[lang]);
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
	}

	use(lang) {
		this.lang = lang;
		this.pluralFunction = this.pluralFunctions[this.langs[lang]];
		if (!this.pluralFunction) {
			throw new Error(`Invalid plural rule: ${this.langs[lang]}`);
		}
		this.clear();
		const translations = this.translations[lang];
		if (this.phrases) {
			for (let i = 0; i < translations.length; i++) {
				this.set(this.phrases[i], translations[i]);
			}
		} else {
			for (let i = 0; i < translations.length; i++) {
				this.set(i, translations[i]);
			}
		}
	}

	translate(phrase, params) {
		const translated = this.get(phrase);
		if (typeof translated === 'undefined') {
			return phrase;
		}
		return translated
		.replace(/\{\{\s*([^{}\r\n]+?)\s*\}\}/g, (match, translation) => {
			const [key, forms] = translation.split(/\s*\|\s*/);
			const value = params[key];
			return forms ? forms.split(/\s*,\s*/)[this.pluralFunction(value)] : value;
		});
	}

};
