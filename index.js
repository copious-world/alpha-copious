const fs = require('fs')
const FuncToExport = require('./lib/to_export')

let data = fs.readFileSync('./client/base_string.js').toString()

let f_to_e = new FuncToExport(data)

fs.writeFileSync('./modules/base_string.js',f_to_e.function_to_exports(f_to_e.code))
