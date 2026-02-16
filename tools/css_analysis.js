const css = require('css')

const fs = require('fs')


let css_data = fs.readFileSync('css/styles1-galactic.css').toString()


let obj = css.parse(css_data, {});

console.dir(obj,{ depth : 8 })
//console.log(css.stringify(obj, {}));



