
function get_auth_endpoint(endpoint) {
	let url = `${location.protocol}//${location.host}/captcha/${endpoint}`
	return url
}

function get_secondary_auth_endpoint(endpoint) {
	let url = `${location.protocol}//${location.host}/captcha/secondary/${endpoint}`
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

