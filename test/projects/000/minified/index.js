const console = require('console');
const {translate, addPhrase} = require('n-lingual');
console.log(translate(0));
console.log(translate(0));
console.log(translate(3));
console.log(translate());
const foo = addPhrase(0);
console.log(translate(foo));
require('./bar');
