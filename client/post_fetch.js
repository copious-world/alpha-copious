// MODULE: POST FETCH (windowized)


// $>> may include interface helpers for displaying success and error



//$>>	fetchUrl
// //
// fetch with GET method
/**
 * 
 * Assume the endpoint is a complete URL (URI)
 * Each of the methods (helpers) pick a set of parameters useful for calls made the most often.
 * 
 * The server should return an object, and this will parse it as JSON
 * 
 * @param {string} endpoint 
 * @returns {object|boolean}  - returns false on error otherwise an object delivered from the server.
 */
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




//$>>	fetchEndPoint
/**
 * 
 * Requests an object from the including page's host.
 * This is a simple object file fetch.
 * It expects the server to return a string that can be parsed as JSON, or else there will be an error.
 * The end point string should be some part of the local host API.
 * If the port is passed, will be used to identify the server on the 
 * 
 * This method constructs the full URL(URI)
 * 
 * fetch with GET method * 
 * @param {string} endpoint 
 * @param {string} port -- optionals
 * @returns {object|boolean}
 */
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
/**
 * Requests a string from the including page's host.
 * This is a simple text file fetch.
 * It expects the server to return a string, or else there will be an error.
 * The end point string should be some part of the local host API.
 * If the port is passed, will be used to identify the server on the 
 * 
 * This method constructs the full URL(URI)
 * 
 * fetch with GET method
 * 
 * @param {string} endpoint 
 * @param {string} port -- optional
 * @returns {string}
 */
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


//$>>	postData
/**
 * 
 * call fetch with method POST tyr to help with parameters..  If data is FromData set do_stringify to false
 * default content type 'application/json'
 * User 'cors', Default cres = omit, If ctype == 'multipart/form-data' be sure to use FormData -- lets fetch set content type.
 * RETURNS: parsed JSON object or an empty object. ... Check for fields
 * @param {string} url 
 * @param {object} data 
 * @param {string} creds - (optional)
 * @param {boolean} do_stringify 
 * @param {string} ctype - content type
 * @returns {object}
 */
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



//$>>	postDataWithRefer
// //
//  call fetch with method POST tyr to help with parameters..  If data is FromData set do_stringify to false
//  default content type 'application/json'
//  User 'cors', Default cres = omit, If ctype == 'multipart/form-data' be sure to use FormData -- lets fetch set content type.
//  RETURNS: parsed JSON object or an empty object. ... Check for fields
//
async function postDataWithRefer(url = '', data = {}, creds = 'omit', do_stringify = true, ctype) {
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
		redirect: 'error', // manual, *follow, error
		referrerPolicy: 'origin', // no-referrer, origin
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

/**
 * Takes in a list of names of fields each having a "value" member.
 * The list is used to contsuct a JSON object which will be the body of the request.
 * 
 * @param {Array} fields 
 */
async function post_submit(fields) {
	if ( !(Array.isArray(fields)) ) return
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
		if ( resp && typeof hide_interface_box === "function" ) hide_interface_box()
		if ( resp && (resp.OK === 'true') ) {
			if( typeof show_box === "function" ) show_box('success-box')
		} else {
			if( typeof show_box === "function" ) show_box('error-box')
		}
	}
}



//---- make host request ----
async function make_host_request(endpoint,data) {
	try {
		let resp = await postData(endpoint, data ) //,'include')
		if ( resp.OK === "true" ) {
			return resp.data
		} else {
			return false
		}
	} catch (e) {
		return false
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
