// MODULE: POST FETCH (windowized)

//$>>	fetchEndPoint
// //
// fetch with GET method
async function fetchEndPoint(endpoint,port) {
	port = !(port) ? '' : ( port.length ? `:${port}`   : '')
	let myRequest = new Request(`${location.protocol}//${location.hostname}${port}/${endpoint}`);
	try {
		const body = await fetch(myRequest, {
									method: 'GET', // *GET, POST, PUT, DELETE, etc.
									mode: 'cors', // no-cors, *cors, same-origin
									cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
									credentials: 'omit', // include, *same-origin, omit
									redirect: 'follow', // manual, *follow, error
									referrerPolicy: 'no-referrer', // no-referrer, *client
								});
		//
		let infoObj = await body.json();
		return(infoObj)
		//
	} catch (e) {
		console.log(e.message)
		return(false)
	}
}

//$>>	fetchTextFile
// //
// fetch with GET method
async function fetchTextFile(endpoint,port) {
	port = !(port) ? '' : ( port.length ? `:${port}`   : '')
	let myRequest = new Request(`${location.protocol}//${location.hostname}${port}/${endpoint}`);
	try {
		const body = await fetch(myRequest, {
									method: 'GET', // *GET, POST, PUT, DELETE, etc.
									mode: 'cors', // no-cors, *cors, same-origin
									cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
									credentials: 'omit', // include, *same-origin, omit
									redirect: 'follow', // manual, *follow, error
									referrerPolicy: 'no-referrer', // no-referrer, *client
								});
		//
		let html = await body.text();
		return(html)
		//
	} catch (e) {
		console.log(e.message)
		return(false)
	}
}

//$>>	fetchUrl
// //
// fetch with GET method
async function fetchUrl(endpoint) {
	let myRequest = new Request(endpoint);
	try {
		const body = await fetch(myRequest, {
									method: 'GET', // *GET, POST, PUT, DELETE, etc.
									mode: 'cors', // no-cors, *cors, same-origin
									cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
									credentials: 'omit', // include, *same-origin, omit
									redirect: 'follow', // manual, *follow, error
									referrerPolicy: 'no-referrer', // no-referrer, *client
								});
		//
		let infoObj = await body.json();
		return(infoObj)
		//
	} catch (e) {
		console.log(e.message)
		return(false)
	}
}


//$>>	postData
// //
//  call fetch with method POST tyr to help with parameters..  If data is FromData set do_stringify to false
//  default content type 'application/json'
//  User 'cors', Default cres = omit, If ctype == 'multipart/form-data' be sure to use FormData -- lets fetch set content type.
//  RETURNS: parsed JSON object or an empty object. ... Check for fields
//
async function postData(url = '', data = {}, creds = 'omit', do_stringify = true, ctype) {
	let content_type = 'application/json'
	if ( ctype !== undefined ) {
		content_type = ctype            // ctype is content type
	}
	let options = {
		method: 'POST', // *GET, POST, PUT, DELETE, etc.
		mode: 'cors', // no-cors, *cors, same-origin
		cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
		credentials: creds, // include, *same-origin, omit
		headers: {
			'Content-Type': content_type
		},
		redirect: 'follow', // manual, *follow, error
		referrerPolicy: 'no-referrer', // no-referrer, *client
		body: (do_stringify ? JSON.stringify(data)  : data)	// body data type must match "Content-Type" header
	}

	if ( ctype === 'multipart/form-data') {
		delete options.headers['Content-Type']  // content type will be set automatically with a boundary
	}

	// Default options are marked with *
	const response = await fetch(url, options);
	if ( response.ok == false ) {
		console.log(response.status + ': ' + response.statusText)
		return {}
	} else {
		return await response.json(); // parses JSON response into native JavaScript objects
	}
}


//$>>	post_submit
function hide_interface_box() {
	let display = document.getElementById('interface-box')
	if ( display ) {
		display.style.visibility = "hidden"
		display.style.display = "none"
	}
}

function hide_box(bxname) {
	let display = document.getElementById(bxname)
	if ( display ) {
		display.style.visibility = "hidden"
		display.style.display = "none"
	}
}

function show_box(bxname) {
	let display = document.getElementById(bxname)
	if ( display ) {
		display.style.visibility = "visible"
		display.style.display = "block"
	}
}

hide_box('error-box')
hide_box('success-box')

async function post_submit(fields) {
	let bdy = {}
	fields.forEach(element => {
		let fld = document.getElementById(element)
		if ( fld ) {
			bdy[element] = fld.value
		}
	});
	let url = bdy.post_url
	if ( url ) {
		delete bdy.post_url
		//
		let resp = await postData(url, bdy)
		//
		if ( resp ) hide_interface_box()
		if ( resp && (resp.OK === 'true') ) {
			show_box('success-box')
		} else {
			show_box('error-box')
		}
	}
}

//$$EXPORTABLE::
/*
fetchEndPoint
fetchTextFile
fetchUrl
postData
post_submit
*/
