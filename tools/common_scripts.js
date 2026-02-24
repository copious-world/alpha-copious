

const fs = require('fs')
let {PathManager} = require("extra-file-class")

let dir = "./tools/gend_skels"

// ---- 
let file_list = fs.readdirSync(dir)
console.log(file_list)


let file_table = {}
let file_stem_table = {}

let config = {
    "top_level": true,
    "path_abreviations": {
        "[alpha-copious]": "[github]/alphas/alpha-copious",
        "[github]": "~/GitHub",
        "[websites]": "[alphas]/websites",
        "[client]": "[alpha-copious]/client",
        "[for-humans]": "[alpha-copious]/for-humans",
        "[databases]": "[alpha-copious]/databases"
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

let paths = new PathManager(config)

let file_edit_map = {}

for ( let file of file_list ) {

    if ( file === "web3-boxy.skel" ) continue
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



//console.dir(file_table,{ depth: 4})
//console.dir(file_stem_table,{ depth: 4})

let all_files_stems = {}
for ( let vseq_map of Object.values(file_stem_table) ) {
    for ( let ky in vseq_map ) {
        all_files_stems[ky] = vseq_map[ky]
    }
}

// find longest common sequence
let maxlen = 0
let seq = []
for ( let vseq_map of Object.values(file_stem_table) ) {
    let vseq = Object.keys(vseq_map)
    if ( vseq.length > maxlen ) {
        maxlen =  vseq.length
        seq = vseq
    }
}

// console.log("longest")
// console.log(seq)
let backup_seq = [].concat(seq)
let smallest_island = 1

let bundle_cliques = {}

for ( smallest_island of [13,16]) {
    seq  = [].concat(backup_seq)
    //
    for ( let vseq_map of Object.values(file_stem_table) ) {
        let vseq = Object.keys(vseq_map)
        if ( vseq.length > smallest_island ) {
            let no_matches = []
            for ( let key of seq ) {
                if ( vseq.indexOf(key) < 0 ) {
                    no_matches.push(key)
                }
            }
            if ( no_matches.length ) {
                seq = seq.filter((fky) => {
                    if ( no_matches.indexOf(fky) >= 0 ) {
                        return false
                    }
                    return true
                })
            }
        }
    }

    // console.log("shortest longest",smallest_island)
    // console.log(seq)


    let bundle_dir = "../websites/template-configs/bundle_src"
    //bundle_dir = paths.resolve(bundle_dir)
    let collector = `bundle_${smallest_island}`
    let out_dr = paths.resolve(`${bundle_dir}/${collector}`)
    //
    console.log(out_dr)
    //
    try {
        fs.mkdirSync(out_dr)
    } catch (e) {
        //console.log(e)
    }
    //

    // all_files_stems
    for ( let file of seq ) {
        let out_file = `${out_dr}/${file}`
        let total_path = all_files_stems[file]
        if ( total_path.startsWith("$$script::") ) {
            total_path = total_path.substring("$$script::".length).replace("<<","").trim()
            total_path = paths.compile_one_path(total_path)
        }
        console.log("copy: ",total_path,"to",out_file)
        try {
            fs.copyFileSync(total_path,out_file)
        } catch (e) {
        }
    }
    console.log("--------------------------------------------")

    bundle_cliques[collector] = seq
}





// file_edit_map[file]


for ( let file in file_edit_map ) {
    //
    let bundle_count = { }
    for ( let bk in bundle_cliques ) {
        bundle_count[bk] = 0
    }
    let script_lines = file_edit_map[file].script_lines
    for ( let line of script_lines ) {
        let stem = line.substring(line.lastIndexOf('/')+1,line.lastIndexOf("<<"))
        for ( let bc in bundle_cliques ) {
            if ( bundle_cliques[bc].indexOf(stem) >= 0 ) {
                bundle_count[bc]++
            }
        }
    }
    let max_bundle = 0
    let max_bundle_ky = ""
    for ( let bc in bundle_count ) {
        let cnt = bundle_count[bc]
        if ( cnt > max_bundle ) {
            max_bundle = cnt
            max_bundle_ky = bc
        } else if ( cnt === max_bundle ) {
            if ( max_bundle_ky < bc ) break
        }
    }

    file_edit_map[file].bundle = max_bundle_ky
    file_edit_map[file].bundle_count = max_bundle
}



console.dir(bundle_cliques,{depth : 6})

for ( let file in file_edit_map ) {
    //
    let oskel = file_edit_map[file].original
    let clique = bundle_cliques[file_edit_map[file].bundle]
    let oskel_lines = oskel.split('\n')
    //
    oskel_lines = oskel_lines.map((line) => {
        return line.trimEnd()
    })
    //
    oskel_lines = oskel_lines.filter((line) => {
        if ( line.startsWith("$$script::") ) {
            for ( let bf of clique ) {
                if ( line.indexOf(bf) > 0 ) {
                    return false
                }
            }
        }
        return true
    })

    let end_head_index = oskel_lines.indexOf("$$html:end_head<<")
    if ( end_head_index > 0 ) {
        oskel_lines.splice(end_head_index-1,0,`$$bundle::${file_edit_map[file].bundle}.js`)
    }
    //
    oskel_lines = oskel_lines.join("\n")
    for ( let i = 0; i < 30; i++ ) {
        oskel_lines = oskel_lines.replace("\n\n\n","\n")
    }

    file_edit_map[file].edited = oskel_lines
}

//console.dir(file_edit_map,{depth : 6})




let out_dir = "./tools/edited_skels"
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
