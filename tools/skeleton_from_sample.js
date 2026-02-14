

let defs = {
    "top_level" : true,
    "path_abreviations" : {
        "[alpha-copious]" : "[github]/alphas/alpha-copious",
        "[github]" : "~/GitHub",
        "[websites]" : "[alphas]/websites"
    },
    "ext_default_dir" : {
        "tmplt" : "[alpha-copious]/html",
        "js" : "[alpha-copious]/client",
        "svg" : "[alpha-copious]/icons",
        "css" : "[alpha-copious]/css"
    },
    "top_dir_location" : {
        "script" : "[alpha-copious]/script",
        "for-humans" : "[alpha-copious]/for-humans",
		"messaging" : "[alpha-copious]/for-humans/messaging",
        "files" : "[alpha-copious]/html",
		"frame-apps" : "[alpha-copious]/frame-apps",
		"calendar-owner" : "[alpha-copious]/frame-apps/calendar-owner",
		"counted-media" : "[alpha-copious]/frame-apps/counted-media",
		"igid-manager" : "[alpha-copious]/frame-apps/igid-manager",
		"mail" : "[alpha-copious]/frame-apps/mail",
		"ucwid-ui" : "[alpha-copious]/frame-apps/ucwid-ui",
		"uploader" : "[alpha-copious]/frame-apps/uploader",
		"wallet" : "[alpha-copious]/frame-apps/wallet",
		"databases" : "[alpha-copious]/databases"
    }
}

let most_look_like = 
`
$$html:start_doc_head<<

$$files::header_app.tmplt<<

$$html:end_head<<

$$html:start_style<<
$$css::styles1-galactic.css<<
$$html:end_style<<

$$html:start_script<<
$$files<js>::top_vars<<
$$html:end_script<<

$$html:start_body<<

$$files::nav_bar_B.tmplt<<
$$verbatim::{
<main id='app-main'>
</main>
}

$$files::drop_click.tmplt<<

$$files::footer_A.tmplt<<
$$html:end_body_html<<
//
//
$$html:start_script<<
`


let dirs_of_concern = [
"client",
"databases",
"frame-apps",
"frame-apps/calendar-owner",
"frame-apps/counted-media",
"frame-apps/igid-manager",
"frame-apps/mail",
"frame-apps/ucwid-ui",
"frame-apps/uploader",
"frame-apps/wallet",
"for-humans",
"for-humans/messaging",
"script"
]



let most_end_with = 
`
$$html:end_script<<
`

// ---- ----  -------- ---- ---- ---- ----

function find_its_dir(meat,dir_file_map) {
    for ( let [ky,files] of Object.entries(dir_file_map) ) {
        if ( files.indexOf(meat) >= 0 ) {
            return ky
        }
    }
    return false
}

// ---- ----  -------- ---- ---- ---- ----
const fs = require('fs')
const path = require('path')

let dir_file_map = {}
let html_file_map = {}
for ( let dr of dirs_of_concern ) {
    let files_in_dr = fs.readdirSync(`./${dr}`)
    let html_files_dr = files_in_dr.filter((file) => {
        if ( path.extname(file) === ".html" ) {
            return true
        }
        return false
    })
    files_in_dr = files_in_dr.filter((file) => {
        if ( path.extname(file) === ".js" ) {
            return true
        }
        return false
    })
    dir_file_map[dr] = files_in_dr.map((file) => { return file.replace(".js","")})

    html_file_map[dr] = html_files_dr
}
console.dir(dir_file_map)
//console.dir(html_file_map)

let html_files_to_process = []
for ( let ky in html_file_map ) {
    if ( html_file_map[ky] &&  html_file_map[ky].length ) {
        html_files_to_process.push(`./${ky}/index.html`)
    }
}

console.log(html_files_to_process)

for ( let sample_script of html_files_to_process ) {
    let data = fs.readFileSync(sample_script).toString()

    let lines = data.split("\n")

    lines = lines.map((line) => {
        if ( line.trim().startsWith("// OFFLOADED") ) {
            //
            let meat =  line.substring("// OFFLOADED".length).trim()
            meat = meat.replace('(','').replace(')','')
            if ( meat.indexOf('/') > 0 ) {
                meat = path.basename(meat)
            }
            //
            let itsdr = find_its_dir(meat,dir_file_map)
            if ( itsdr === false ) itsdr = "search-files"
            let output = `
$$script::[${itsdr}]/${meat}.js<<
            `
            //
            return output
        } else {
            return line
        }
    })

    let output = lines.join('\n')
    output = JSON.stringify(defs,null,4) + "\n"  + output

    let fname = sample_script.replace("html","skel")
    fname = fname.replaceAll('/','_').replace('._','')

    fs.writeFileSync(`./tools/gend_skels/${fname}`,output)

    console.log(sample_script)
}
