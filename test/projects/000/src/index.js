const console = require('console');
const {translate, addPhrase} = require('');
console.log(translate('foo'));
console.log(translate('foo'));
console.log(translate('N days'));
console.log(translate());
const foo = addPhrase('foo');
console.log(translate(foo));
require('./foo');
require('./bar');
