

const fs = require('fs')
const { type } = require('os')
const path = require('path')

//$$files::header.html<<
const g_inserts_match = /\$\$files\:\:(\w|_|-|\+)+\/*(\w|_|-|\+)+\.(\w|_|-\+)+\<\</g 
const g_names_inserts_match = /\$\$files\:\:name\:\:(\w|_|-|\+)+\/*(\w|_|-|\+)+\<\</g 


function mapify(a1,a2,key_edit) {
    let the_map = {}
    let n = a1.length
    if ( typeof key_edit === 'function' ) {
        for ( let i = 0; i < n; i++ ) {
            let ky = key_edit(a1[i])
            the_map[ky] = a2[i]
        }
    } else {
        for ( let i = 0; i < n; i++ ) {
            the_map[a1[i]] = a2[i]
        }    
    }
    return the_map
}


function find_map(part_form,the_map) {

    let key = part_form.substr(0,part_form.indexOf("<<")).trim()
    if ( key.length === 0 ) {
        //console.log(part_form)
    }

    let data = the_map[key]

    return[key,data]
}


let target = process.argv[2]
if ( target ) {
    console.log(target)
    let tfile_name = `./pre-template-configs/${target}.json`
    try {
        let jdef = fs.readFileSync(tfile_name,'ascii').toString()
        let tconf = JSON.parse(jdef)
        phase_one_config(tconf,"index.html")
    } catch (e) {
        console.log("CONFIG: " + tfile_name + " does not exists or does not have permissions or is not formatted correctly")
        console.log(e)
    }
} else {
    console.log("no target given on command line")
}


function file_replacement(key_string,conf,file_key) {
    let file_map = conf.files
    let file_defs = file_map[file_key]
    //
    let the_file = ""
    let clean_key = key_string.replace("$$files::","")
    clean_key = clean_key.replace("<<",'')
    if ( clean_key.indexOf('/') > 0 ) {
        //let ext_dir = clean_key.substr(0,clean_key.indexOf('/'))
        the_file = "./" + clean_key
    } else {
        let ext = path.extname(clean_key)
        let src_dir = conf.ext_default_dir[ext]
        the_file = src_dir + '/' + clean_key
    }
    console.log(the_file)
    try {
        let file_data = fs.readFileSync(the_file).toString()
        return file_data    
    } catch (e) {
        console.log(e)
    }
    return ""
}

function named_replacer_replacement(key_string,conf,file_key) {
    let file_map = conf.files
    let file_defs = file_map[file_key]

    let clean_key = key_string.replace("$$files::","")
    clean_key = clean_key.replace("<<",'')
    let named_file_def = file_defs[clean_key]
    let ext = path.extname(named_file_def.file)
    let src_dir = conf.ext_default_dir[ext]
    let the_file = src_dir + '/' + named_file_def.file
    //
    console.log(the_file)
    try {
        let file_data = fs.readFileSync(the_file).toString()
        return file_data    
    } catch (e) {
        console.log(e)
    }
    return ""
}


function load_scripts(conf,file_key) {
    //
    let file_map = conf.files
    let file_defs = file_map[file_key]
    let script_list = file_defs.script
    //
    // script_list
    let the_file = ""
    let the_map = {}
    for ( let clean_key in script_list ) {
        if ( clean_key.indexOf('/') > 0 ) {
            //let ext_dir = clean_key.substr(0,clean_key.indexOf('/'))
            the_file = "./" + clean_key
        } else {
            let ext = path.extname(clean_key)
            let src_dir = conf.ext_default_dir[ext]
            the_file = src_dir + '/' + clean_key
        }
        console.log(the_file)
        try {
            let file_data = fs.readFileSync(the_file).toString()
            let m_file_key = `script::${clean_key}`
            the_map[m_file_key] = file_data
        } catch (e) {
            console.log(e)
        }
    }
    //
    return the_map
}


function phase_one_config(conf,current_file_key) {
    console.log(conf.business_url)
    console.log(conf.pre_template)

    let tmpl_file = conf.pre_template
    try {
        let html_def = fs.readFileSync(tmpl_file,'utf8').toString()
        //
        let replacers = html_def.match(g_inserts_match)
        let named_replacers = html_def.match(g_names_inserts_match)

        //
        console.log("FILES file_replacement")
        let replacers_content = replacers.map((key_string) => {
            return file_replacement(key_string,conf,current_file_key)
        })

        let key_map_replacers = mapify(replacers,replacers_content,(key) => { return key.replace('$$','').replace('<<','') } )

        console.log("NAMED FILES named_replacer_replacement")
        let named_replacers_content = named_replacers.map((key_string) => {
            return named_replacer_replacement(key_string,conf,current_file_key)
        })
        let key_map_named_replacers = mapify(named_replacers,named_replacers_content,(key) => { return key.replace('$$','').replace('<<','')} )

        console.log("SCRIPTS load_scripts")
        let script_map = load_scripts(conf,current_file_key)

        let key_map_all = Object.assign({},key_map_replacers,key_map_named_replacers,script_map)

        //console.dir(key_map_all)
        console.dir(Object.keys(key_map_all))
        //
        let results = []
        let leaders = html_def.split('$$')
        results.push(leaders.shift())
        //
        //
        for ( let nextL of leaders ) {
            let [key,found_sub] = find_map(nextL,key_map_all)
            console.log(key)
            let matcher = `${key}<<`
            let sub_file = nextL.replace(matcher,found_sub)
            results.push(sub_file)
        }

        let sdata = results.join('\n')

        let output_file = conf.out_dir + '/' + current_file_key
        fs.writeFileSync(output_file,sdata)

    } catch(e) {
        console.log("TEMPLATE: " + tmpl_file + " does not exists or does not have permissions or is not formatted correctly")
        console.log(e)
    }
}