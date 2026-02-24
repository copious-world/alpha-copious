

const fs = require('fs')
let {PathManager} = require("extra-file-class")

let dir = "./tools/edited_skels"

// ---- 
let file_list = fs.readdirSync(dir)
console.log(file_list)



let bundle_excluded_file = "./tools/roller_data/html_embedded_js.json"
let bundle_excluded = fs.readFileSync(bundle_excluded_file).toString()
bundle_excluded = JSON.parse(bundle_excluded)


let file_table = {}
let file_stem_table = {}
let file_edit_map = {}

let config = {
    "top_level": true,
    "path_abreviations": {
        "[alpha-copious]": "[github]/alphas/alpha-copious",
        "[github]": "~/GitHub",
        "[websites]": "[alphas]/websites",
        "[client]": "[alpha-copious]/client",
        "[for-humans]": "[alpha-copious]/for-humans",
        "[databases]": "[alpha-copious]/databases",
        "[frame-apps]": "[alpha-copious]/frame-apps",
    },
    "ext_default_dir": {
        "tmplt": "[alpha-copious]/html",
        "js": "[alpha-copious]/client",
        "svg": "[alpha-copious]/icons",
        "css": "[alpha-copious]/css"
    },
    "top_dir_location": {
        "script": "[alpha-copious]/script",
        "for-humans": "[alpha-copious]/for-humans",
        "messaging": "[alpha-copious]/for-humans/messaging",
        "files": "[alpha-copious]/html",
        "frame-apps": "[alpha-copious]/frame-apps",
        "calendar-owner": "[alpha-copious]/frame-apps/calendar-owner",
        "counted-media": "[alpha-copious]/frame-apps/counted-media",
        "igid-manager": "[alpha-copious]/frame-apps/igid-manager",
        "mail": "[alpha-copious]/frame-apps/mail",
        "ucwid-ui": "[alpha-copious]/frame-apps/ucwid-ui",
        "uploader": "[alpha-copious]/frame-apps/uploader",
        "wallet": "[alpha-copious]/frame-apps/wallet",
        "databases": "[alpha-copious]/databases"
    }
}


function shift_subdir_backet_path(oskel_lines) {
    oskel_lines = oskel_lines.map((line) => {
        if ( line.startsWith("$$script::") ) {
            let pattern_holder = line.substring("$$script::".length).trim()
            if ( pattern_holder[0] === '[' ) {
                let pattern = pattern_holder.substring(1,pattern_holder.indexOf(']'))
                if ( pattern.indexOf('/') > 0 ) {
                    let pkeepers = pattern.split('/')
                    line = line.replace(pattern,pkeepers[0])
                    let pdir = pkeepers[1]
                    line = line.replace(']',`]/${pdir}`)
                }
            }
        }
        return line
    })
    return oskel_lines
}


let paths = new PathManager(config)

let bundle_excluded_paths = {}
for ( let ky in bundle_excluded ) {
    //
    let fpath = paths.compile_one_path(ky)
    bundle_excluded_paths[paths.basename(ky)] = fpath
    //
}

console.dir(bundle_excluded_paths)




for ( let file of file_list ) {

//    if ( file === "web3-boxy.skel" ) continue
    //
    let data = fs.readFileSync(`${dir}/${file}`).toString()
    let script_lines = data.substring(data.lastIndexOf("$$html:start_script<<"),data.lastIndexOf("$$html:end_script<<"))
    //
    //
    script_lines = script_lines.trim()
    let the_lines = script_lines.split('\n')
    //
    the_lines.shift()
    the_lines = the_lines.map((line) => { return line.trim() })
    the_lines = the_lines.filter((line) => {
        return (line.length > 0) && line.startsWith("$$script::")
    })

    file_table[file] = the_lines

    let stem_map = {}
    file_stem_table[file] = stem_map

    for ( let line of the_lines ) {
        let stem = line.substring(line.lastIndexOf('/')+1,line.lastIndexOf("<<"))
        stem_map[stem] = line
    }

    //
    file_edit_map[file] = {
        "original" : data,
        "script_lines" : [].concat(the_lines)
    }
}


// ----

let stems_excluded = Object.keys(bundle_excluded_paths)

for ( let file in file_edit_map ) {
    let lines = file_edit_map[file].script_lines
    let bundled = lines.filter((line) => {
        if ( line.startsWith("$$script::[app<scripts>]") ) return false
        let stem = line.substring(line.lastIndexOf('/')+1,line.lastIndexOf("<<"))
        if ( stems_excluded.indexOf(stem) >= 0 ) {
            return false
        }
        return true
    })
    let remains = lines.filter((line) => {
        if ( line.startsWith("$$script::[app<scripts>]") ) return true
        let stem = line.substring(line.lastIndexOf('/')+1,line.lastIndexOf("<<"))
        if ( stems_excluded.indexOf(stem) >= 0 ) {
            return true
        }
        return false        
    })
    file_edit_map[file].script_lines = remains
    file_edit_map[file].bundled = bundled
}


console.dir(file_edit_map,{ depth: 4})

let bundle_to_file_list = {}
for ( let file in file_edit_map ) {
    //
    let oskel = file_edit_map[file].original
    let clique = file_edit_map[file].bundled
    let oskel_lines = oskel.split('\n')
    //
    oskel_lines = oskel_lines.map((line) => {
        return line.trimEnd()
    })
    //
    oskel_lines = oskel_lines.filter((line) => {
        if ( line.startsWith("$$script::") ) {
            for ( let bf of clique ) {
                if ( line.indexOf(bf) >= 0 ) {
                    return false
                }
            }
        }
        return true
    })

    oskel_lines = shift_subdir_backet_path(oskel_lines)

    let bundle_name = file.replace(".skel","_bundle")

    bundle_to_file_list[bundle_name] = clique

    let end_head_index = oskel_lines.indexOf("$$html:end_head<<")
    if ( end_head_index > 0 ) {
        oskel_lines.splice(end_head_index-1,0,`$$bundle::${bundle_name}.js`)
    }
    //
    // JOIN
    oskel_lines = oskel_lines.join("\n")
    for ( let i = 0; i < 30; i++ ) {
        oskel_lines = oskel_lines.replace("\n\n\n","\n")
    }

    file_edit_map[file].edited = oskel_lines
}

//console.dir(file_edit_map,{depth : 6})




let out_dir = "./tools/final_edit_skels"
//
try {
    fs.mkdirSync(out_dir)
} catch (e) {
    //console.log(e)
}

for ( let file in file_edit_map ) {
    let outfile = `${out_dir}/${file}`
    fs.writeFileSync(outfile,file_edit_map[file].edited)
}


// ----

for ( let bundle in bundle_to_file_list ) {
    let file_list = bundle_to_file_list[bundle]
    bundle_to_file_list[bundle] = shift_subdir_backet_path(file_list)
}



const bundle_output_dir = "/home/richard/GitHub/alphas/websites/template-configs/bundle_src"


//console.dir(bundle_to_file_list)
for ( let [bundle,file_list] of Object.entries(bundle_to_file_list) ) {

    let out_dir = `${bundle_output_dir}/${bundle}`
    //
    try {
        fs.mkdirSync(out_dir)
    } catch (e) {
        //console.log(e)
    }
    //
    for ( let file of file_list ) {
        //
        let fpath = file.substring("$$script::".length,file.indexOf("<<"))
        try {
            fpath = paths.compile_one_path(fpath)
            let stem = paths.basename(fpath)
            let fname = `${out_dir}/${stem}`
            console.log(fpath,fname)
            fs.copyFileSync(fpath,fname)
        } catch (e) {
            console.log(e)
        }
        //
    }
    //
}



