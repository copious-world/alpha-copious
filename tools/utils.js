
class ParseUtils {
    constructor() {}

    clear_line_comments(str) {

        if ( str.indexOf("//") >= 0 ) {
            let lines = str.split('\n')
            let n = lines.length
            for ( let i = 0; i < n; i++ ) {
                let line = lines[i]
                line = line.trim()
                if ( line.length && (line.indexOf('//') === 0) ) {
                    lines[i] = ""
                } else if ( line.length && (line.indexOf('//') > 0) ) {
                    line = line.substring(0,(line.indexOf('//'))).trim()
                    lines[i] = line
                }
            }
            lines = lines.filter((line)  => {
                return line.length > 0
            })
            return lines.join("\n")
        }

        return str.trim()
    }

    /**
     * 
     * @param {*} str 
     * @returns {string}
     */
    clear_block_comments(str) {
        //
        let output = ""
        if ( str.indexOf('/*') >= 0 ) {
            let comment_fronts = str.split('/*')
            let n = comment_fronts.length
            for ( let i = 0; i < n; i++  ) {
                let cf = comment_fronts[i]
                cf = cf.substring(cf.indexOf('*/')+2)
                comment_fronts[i] = cf
            }
            output = comment_fronts.join('')
            return output.trim()
        } else {
            return str.trim()
        }
        //
    }


    /**
     * 
     * @param {string} str 
     * @returns {string}
     */
    clear_all_comments(str) {
        let clear_lc = this.clear_line_comments(str)
        let all_clear = this.clear_block_comments(clear_lc)
        return all_clear
    }



    remove_spaces(str) {
        let strs = str.split(' ')
        strs = strs.filter((sub) => {
            return sub.length > 0
        })
        return strs.join('')
    }
    remove_white(str) {
        str = str.replace(/\s+/g,'')
        return str
    }

    /**
     * 
     * @param {*} lines 
     * @returns {Array}
     */
    remove_empty_lines(lines) {
        return lines.filter((line) => {
            if ( line.trim().length === 0 ) return false
            return true
        })
    }


    trim_line_ends(timmed_lines) {
        return timmed_lines.map((line) => {
            return line.trimEnd()
        })
    }

    trim_lines(lines) {
        return lines.map((line) => {
            return line.trim()
        })
    }

    trim_ends_and_empties(text) {
        let lines = text.split('\n')
        lines = this.remove_empty_lines(lines)
        lines = this.trim_lines(lines)
        return lines.join('\n')
    }



    /**
     * 
     * @param {string} at 
     * @param {string} starter 
     * @param {s} stopper 
     * @returns {number}
     */
    end_of_nested(at,starter,stopper) {
        let i = at.indexOf(starter)
        if ( i >= 0 ) {
            i++
            let depth = 1
            let n = at.length
            while ( (depth > 0) && (i < n) ) {
                let c = at[i]
                if ( c === starter ) depth++
                else if ( c === stopper ) depth--
                i++
            }
            return i
        }
        return -1
    }


    /**
     * 
     * @param {string} at 
     * @param {string} starter 
     * @param {string} stopper 
     * @returns {string|boolean}
     */
    extract_nested(at,starter,stopper) {
        let i = at.indexOf(starter)
        let j = this.end_of_nested(at,starter,stopper)
        if ( j > 0 ) {
            return at.substring(i,j)
        }
        return false
    }

    flatten(data_parts) {
        let flattened = []
        for ( let part of data_parts ) {
            if ( typeof part === "string" ) {
                flattened.push(part)
            } else {
                let parted = this.flatten(part)
                for ( let p of parted ) {
                    flattened.push(p)
                }
            }
        }
        return flattened
    }


    /**
     * subst
     * 
     * Calls String.replace sequentially until no instances of the pattern are left.
     * Puts the value in place of the pattern.
     * 
     * Returns the string 
     * 
     * @param {string} str 
     * @param {string} pattern 
     * @param {string} value 
     * @returns string
     */
    subst(str,pattern,value) {
        let i = str.indexOf(pattern)
        let j = 0
        while ( i >= 0 ) {
            str = str.replace(pattern,value,j)
            j = i
            i = str.indexOf(pattern)
        }
        return str
    }



    /**
     * recursive_flat
     * 
     * Takes in an array whose elements are either atoms or arrays.
     * The structure is assumed to be recursive and have some max depth
     * not checked by this method.
     * 
     * @param {Array} ary 
     * @returns Array
     */
    recursive_flat(ary) {
        if ( Array.isArray(ary) ) {
            let outary = []
            for ( let el of ary ) {
                if ( Array.isArray(el) ) {
                    outary = outary.concat(recursive_flat(el))
                } else {
                    outary.push(el)
                }
            }
            return outary
        } else {
            return ary
        }
    }



    /**
     * array_flatten
     * 
     * A top level call for `recursive_flat`
     * 
     * @param {Array} items_array 
     * @returns Array
     */
    array_flatten(items_array) {
        let final_array = []
        for ( let item of items_array ) {
            if ( !Array.isArray(item) ) {
                final_array.push(item)
            } else {
                let ary = recursive_flat(item)
                final_array = final_array.concat(ary)
            }
        }
        return final_array
    }


    /**
     * mapify
     * 
     * Given two arrays creates an object whose keys are the to be found in the first array and the values in the second.
     * 
     * The method uses all the keys and as many values found at the front of the array. 
     * It is possible that the value array will be longer than the keys. If the value array is short, 
     * then key will map to 'undefined'.
     * 
     * 
     * 
     * @param {Array} a1 
     * @param {Array} a2 
     * @param {Function} key_edit
     * 
     * @returns Object
     */
    mapify(a1,a2,key_edit) {
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


    /**
     * find_map
     * 
     * This is for an application that takes in a string that is expected to have 
     * a delimeter marking the end of the prefix (or first part) of the string.
     * 
     * It pulls of the prefix and uses it as a key into the map to get stored data. 
     * 
     * This returns key and data as a pair.
     * 
     * default "<<"
     * 
     * @param {string} part_form 
     * @param {object} the_map 
     * @param {string}
     * @returns pair<key,data>  -- this is an array with a key in position 0, and data in position 1
     */
    find_map(part_form,the_map,section_key) {
        
        if ( section_key === undefined ) {
            section_key = "<<"
        }

        let key = part_form.substring(0,part_form.indexOf(section_key)).trim()
        if ( key.length === 0 ) {
            //console.log(part_form)
        }

        let data = the_map[key]

        return[key,data]
    }



    capitalize(str) {
        let rest = str.substring(1)
        str = str.substring(0,1).toUpperCase() + rest
        return str
    }


    subst(str,ky,val) {
        while ( str.indexOf(ky) >= 0 ) {
            str = str.replace(ky,val)
        }
        return str
    }


    extract_var(str) {
        let var_up = str.substring(str.indexOf('@{') + 2)
        let vname = var_up.substring(0,var_up.indexOf('}'))
        return vname
    }

    
    
    reverse_map(skeletons) {
        let robj = {}
        for ( let [ky,val] of Object.entries(skeletons) ) {
            let obj = robj[val]
            if ( !obj ) {
                obj = {}
                robj[val] = obj
            }
            obj[ky] = ""
        }
        return robj
    }

    copy_keys(dst,src,type) {
        if ( type === "array" ) {
            for ( let ky in src ) {
                dst[ky] = []
            }
        } else if ( type === "object" ) {
            for ( let ky in src ) {
                dst[ky] = {}
            }
        } else {
            for ( let ky in src ) {
                dst[ky] = ""
            }
        }
    }


    /**
     * 
     * @param {object} obj 
     * @param {Function} fn 
     */
    key_sort(obj,fn) {
        let sobj = {}
        let keys = Object.keys(obj)
        if ( typeof fn === "function" ) {
            keys.sort((el1,el2) => {
                let ky1 = fn(el1)
                let ky2 = fn(el2)
                if ( ky1 < ky2 ) {
                    return -1
                } else if ( ky1 < ky2 ) {
                    return 1
                } else {
                    return 0
                }
            })
        } else {
            keys.sort()
        }
        for ( let ky of keys ) {
            sobj[ky] = obj[ky]
        }
        return sobj
    }



    next_char(achar) {
        let b = achar.charCodeAt(0)
        b++
        let c = String.fromCharCode(b)
        return c
    } 

    /**
     * 
     * Given a string with a delimimter marking the end of a key, 
     * extract the key, clean it up and replace the old version with the new one
     * 
     * @param {string} entry 
     * @returns {string}
     */
    single_space_key(entry,del = '{') {
        //
        let key_front = entry.substring(0,entry.indexOf(del))
        let clean_key = "" + key_front
        //
        clean_key = clean_key.replace(/\s+/g,' ')
        //
        entry = entry.replace(key_front,clean_key)
        return entry
    }


    fix_tabs_and_spaces(entry) {
        entry = entry.replace(/\n\t\s+/g,'\n\t\t')
        entry = entry.replace(/\n\s+/g,'\n\t')
        return entry
    }



    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        return hash >>> 0; // Ensure the result is unsigned
    }

}


module.exports = ParseUtils
