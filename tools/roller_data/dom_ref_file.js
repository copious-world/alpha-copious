
const fs = require('fs')

let grep_results = fs.readFileSync('tools/dom_calls.txt').toString()
//

let lines = grep_results.split('\n')

let file_set = {}
for ( let line of lines ) {
    line = line.trim()
    if ( line.length === 0 ) continue
    let lparts = line.split(':')
    let ky = lparts[0]
    let p = file_set[ky]
    file_set[ky] = p ? p+1 : 1
}

console.log("FILES: ",Object.keys(file_set).length)
console.dir(file_set)
