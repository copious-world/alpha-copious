
//$>>	matches_url
var g_url_match = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
function matches_url(maybe_url) {
	return g_url_match.test(maybe_url)
}

//$>>	checkEmailField
var g_reEmail = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
function checkEmailField(efield) {
	let email = efield.value
	if ( !(g_reEmail.test(email)) ) {
		return(false)
	}
	return(true)
}

//$>>	getVal
function getVal(the_field) {
	if ( the_field ) {
		let val = the_field.value;
		if ( val.length ) {
			val = encodeURIComponent(val)
		}
		return(val)
	}
	return("")
}

//$>>	is_empty
function is_empty(the_field) {
	if ( the_field && ( the_field.value.length > 0 ) ) {
		return(false)
	}
	return(true)
}

//$>>	errorMessage
let prev_msg = false
function errorMessage(msg) {
	let msg_box = document.getElementById('page-error-message')
	if ( msg_box ) {
		msg_box.innerHTML = msg
		if ( prev_msg ) {
			clearTimeout(prev_msg)
			prev_msg = false
		}
		console.log(msg)		/// for the developer
		prev_msg = setTimeout( () => { msg_box.innerHTM = "status good" }, 60000 )   // one minute
	}
}

//$>>	colorize
function colorize(theField,colr) {
	theField.style.borderColor = colr;
}



//$$EXPORTABLE::
/*
matches_url
checkEmailField
getVal
is_empty
errorMessage
colorize
*/
