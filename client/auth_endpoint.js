

function some_def(val) {
	if ( val === undefined ) return ""
	return val
}

function some_def_bool(val) {
	if ( val === undefined ) return false
	if ( typeof val === 'boolean' ) return val
	return !!(val)
}

let g_app_auth_endpoint = "captcha"
function get_auth_endpoint(endpoint) {
	let url = `${location.protocol}//${location.host}/${g_app_auth_endpoint}/${endpoint}`
	return url
}

function get_secondary_auth_endpoint(endpoint) {
	let url = `${location.protocol}//${location.host}/${g_app_auth_endpoint}/secondary/${endpoint}`
	return url
}


async function post_secondary_login_data(data) {
	try {
		let endpoint = get_secondary_auth_endpoint("users/login")
		let resp = await postData(endpoint, data,'include')
		if ( resp.OK === "true" ) {
			return [resp.token, resp.elements]  // token is the session_token === server side junk
		} else {
			return false
		}
	} catch (e) {
		return false
	}
}


async function request_login(data) {
	try {
		let endpoint = get_auth_endpoint("users/login")
		let resp = await postData(endpoint, data,'include')
		if ( resp.OK === "true" ) {
			return resp.data
		} else {
			return false
		}
	} catch (e) {
		return false
	}
}

