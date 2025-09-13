


// let pars = process.argv[2]
// console.log(pars)
// if ( pars === undefined ) {
//     console.log("missing parameter file *.json")
//     process.exit(0)
// }


const fs = require('fs')
let levenshtein = require('fast-levenshtein');
const {diffLines, createPatch} = require('diff');



let findable = "../for-humans/shared_constants.js"
let checks = {
    "PWA-template" : "../PWA/template/index.html",
    "PWA_app" : "../../PWA-apps/safe-recorder/recorder-PWA.html",
    "websites_copious" : "../../websites/copious/staging/index.html",
    "websites_popsong" : "../../websites/popsong/staging/index.html",
    "websites_villa-family" : "../../websites/villa-family/staging/index.html",
    "websites_bakersfield-robot" : "../../websites/bakersfield-robot/staging/index.html",
    "websites_of-this-world-instance" : "../../of-this-world/templates/humans/have_a_nice.html",
    "websites_of-this-world-current" : "../../of-this-world/templates/humans/current.html",
    "websites_of-this-world" : "../../of-this-world/templates/humans/index.html",
    "websites_of-this-world-igid" : "../../of-this-world/igid-manager/public/index.html",
    "control-test" : "/Users/richardalbertleddy/Documents/GitHub/alphas/of-this-world/igid-manager/template/index.html"
}


let checkable = fs.readFileSync(findable).toString()
let report = {}

let diffs  = {}

checkable = checkable.substring(checkable.indexOf("// SHARED CONSTANTS"))
checkable = checkable.substring(0,checkable.indexOf("let g_"))


let dist_levenshtien_check = levenshtein.get(checkable,checkable)

console.log("dist_levenshtien_check",dist_levenshtien_check)


for ( let [key,item] of Object.entries(checks) ) {
    console.log(key,item)

    let target = fs.readFileSync(item).toString()

    // SHARED CONSTANTS
    if ( target.indexOf("// SHARED CONSTANTS") ) {
        target = target.substring(target.indexOf("// SHARED CONSTANTS"))
        target = target.substring(0,target.indexOf("let g_"))
    }
    

    let dist = levenshtein.get(checkable,target)

    report[key] = dist

    if ( dist < 2000 ) {
        diffs[key] = diffLines(checkable,target)
    }

}

console.log("\n")


let keys = Object.keys(checks)

keys.sort((a,b) => {
    let aa = report[a]
    let bb = report[b]
    return aa - bb
})

for ( let ky of keys ) {
    console.log(`${ky} ${report[ky]}`)
}




for ( let ky of keys ) {
    let diff = diffs[ky]

    if ( diff === undefined ) continue


    console.log("\n--------------------------------")
    console.log(`diff: ${report[ky]}  --> ${checks[ky]}`)

    diff.forEach((part) => {
        // green for additions, red for deletions
        let text = part.value
        if ( text === undefined ) return

        if ( part.added ) {
            text = "???+++++++ " + text
        } else {
            text = "???------- " + text
        }
        
        process.stderr.write(text);
    });

}


