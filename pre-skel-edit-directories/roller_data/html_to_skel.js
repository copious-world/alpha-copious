



const fs = require('fs')
const path = require('path')

let dir = process.argv[2]
if ( typeof dir === "string" ) {
    let files = fs.readdirSync(dir)
    files = files.filter((fl) => {
        //console.log(fl,path.extname(fl))
        if ( path.extname(fl)  === ".html" ) {
            return true
        }
        return false
    })
    //
    console.log(files)
    for ( let fl of files ) {
        let  a_file = `${dir}/${fl}`
        let new_file = a_file.replace(".html",".skel")
        fs.renameSync(a_file,new_file)
    }
}

