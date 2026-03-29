


function list_intersection(arr1,arr2) {
    // 1. Create a Set from the first array for fast lookups.
    const set1 = new Set(arr1);

    // 2. Filter the second array, keeping only elements present in the set.
    const intersection = arr2.filter(item => set1.has(item));

    // 3. (Optional) Convert the result to a Set and back to an Array to ensure unique values.
    // This is only necessary if the result should not contain duplicates even if they exist in both originals.
    return [...new Set(intersection)];
}


function list_union(arr1,arr2) {
    const union = [...new Set([...arr1, ...arr2])];
    return union
}

function list_difference(arr1,arr2) {
    const set2 = new Set(arr2);
    const filtered = arr1.filter((item) => {
        if ( set2.has(item) ) return false
        return true
    })
    return filtered
}

let analysis_source = "/home/richard/GitHub/alphas/copious-software-dev-manager/plugins/snippet_finder/css_output"

const fs = require('fs')

let files_list = fs.readdirSync(analysis_source)

let salient_keys = [ "element", "identified", "class", "control" ]

let file_data = {}
for ( let file of files_list ) {

    let css_data = fs.readFileSync(`${analysis_source}/${file}`).toString()
    css_data = JSON.parse(css_data)
    //
    let salient =  Object.fromEntries(salient_keys.map(item => [item, css_data[item]]))
    file_data[file] = salient
}


let big_intersection = Object.fromEntries(salient_keys.map(item => [item,[]]))
//
// start the big intersection with a big union
for ( let file in file_data ) {
    let css_dat = file_data[file]
    for ( let ky of salient_keys ) {
        let current_intr = big_intersection[ky]
        let css_type_entries = css_dat[ky]
        big_intersection[ky] = list_union(current_intr,css_type_entries)
    }
}


//console.dir(big_intersection)

for ( let file in file_data ) {
    let css_dat = file_data[file]
    for ( let ky of salient_keys ) {
        if ( ky === "control" ) {
            continue
        }
        let current_intr = big_intersection[ky]
        let css_type_entries = css_dat[ky]
        //console.log(css_type_entries.length)
        if ( css_type_entries.length > 8 ) {
            big_intersection[ky] = list_intersection(current_intr,css_type_entries)
            css_dat.ignored = false
        } else {
            css_dat.ignored = true
        }
    }
}

//console.dir(big_intersection)

let out_file = "./css/shared_styles.css"


let out_css = ""
for ( let css_list of Object.values(big_intersection) ) {
    out_css += css_list.join("\n\n") + "\n"
}

fs.writeFileSync(out_file,out_css)


for ( let file in file_data ) {
    let css_dat = file_data[file]
    css_dat.diff = []
    for ( let ky of salient_keys ) {
        let final_intr = big_intersection[ky]
        let css_type_entries = css_dat[ky]
        css_dat.diff = css_dat.diff.concat(list_difference(css_type_entries,final_intr))
    }
}


for ( let file in file_data ) {
    let css_dat = file_data[file]
    console.log(file)
    console.dir(css_dat.diff)
    console.log("----------------------------------")
}
