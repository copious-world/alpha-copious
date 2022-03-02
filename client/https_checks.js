
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



//$$EXPORTABLE::
/*
not_https_switch
getCookie
*/
