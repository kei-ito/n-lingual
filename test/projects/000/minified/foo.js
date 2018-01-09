const console = require('console');
const {translate} = require('n-lingual');
console.log(translate(0));
console.log(translate(2, {bar: 'barbar'}));
console.log(translate(3, {bar: 'barbar'}));
