const path = require('path');
const console = require('console');
exports.Entry = class Entry {

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

    toJSON({silent = false, noSource = false} = {}) {
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
        if (!noSource) {
            translations['@'] = Array.from(this.src).sort();
        }
        return [this.phrase, translations];
    }

};
