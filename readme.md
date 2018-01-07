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
module.exports = new Translator(translations).translate;
```

Second, use it in your apps.

```javascript
// main.js
const {translate} = require('./translate.js');
console.log(translate('Hello'));
console.log(translate('N days', {count: 0}));
console.log(translate('N days', {count: 1}));
console.log(translate('N days', {count: 2}));
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
[
  {
    "en": 1
  },
  [
    "Hello",
    {
      "en": null,
    }
  ],
  [
    "N days",
    {
      "en": null,
    }
  ]
]
```

The translation.json is an array.
The first item is an object of languages (**langs**).
The others are phrases to be translated (**phrases**).

## License

MIT
