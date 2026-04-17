
/**
 * This script (find_bundles) classifies skeletons by common bundles.
 * Once the bundle is identified, the script steps (section lines beginning with "$$script::")
 * will be removed if they are in the bundle.
 * 
 * The bundle section line is then insterted with the matched bundle.
 * Finally, the skeleton is written to the first "edited" directory
 * 
 * 
 * The script attempts to find a bundle that is large enough to clear a number of files 
 * into a common bundle. Yet, it tries to keep the bundle chosen from having too many superflous files.
 * It will pick a smaller bundler that has less code to load at the expense of allowing some (as few as possible)
 * common files be loaded into the skeleton specific bundle (loaded speparately).
 * 
 */


const fs = require('fs')


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
    },
    //
    "skel_input_dir" : "./pre-skel-edit-directories/first-transform",
    "skel_output_dir" : "./pre-skel-edit-directories/edited_skels"
}


let clique_list = [
    "/home/richard/GitHub/alphas/websites/template-configs/bundle_src/bundle_13",
    "/home/richard/GitHub/alphas/websites/template-configs/bundle_src/bundle_14",
    "/home/richard/GitHub/alphas/websites/template-configs/bundle_src/bundle_16"
]


async function load_cliques(clique_list) {
    let bundle_cliques = {}
    for ( let clique of clique_list ) {
        let file_list = fs.readdirSync(clique)
        let cky = clique.substring(clique.lastIndexOf('/')+1)
        bundle_cliques[cky] = file_list
    }
    return bundle_cliques
}




let file_table = {}
let file_stem_table = {}


// GET LIST OF FILES
// ---- 
// All skeletons to be processed will be started out in a partular directory...
// Just read this list from the directory itself

function get_list_of_files(dir) {
    let file_list = fs.readdirSync(dir)
    return file_list
}



/**
 * Reads in all the skeleton files that have found their way into the file list.
 * 
 * 
 * @param {Array} file_list 
 * @returns {object}
 */
function build_file_edit_map(file_list,dir) {

    let file_edit_map = {}
    //
    for ( let file of file_list ) {
        //
        let data = fs.readFileSync(`${dir}/${file}`).toString()  // READ FILE
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
            "script_lines" : [].concat(the_lines)       // files will have their script lines separated for analysis
        }
    }

    return file_edit_map
}


// file_edit_map[file]

const INCLUSION_CUTOFF_FACTOR = 0.67
/**
 * 
 * @param {object} file_edit_map 
 */
function best_fit_bundle(file_edit_map,bundle_cliques) {
    //
    for ( let file in file_edit_map ) {
        //
        let bundle_count = { }
        for ( let bk in bundle_cliques ) {
            bundle_count[bk] = 0
        }
        let all_stems_included = {}
        let script_lines = file_edit_map[file].script_lines  // pulled out from the skeleton in `build_file_edit_map`
        for ( let line of script_lines ) {
            let stem = line.substring(line.lastIndexOf('/')+1,line.lastIndexOf("<<")) // just use the file name
            for ( let bc in bundle_cliques ) {   // get stats for each bundle
                if ( bundle_cliques[bc].indexOf(stem) >= 0 ) {
                    bundle_count[bc]++
                    all_stems_included[stem] = 1 // just a set
                }
            }
        }
        // would like to get the bundle that uses the most files, 
        // but one bundle might use almost as many and be much smaller in size.
        // It would then make sense to allow some common files to stay behind.

        let N_stems = Object.keys(all_stems_included).length

        // sort the bundles by the count from the file.
        let bundle_keys = Object.keys(bundle_count)
        bundle_keys.sort((a,b) => {
            let v_a = bundle_count[a]
            let v_b = bundle_count[b]
            let diff = v_b - v_a // descending
            return diff
        })

        // only consider bundlers that take a high enough percentage of removable files.
        let incl_theta = Math.round(INCLUSION_CUTOFF_FACTOR*N_stems)
        bundle_keys = bundle_keys.filter((ky) => {
            let incl_count = bundle_count[ky]
            let incl_diff = N_stems - incl_count
            if ( incl_diff > incl_theta ) return false
            return true
        })

        // The least this can be is zero. But, a zero might have already been cropped.
        // Is not necessarily monotonic. 
        let superfluousness = bundle_keys.map((ky) => {
            return (bundle_cliques[ky].length - bundle_count[ky])
        })
        //
        let n = superfluousness.length
        let min_bundle_supr = 10000
        let min_bundle_ky = ""
        for ( let i = 0; i < n; i++ ) {
            let ky = bundle_keys[i]
            let supr = superfluousness[i]
            if ( min_bundle_supr > supr ) {  // want to stick with the left most minimum.
                min_bundle_supr = supr
                min_bundle_ky = ky
            }
        }
        //
        file_edit_map[file].bundle = min_bundle_ky
        file_edit_map[file].superflousness = min_bundle_supr
    }
    //
}



/**
 * 
 * @param {object} file_edit_map 
 * @param {object} bundle_cliques 
 */
function edit_file_with_matched_bundle(file_edit_map,bundle_cliques) {
    //
    for ( let file in file_edit_map ) {
        //
        let oskel = file_edit_map[file].original
        let bundle_name = file_edit_map[file].bundle
        //
        let clique = bundle_cliques[bundle_name]

        if ( clique === undefined ) continue;
        //
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
            oskel_lines.splice(end_head_index-1,0,`$$bundle::${bundle_name}.js`)
        }
        //
        oskel_lines = oskel_lines.join("\n")
        for ( let i = 0; i < 30; i++ ) {
            oskel_lines = oskel_lines.replace("\n\n\n","\n")
        }

        file_edit_map[file].edited = oskel_lines            // update the 'edited' field -- this is the skeleton to be written
        //
    }

}


/**
 * 
 * @param {object} file_edit_map 
 * @param {string} out_dir 
 */
function output_edited_skeletons(file_edit_map,out_dir) { 
    //
    try {
        fs.mkdirSync(out_dir)
    } catch (e) {
        //console.log(e)
    }
    //
    for ( let file in file_edit_map ) {
        let outfile = `${out_dir}/${file}`
        let output = file_edit_map[file]?.edited
        if ( output ) {
            fs.writeFileSync(outfile,file_edit_map[file]?.edited)
        }
    }
}



async function main() {
    let bundle_cliques = await load_cliques(clique_list)
    //
    let file_list = get_list_of_files(config.skel_input_dir)
    let file_edit_map = build_file_edit_map(file_list,config.skel_input_dir)
    //
    best_fit_bundle(file_edit_map,bundle_cliques)
    edit_file_with_matched_bundle(file_edit_map,bundle_cliques)
    output_edited_skeletons(file_edit_map,config.skel_output_dir)
}


main()