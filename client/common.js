
function gen_nonce() {
	return btoa(window.crypto.getRandomValues(new Uint8Array(16)))
}

function ext_of_file(file_name) {
	let idx = file_name.lastIndexOf('.')
	let ext = file_name.substr(idx+1)
	return ext
}

function clonify(obj) {
	if ( typeof obj === 'string' ) return(obj)
	try {
		let out = JSON.parse(JSON.stringify(obj))
		return(out)
	} catch(e) {
		return(null)
	}
}


// attach a script to a DOM element
function addscript(script,whereScipt) {
	var scriptEl = document.createElement('script');
	scriptEl.type = 'text/javascript';
	scriptEl.text = script;
    if ( typeof whereScipt === "string" ) {
        whereScipt = document.getElementById(whereScipt)
    }
	whereScipt.appendChild(scriptEl);
}



function addstyle(script) {
    var styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.text = script;
    let whereScript = document.getElementsByTagName('head')
    if ( whereScript && whereScript.length ) {
        whereScript[0].appendChild(styleEl);
    }
}


function launch_simple_link(default_url,window_name) {
	let launched = window.open(`https://${default_url}/`,window_name)
	if ( !launched ) {
		errorMessage(`could not open window or tab for link ${default_url}`)
	}
}


//$$EXPORTABLE::
/*
gen_nonce
ext_of_file
clonify
addscript
addstyle,
launch_simple_link
*/
