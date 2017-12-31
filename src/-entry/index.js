const path = require('path');
const console = require('console');
module.exports = class Entry {

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

	addSrc(src, line) {
		src = (path.isAbsolute(src) ? path.relative(this.cwd, src) : src).split(path.sep).join('/');
		this.src.add(`${src}:${line}`);
	}

	setTranslations(translations) {
		for (const lang of this.langs) {
			this.translations[lang] = translations[lang];
		}
	}

	toJSON() {
		const translations = {};
		for (const lang of this.langs) {
			let translation = this.translations[lang];
			if (typeof translation !== 'string') {
				const message = `[n-lingual] ${this.phrase} is not translated to ${lang}.`;
				if (this.strictMode) {
					const error = new Error(message);
					error.code = 'ENOTTRANSLATED';
					throw error;
				} else {
					console.log(message);
				}
				translation = null;
			}
			translations[lang] = translation;
		}
		translations['@'] = Array.from(this.src);
		return [this.phrase, translations];
	}

};
