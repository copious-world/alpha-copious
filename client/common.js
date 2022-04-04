// MODULE: common (windowized)


//$>>	ext_of_file
function ext_of_file(file_name) {
	let idx = file_name.lastIndexOf('.')
	let ext = file_name.substr(idx+1)
	return ext
}

//$>>	clonify
function clonify(obj) {
	if ( typeof obj === 'string' ) return(obj)
	try {
		let out = JSON.parse(JSON.stringify(obj))
		return(out)
	} catch(e) {
		return(null)
	}
}

//$>>	addscript
// attach a script to a DOM element
window._script_added_cout = 0
const MAX_SCRIPTS_ADDED = 1

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
function addscript(script,whereScipt,remove_old) {
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
//
function normalized_launch_url(default_url) {
	let uri_of_launch = ""
	if ( default_url.indexOf('http://') === 0 ) {
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
						resolve(false)
					}
                } catch(e) {
                    clearInterval(interval);
                    resolve(false)
                }
            }, 500);
        })
        return p
    } else {
        console.log("no child window")
    }
	return false
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
