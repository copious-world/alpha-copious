

const fs = require('fs')
let {exec} = require('child_process')
const util = require('node:util');
exec = util.promisify(exec);

let config_file = process.argv[2]
if ( config_file === undefined ) {
    console.log("need one parameter: config file")
    process.exit(0)
}

let config = {}
try {
    let config_str = fs.readFileSync(config_file).toString()
    config = JSON.parse(config_str)
} catch(e){
    console.log("could not read file " + config_file)
    console.log(e)
    process.exit(0)
}


/**
 * 
 * @param {Array} list_of_scripts 
 * @param {object} subst_directives 
 */
function transform_particular_scripts(list_of_scripts,subst_directives) {
    for ( let script_keeper of list_of_scripts ) {
        let txt = script_keeper.data
        if ( txt ) {
            for ( let [target,subst] of Object.entries(subst_directives) ) {
                txt = txt.replaceAll(target,subst)
            }
        }
        script_keeper.data = txt
    }
}


/**
 * 
 * @param {Array} list_of_scripts 
 * @param {string} insertions 
 */
function insert_tag_marked_lines(list_of_scripts,insertions) {
    for ( let script_keeper of list_of_scripts ) {
        let txt = script_keeper.data
        if ( txt ) {
            for ( let [insert,directive] of Object.entries(insertions) ) {
                let cond = directive.cond
                let insert_ok = false
                if ( cond ) {
                    if ( typeof cond === 'boolean' ) {
                        insert_ok = cond
                    } else if ( (typeof cond === 'string') && cond.length ) {
                        if ( txt.indexOf(cond) > 0 ) {
                            insert_ok = true
                        }
                    }
                }
                if ( insert_ok ) {
                    let lead_regexp = directive.after
                    let matcher = new RegExp(lead_regexp)
                    let index = txt.search(matcher)
                    if ( index > 0 ) {
                        let insert_pos = txt.indexOf("<<\n",index) + 3
                        txt = txt.slice(0,insert_pos) + `${insert}\n` + txt.slice(insert_pos)
                    }
                }
            }
        }
        script_keeper.data = txt
    }
}

/**
 * 
 * @param {string} source_dir 
 * @returns 
 */
function load_skel_scripts(source_dir) {
    let files = fs.readdirSync(source_dir)
    files = files.filter((file) => {
        if ( file.indexOf(".skel") > 0 ) {
            return true
        }
        return false
    })
    let script_data = {}
    for ( let file of files ) {
        let file_data = {}
        script_data[file] = file_data

        try {
            file_data.path = `${source_dir}/${file}`
            let file_txt = fs.readFileSync(file_data.path).toString()
            file_data.data = file_txt
        } catch(e) {}
    }
    return script_data
}

/**
 * 
 * @param {object} scripts_data 
 * @param {string} dest_dir 
 */
function output_transformed_scripts(scripts_data,dest_dir) {
    for ( let file in scripts_data ) {
        let output = scripts_data[file]?.data
        if ( output ) {
            fs.writeFileSync(`${dest_dir}/${file}`,output)
        }
    }
}


async function run_prepretory_actions(action_list) {
    if ( action_list ) {
        for ( let action of action_list ) {
            const { stdout, stderr } = await exec(`node ${action}`)
            console.log('stdout:', stdout);
            console.error('stderr:', stderr);
        }
    }
}


/**
 * 
 */
async function run_all() {
    await run_prepretory_actions(config.actions)
    let scripts_data = load_skel_scripts(config.source_dir)
    if ( scripts_data  ) {
        let list_of_scripts = Object.values(scripts_data)
        insert_tag_marked_lines(list_of_scripts,config.insertions)
        transform_particular_scripts(list_of_scripts,config.substitutions)
        output_transformed_scripts(scripts_data,config.destination_dir)
    }
}


run_all()