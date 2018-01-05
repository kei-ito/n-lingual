module.exports = class Translator extends Map {

	// https://developer.mozilla.org/docs/Mozilla/Localization/Localization_and_Plurals
	// https://hg.mozilla.org/integration/autoland/file/tip/intl/locale/PluralForm.jsm
	static pluralFunction(rule) {
		switch (rule) {
		case 0:
			return () => {
				return 0;
			};
		case 1:
			return (n) => {
				return n === 1 ? 0 : 1;
			};
		case 2:
			return (n) => {
				return 1 < n ? 1 : 0;
			};
		case 3:
			return (n) => {
				return n % 10 === 0 ? 0 : n % 10 === 1 && n % 100 !== 11 ? 1 : 2;
			};
		case 4:
			return (n) => {
				return n === 1 || n === 11 ? 0 : n === 2 || n === 12 ? 1 : isIn(n, 3, 10) || isIn(n, 13, 19) ? 2 : 3;
			};
		case 5:
			return (n) => {
				return n === 1 ? 0 : n === 0 || isIn(n % 100, 1, 19) ? 1 : 2;
			};
		case 6:
			return (n) => {
				const d1 = n % 100;
				const d2 = d1 % 10;
				return d2 === 1 && d1 !== 11 ? 0 : d2 === 0 || isIn(d1, 10, 20) ? 1 : 2;
			};
		case 7:
			return (n) => {
				const d1 = n % 100;
				const d2 = d1 % 10;
				return d2 === 1 && d1 !== 11 ? 0 : isIn(d2, 2, 4) && !isIn(d1, 12, 14) ? 1 : 2;
			};
		case 8:
			return (n) => {
				return n === 1 ? 0 : isIn(n, 2, 4) ? 1 : 2;
			};
		case 9:
			return (n) => {
				return n === 1 ? 0 : isIn(n % 10, 2, 4) && !isIn(n % 100, 12, 14) ? 1 : 2;
			};
		case 10:
			return (n) => {
				const d = n % 100;
				return d === 1 ? 0 : d === 2 ? 1 : d === 3 || d === 4 ? 2 : 3;
			};
		case 11:
			return (n) => {
				return n === 1 ? 0 : n === 2 ? 1 : isIn(n, 3, 6) ? 2 : isIn(n, 7, 10) ? 3 : 4;
			};
		case 12:
			return (n) => {
				const d = n % 100;
				return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : d >= 3 && d <= 10 ? 3 : d >= 11 ? 4 : 5;
			};
		case 13:
			return (n) => {
				const d = n % 100;
				return n === 1 ? 0 : n === 0 || isIn(d, 1, 10) ? 1 : isIn(d, 11, 19) ? 2 : 3;
			};
		case 14:
			return (n) => {
				const d = n % 10;
				return d === 1 ? 0 : d === 2 ? 1 : 2;
			};
		case 15:
			return (n) => {
				return n % 10 === 1 && n !== 11 ? 0 : 1;
			};
		case 16:
			return (n) => {
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
			};
		case 17:
			return (n) => {
				return n === 0 ? 0 : 1;
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
