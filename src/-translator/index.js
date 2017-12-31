module.exports = class Translator extends Map {

	static pluralFunction(rule) {
		switch (rule) {
		case 0:
			return () => {
				return 0;
			};
		case 1:
			return (value) => {
				return value === 1 ? 0 : 1;
			};
		case 2:
			return (value) => {
				if (value === 0 || value === 1) {
					return 0;
				}
				return 1;
			};
		case 3:
			return (value) => {
				if (value === 0) {
					return 0;
				} else if (value % 10 === 1 && value !== 11) {
					return 1;
				}
				return 2;
			};
		case 4:
			return (value) => {
				if (value === 1) {
					return 0;
				} else if (value === 2) {
					return 1;
				}
				return 2;
			};
		case 5:
			return (value) => {
				if (value === 1) {
					return 0;
				} else if (value === 0 || isIn(value % 100, 1, 19)) {
					return 1;
				}
				return 2;
			};
		case 6:
			return (value) => {
				if (value % 10 === 1 && value % 100 !== 11) {
					return 0;
				} else if (value % 10 === 0 || isIn(value % 100, 10, 20)) {
					return 1;
				}
				return 2;
			};
		case 7:
			return (value) => {
				if (value % 10 === 1 && value % 100 !== 11) {
					return 0;
				} else if (isIn(value % 10, 2, 4) && !isIn(value % 100, 12, 14)) {
					return 1;
				}
				return 2;
			};
		case 8:
			return (value) => {
				if (value === 1) {
					return 0;
				} else if (isIn(value, 2, 4)) {
					return 1;
				}
				return 2;
			};
		case 9:
			return (value) => {
				if (value === 1) {
					return 0;
				} else if (isIn(value % 10, 2, 4) && !isIn(value % 100, 12, 14)) {
					return 1;
				}
				return 2;
			};
		case 10:
			return (value) => {
				if (value % 100 === 1) {
					return 0;
				} else if (value % 100 === 2) {
					return 1;
				} else if (isIn(value % 100, 3, 4)) {
					return 2;
				}
				return 3;
			};
		case 11:
			return (value) => {
				if (value === 1) {
					return 0;
				} else if (value === 2) {
					return 1;
				} else if (isIn(value, 3, 6)) {
					return 2;
				} else if (isIn(value, 7, 10)) {
					return 3;
				}
				return 4;
			};
		case 12:
			return (value) => {
				if (value === 1) {
					return 0;
				} else if (value === 2) {
					return 1;
				} else if (value === 0 || isIn(value, 3, 10)) {
					return 2;
				}
				return 3;
			};
		case 13:
			return (value) => {
				if (value === 1) {
					return 0;
				} else if (value === 0 || isIn(value % 100, 1, 10)) {
					return 1;
				} else if (isIn(value % 100, 11, 19)) {
					return 2;
				}
				return 3;
			};
		case 14:
			return (value) => {
				if (value % 10 === 1) {
					return 0;
				} else if (value % 10 === 2) {
					return 1;
				}
				return 2;
			};
		}
	}

	constructor(entries) {
		Object.assign(
			super(),
			{entries}
		);
	}

	use(lang) {
		this.lang = lang;
		this.pluralFunction = Translator.pluralFunction(this.entries.langs[lang]);
		this.clear();
		for (const entry of this.entries) {
			this.set(entry.phrase, entry.translations[lang]);
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

}

function isIn(x, min, max) {
	return x % 1 === 0 && min <= x && x <= max;
}
