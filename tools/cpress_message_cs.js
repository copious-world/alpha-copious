


/**
 * Compress the shared constants by just making a number based id for each constant string value...
 * Assign a hex number to each constant. All files using the constant should be using the constants
 * and not using the readable strings used for debugging.
 * 
 */


let input_file = process.argv[2]
let output_file = process.argv[3]

if ( input_file === undefined ) {
    console.log("Need to work with an input file -- command line parameter")
    process.exit(0)
}

if ( output_file === undefined ) {
    console.log("Need to have output file specified")
    process.exit(0)
}

try {
    const fs = require('fs')
    let file_str = fs.readFileSync(input_file).toString()

    let lines = file_str.split("\n")
    lines = lines.filter((line) => {
        line = line.trim()
        if ( line.length ) {
            if ( line.startsWith("const g_") ) return false
            if ( line.startsWith("const") ) return true
        }
        return false
    })

    let cterm_to_str = {}

    for ( let line of lines ) {
        let def = line.substring(line.indexOf(' ')).trim()
        if ( def.substring(0,2) === 'g_') continue
        let def_parts = def.split('=')
        def_parts[0] = def_parts[0].trim()
        def_parts[1] = def_parts[1].trim()
        let unqstr = def_parts[1].replaceAll('\"',"")
        cterm_to_str[def_parts[0]] = unqstr
    }

    let values = Object.values(cterm_to_str)
    let vstruct = {}
    for ( let v of values ) {
        vstruct[v] = vstruct[v] ? vstruct[v] + 1 : 1
    }
    //
    if ( Object.keys(vstruct).length < values.length ) {
        console.log("REDUNDANCY")
        console.dir(vstruct)
    }

    let n = values.length
    let kys = Object.keys(cterm_to_str)
    let alt_cterm_to_str = Object.assign({},cterm_to_str)
    for ( let i = 0; i < n; i++ ) {
        let zfil = i < 10 ? "0" : ""
        alt_cterm_to_str[kys[i]] = `0xA1${zfil}${i}`
    }

    console.dir(cterm_to_str,{depth:2})
    console.log(lines.join("\n"))
    //
    let output = ""
    for ( let [cterm,code_term] of Object.entries(alt_cterm_to_str) ) {
        output += `const ${cterm} = ${code_term}` + "\n"
    }
    //
    output = output.trim()
    fs.writeFileSync(output_file,output)
    //
} catch (e) {
    console.log("file open error or processing error")
}

