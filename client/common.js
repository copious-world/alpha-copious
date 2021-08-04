
var g_url_match = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
function matches_url(maybe_url) {
	return g_url_match.test(maybe_url)
}


function ext_of_file(file_name) {
	let idx = file_name.lastIndexOf('.')
	let ext = file_name.substr(idx+1)
	return ext
}

// not_https_switch 
// switch to HTTPS before doing any ops that may require a data exchange
function not_https_switch() {
	if (location.protocol !== 'https:') {           // start from a secure page
		alert("Switching to a secure version of this page in 1sec.")
		setTimeout(()=> {location.replace(`https:${location.href.substring(location.protocol.length)}`)},1000)
		return(true)
	}
	return(false)
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


// simple check on cookies, searching by ';' delimited string with the cookie name at the start of the trimmed line.
function getCookie(cname) {  // modified from w3school
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(let i = 0; i < ca.length; i++) {
		var c = ca[i];
		if ( typeof c === 'string' ) {
			c = c.trim()
			if (c.indexOf(name) == 0) {
				return c.substring(name.length);
			}
		}
	}
	return "";
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


//$$EXPORTABLE::
/*
matches_url
clonify
addscript
addstyle
getCookie
*/
