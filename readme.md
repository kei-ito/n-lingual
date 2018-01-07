# n-lingual

[![Build Status](https://travis-ci.org/kei-ito/n-lingual.svg?branch=master)](https://travis-ci.org/kei-ito/n-lingual)
[![Build status](https://ci.appveyor.com/api/projects/status/github/kei-ito/n-lingual?branch=master&svg=true)](https://ci.appveyor.com/project/kei-ito/n-lingual/branch/master)
[![codecov](https://codecov.io/gh/kei-ito/n-lingual/branch/master/graph/badge.svg)](https://codecov.io/gh/kei-ito/n-lingual)
[![dependencies Status](https://david-dm.org/kei-ito/n-lingual/status.svg)](https://david-dm.org/kei-ito/n-lingual)
[![devDependencies Status](https://david-dm.org/kei-ito/n-lingual/dev-status.svg)](https://david-dm.org/kei-ito/n-lingual?type=dev)

## Installation

```bash
npm install --save-dev n-lingual
```

## Usage

First, create a translator.

```javascript
// translate.js
const {Translator} = require('n-lingual');
const translations = require('./translations.json');
module.exports = new Translator(translations);
```

Second, use it in your apps.

```javascript
// main.js
const {translate} = require('./translate.js');
for (const lang of ['en', 'fr', 'ja']) {
  translate.use(lang);
  console.log(translate('Hello'));
  console.log(translate('N days', {count: 1}));
  console.log(translate('N days', {count: 2}));
}
```

Then, parse the scripts to extract `translate(...)`.

```javascript
// extract.js (used on development)
const fs = require('fs');
const {Entries} = require('n-lingual');
const entries = new Entries();
const code = fs.readFileSync('main.js');
entries.parse(code);
fs.writeFileSync('translation.json', entries.toJSON());
```

The script above generates translation.json.

```json
{
  "langs": {
    "en": 1
  },
  "phrases": {
    "Hello": {
      "en": null
    },
    "N days": {
      "en": null,
    }
  }
}
```

The translation.json has **langs** and **phrases**.

- **langs**: A map from *language id* to *plural rule id*.
- **phrases**: A map from *phrase id* to **translations**.
- **translations**: A map from *language id* to *translated*.
- *language id*: A string (example: `"fr"`).
- *plural rule id*: A number or a string (`1`). See [Localization and Plurals](https://developer.mozilla.org/docs/Localization_and_Plurals) for details.
- *phrase id*: A string extracted by the `Entries.prototype.parse()` (`"Hello"`).
- *translated*: A string to be set by you (`"Bonjour"`).

Suppose that you edited the translation.json as below.

```json
{
  "langs": {
    "en": 1,
    "fr": 1,
    "ja": 0
  },
  "phrases": {
    "Hello": {
      "en": "Hello",
      "fr": "Bonjour",
      "ja": "こんにちは"
    },
    "N days": {
      "en": "{{count}} {{count:day,days}}",
      "fr": "{{count}} {{count:jour,jours}}",
      "ja": "{{count}} 日"
    }
  }
}
```

The main.js will output the translated texts.

```javascript
// main.js
const {translate} = require('./translate.js');
for (const lang of ['en', 'fr', 'ja']) {
  translate.use(lang);
  console.log(translate('Hello'));
  console.log(translate('N days', {count: 1}));
  console.log(translate('N days', {count: 2}));
}
// Hello
// 1 day
// 2 days
// Bonjour
// 1 jour
// 2 jours
// こんにちは
// 1 日
// 2 日
```

## License

MIT
