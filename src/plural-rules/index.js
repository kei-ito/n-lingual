const isIn = (x, min, max) => min <= x && x <= max;
// http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
// https://developer.mozilla.org/docs/Mozilla/Localization/Localization_and_Plurals
// https://hg.mozilla.org/integration/autoland/file/tip/intl/locale/PluralForm.jsm
// https://github.com/mozilla/gecko-dev/blob/master/intl/locale/PluralForm.jsm
exports.pluralRules = [
    () => {
        return 0;
    },
    (n) => {
        return n === 1 ? 0 : 1;
    },
    (n) => {
        return 1 < n ? 1 : 0;
    },
    (n) => {
        return n % 10 === 0 ? 0 : n % 10 === 1 && n % 100 !== 11 ? 1 : 2;
    },
    (n) => {
        return n === 1 || n === 11 ? 0 : n === 2 || n === 12 ? 1 : isIn(n, 3, 10) || isIn(n, 13, 19) ? 2 : 3;
    },
    (n) => {
        return n === 1 ? 0 : n === 0 || isIn(n % 100, 1, 19) ? 1 : 2;
    },
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
    (n) => {
        return n === 1 ? 0 : isIn(n, 2, 4) ? 1 : 2;
    },
    (n) => {
        return n === 1 ? 0 : isIn(n % 10, 2, 4) && !isIn(n % 100, 12, 14) ? 1 : 2;
    },
    (n) => {
        const d = n % 100;
        return d === 1 ? 0 : d === 2 ? 1 : d === 3 || d === 4 ? 2 : 3;
    },
    (n) => {
        return n === 1 ? 0 : n === 2 ? 1 : isIn(n, 3, 6) ? 2 : isIn(n, 7, 10) ? 3 : 4;
    },
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
    (n) => {
        return n % 10 === 1 && n !== 11 ? 0 : 1;
    },
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
    (n) => {
        return n === 0 ? 0 : 1;
    },
];
