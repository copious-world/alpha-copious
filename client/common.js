// ---->>>
// MODULE: common (windowized)


//$>>	ext_of_file
/**
 * Just in case the something like node.js path is not available
 * 
 * @param {string} file_name 
 * @returns {string}
 */
function ext_of_file(file_name) {
	let idx = file_name.lastIndexOf('.')
	let ext = file_name.substring(idx+1)
	return ext
}


//$>>	fussy_url
/**
 * Some formulas involving url's need to have a slash at the end
 * 
 * @param {string} source 
 * @returns {string}
 */
function fussy_url(source) {
    let c = source[source.length - 1]
    if ( c !== '/' ) {
        source += '/'
    }
    return source
}

//$>>	clonify
/**
 * Two versions are offered, just in case.
 * The old way of cloning was to use JSON parsing.
 * Structured clone is prefered.
 * 
 * @param {object} obj 
 * @returns {object}
 */
var clonify = (typeof structuredClone !== "function" ) 
? (obj) => {
	if ( typeof obj === 'string' ) return(obj)
	try {
		let out = JSON.parse(JSON.stringify(obj))
		return(out)
	} catch(e) {
		return(null)
	}
}
: structuredClone



/**
 * The parent window reference is only returned in if the window has been spawned from another window.
 * If it is a frame, the reference will not be returned.
 * 
 * @returns {object} - boole for truth about being in a frame, the site it comes from if this is a child window.
 */
function check_frame_status() {
	let in_frame = false
	let from_site = false
    if ( window.frameElement ) {
        in_frame = true
    } else {
        if ( window.parent !== window ) {
            in_frame = true
            from_site = window.parent
        }
    }
    return {in_frame, from_site}
}



//$>>	addscript
// attach a script to a DOM element
window._script_added_cout = 0
const MAX_SCRIPTS_ADDED = 1

/**
 * Assuming the last appended script was added as the last child of a DOM element,
 * this will remove that script. 
 * If it does not find a script type node at the last child position, this will do nothing.
 * 
 * The last child must be of type 'text/javascript'
 * 
 * @param {object} whereScipt -- a DOM object 
 */
function remove_last_appended_script_child(whereScipt) {
	if ( whereScipt ) {
		let n = whereScipt.childNodes.length
		if ( n > 0 ) {
			let child = whereScipt.childNodes[n-1]
			// check that it is a script....
			if ( child.type === 'text/javascript' ) {
				whereScipt.removeChild(child)
			}
		}
	}
}

// attach a script to a DOM element
/**
 * 
 * whereScipt starts as the id of a DOM element. A javascript child will be appended to the child list
 * 
 * @param {string} script 
 * @param {string} whereScipt 
 */
function addscript(script,whereScipt) {
	var scriptEl = document.createElement('script');
	scriptEl.type = 'text/javascript';
	scriptEl.text = script;
	if ( typeof whereScipt === "string" ) {
		whereScipt = document.getElementById(whereScipt)
		if ( whereScipt ) {
			window._script_added_cout++
			if ( MAX_SCRIPTS_ADDED <= window._script_added_cout ) {
				remove_last_appended_script_child(whereScipt)
			}
			whereScipt.appendChild(scriptEl);
		}
	}
}


//$>>	addstyle
/**
 * adds css to the end of the head element
 * 
 * @param {string} script 
 */
function addstyle(script) {
    var styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.text = script;
    let whereScript = document.getElementsByTagName('head')
    if ( whereScript && whereScript.length ) {
        whereScript[0].appendChild(styleEl);
    }
}



//$>>	launch_simple_link

/**
 * Navigation .. when given a URL without a protocal prefix, this adds the prefix
 * By default, the prefix is made to be "https"
 * 
 * If the protocal prefix is present, the url is returned as is.
 * 
 * @param {string} default_url 
 * @returns 
 */
function normalized_launch_url(default_url) {
	let uri_of_launch = ""
	if ( default_url.indexOf('http://') === 0 ) {
		uri_of_launch = default_url
	} else if ( default_url.indexOf('https://') === 0 ) {
		uri_of_launch = default_url
	} else {
		uri_of_launch = `https://${default_url}/`
	}
	return uri_of_launch
}

//                                                  <<depends>> errorMessage, normalized_launch_url
function launch_simple_link(default_url,window_name) {
	let uri_of_launch = normalized_launch_url(default_url)
	let launched = window.open(uri_of_launch,window_name)
	//
	if ( !launched ) {
		errorMessage(`could not open window or tab for link ${uri_of_launch}`)
	}
	return [launched,uri_of_launch]
}

//$>>	service_url
function service_url(application) {
    let srver = location.host
    let data_stem = application
	return `${srver}/${data_stem}`
}

//$>>	open_public_window
//                                                  <<depends>> launch_simple_link
function open_public_window(application) {
    let tab_title = application.toUpperCase()
	let w_url = service_url(application)
	let [child,uri_of_launch]  = launch_simple_link(w_url, ("{{origin}}" + tab_title))
    if ( child ) {
        if ( typeof child.no_session === "function" ) child.no_session()      // same domain can call child method
    }
	return uri_of_launch
}


//$>>	open_cors_window
const MAX_WINDOW_OPENER_TRYS_common = 10
//
function open_cors_window(default_url,window_name) {
	let [child,uri_of_launch] = launch_simple_link(default_url,window_name)
	if ( child ) {
        let p = new Promise((resolve,reject) => {
			let count = 0
            let interval = setInterval(() => {
				count++
                try {
                    if ( child.frames ) {
                        clearInterval(interval);
                        resolve([child,uri_of_launch])
                    } else if ( count > MAX_WINDOW_OPENER_TRYS_common ) {
						clearInterval(interval);
						resolve([false,false])
					}
                } catch(e) {
                    clearInterval(interval);
                    resolve([false,false])
                }
            }, 500);
        })
        return p
    } else {
        console.log("no child window")
    }
	return [false,false]
}


//$$EXPORTABLE::
/*
ext_of_file
clonify
addscript
addstyle,
launch_simple_link
service_url
open_public_window
open_cors_window
*/
