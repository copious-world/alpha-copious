
/**
 * This script (common_scripts) edits generated skeletons and looks for commonality 
 * in script usage in order to create bundles.
 * 
 * Should work as a learning program (a very simple one).
 * This can be like clustering. Yet, a simple heuristic is to just 
 * pick lists that fit common set sizes based on inclusion in skeletons.
 * 
 * Bundles are assigned to a script based on best fit classification. 
 * Here, best fit has to do with minimal size of a bundle needed to supply the 
 * requested functionality for a skeleton.
 * 
 * This program is to be run a training set. The results will be read in by `find_bundles`.
 * 
 * 
 */


const fs = require('fs')
let {PathManager} = require("extra-file-class")

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


let dir = "./tools/training_set"

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

/**
 * 
 * Given a directory of generated (hand/machine) skeletons.
 * Loads the directory files. For each file, it pulls out the script lines 
 * and creates the `file_stem_table`.
 * 
 * The `file_stem_table` is map from the file names (as returned by the directory listing)
 * to the map of script files to the original line. This map is used as a set, overwriting duplicates.
 * 
 * @param {string} dir 
 * @returns {pair}
 */
function load_training_set(dir) {
    //
    let file_stem_table = {}
    //
    let file_list = fs.readdirSync(dir)
    for ( let file of file_list ) {
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
            if ( (line.length > 0) && line.startsWith("$$script::") ) {
                if ( has_script_alteration(line) ) {
                    return false
                }
                return true
            }
            return false
        })
        //
        let stem_map = {}
        file_stem_table[file] = stem_map
        //
        for ( let line of the_lines ) {
            let stem = line.substring(line.lastIndexOf('/')+1,line.lastIndexOf("<<"))
            stem_map[stem] = line
        }
        //
    }
    //
    return file_stem_table
}


function has_script_alteration(line) {
    return false
}

/**
 * 
 * This takes in a list of maps, which can be the values of the `stems_map_table`.
 * Each map is treated as a set. This method returns the longest set.
 * 
 * @param {object} stem_maps 
 */
function find_longest_common_sequence(stem_maps_list) {
    let maxlen = 0
    let seq = []
    for ( let vseq_map of stem_maps_list ) {
        let vseq = Object.keys(vseq_map)
        if ( vseq.length > maxlen ) {
            maxlen =  vseq.length
            seq = vseq
        }
    }
    return seq
}



//console.dir(file_stem_table,{ depth: 4})
/**
 * The file stem table has sets of scripts that are used by each file.
 * This method looks at all the sets (value of the file to set map).
 * This method returns the union of those sets as a map, mapping from the script line
 * to the resolved path (abosolute) of the file.
 * 
 * @param {object} file_stem_table 
 * @returns {object} - script lines to full file paths
 */
function all_script_paths(file_stem_table) {
    let script_paths = {}
    for ( let vseq_map of Object.values(file_stem_table) ) {
        for ( let script_line in vseq_map ) {
            let total_path = vseq_map[script_line]
            if ( total_path.startsWith("$$script::") ) {
                total_path = total_path.substring("$$script::".length).replace("<<","").trim()
                total_path = paths.compile_one_path(total_path)
            }
            script_paths[script_line] = total_path
        }
    }
    return script_paths
}


/**
 * Copies files from an alpha directory to a bundle directory
 * 
 * @param {Array} seq 
 * @param {object} file_paths 
 */
function copy_script_files_to_bundle_dir(seq,file_paths) {
    for ( let file of seq ) {
        let out_file = `${out_dr}/${file}`
        let total_path = file_paths[file]
        console.log("copy: ",total_path,"to",out_file)
        try {
            fs.copyFileSync(total_path,out_file)
        } catch (e) {
        }
    }
}


/**
 * 
 * @param {Array} backup_seq 
 * @param {object} file_paths 
 * @param {object} file_stem_table 
 */
function create_bundles(longest_seq,file_paths,file_stem_table) {
    // 
    for ( let smallest_island of [13,16]) {  // try to get sets (maps) that have enough size to make a useful bundle
        let seq  = [].concat(longest_seq)
        //
        let list_of_sets = Object.values(file_stem_table)
        for ( let vseq_map of list_of_sets ) {
            let vseq_set = Object.keys(vseq_map)  // list of base file names
            if ( vseq_set.length > smallest_island ) {  // set is big enough
                let no_matches = []
                for ( let key of seq ) {            // seq -- the list of files 
                    if ( vseq_set.indexOf(key) < 0 ) {  // longest seq has a file that isn't in vseq (scripts from the file)
                        no_matches.push(key)
                    }
                }
                // an intersection
                if ( no_matches.length ) {          // longest sequence has too many files
                    seq = seq.filter((fky) => {     // go through this longest list and remove the files that were not in the set
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

        // create a directory with a name of the bundle -- files will be moved there
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

        // The union of the intersections is likely to be longer than the shortest intersection
        // but shorter intersections may contribute to the longer union by using files others don't
        // Ultimately, the union should accomdate all the releases as much as possible
        copy_script_files_to_bundle_dir(seq,file_paths)     // copies files (in the end this will be a union of the intersections)
        console.log("--------------------------------------------")

    }

}



let file_stem_table = load_training_set(dir)


let seq = Object.values(find_longest_common_sequence(file_stem_table))
let backup_seq = [].concat(seq)


let all_files_stems = all_script_paths(file_stem_table)

create_bundles(backup_seq,all_files_stems,file_stem_table)
