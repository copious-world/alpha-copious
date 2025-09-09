


let pars = process.argv[2]
console.log(pars)
if ( pars === undefined ) {
    console.log("missing parameter file *.json")
    process.exit(0)
}


const fs = require('extra-file-class')
const distance = require('sequence-distance')
const {analyze} = require('code_diff')

let diff_group = new Map()

try {

    //
    let pars_str = fs.load_file_as_string_sync(pars)
    let pObj = JSON.parse(pars_str)

    console.dir(pObj)

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    let directories = pObj.directories
    let file_types = pObj.look_in
    let test_string = pObj.search
    let path_translates = pObj.path_translations
    let threshold = pObj.min_inclusion_distance

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    if ( directories === undefined ) {
        console.log("missing directories list")
        process.exit(0)
    }
    if ( file_types === undefined ) {
        console.log("missing file_types list")
        process.exit(0)
    }
    if ( test_string === undefined ) {
        console.log("missing test_string")
        process.exit(0)
    }

    if ( test_string.substring(0,5) == "file:" ) {
        test_string = fs.load_file_as_string(test_string.substring(5))
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    let path_map = fs.path_translation(path_translates)

    for ( let dir of directories ) {
        //
        let abs_dir = path_map.absolute_of(dir)
        let files = abs_dir.list_files(file_types)
        //
        for ( let file of files ) {
            let contents = fs.load_file_as_string(file)
            let dist = distance.lenvinson(contents,test_string)
            if ( dist > threshold ) {
                let key = fs.file_hash(contents)
                diff_group.add(key,contents)
            }
        }
    }
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    analyze(diff_group)
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

} catch( e ) {
    console.log("script cannot run")
}

