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
//                                                  <<depends>> errorMessage
function launch_simple_link(default_url,window_name) {
	let launched = window.open(`https://${default_url}/`,window_name)
	if ( !launched ) {
		errorMessage(`could not open window or tab for link ${default_url}`)
	}
}



//$$EXPORTABLE::
/*
ext_of_file
clonify
addscript
addstyle,
launch_simple_link
*/
