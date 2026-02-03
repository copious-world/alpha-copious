


let g_responder_tables = {
    "human_frame" : {
        "resolver" : false,
        "rejector" : false
    },
	"signed" : {
        "resolver" : false,
        "rejector" : false
	}
}

function promise_decryption(source_name) {
    if ( g_responder_tables[source_name] !== undefined ) {  // do we implement this entry?
        let p = new Promise((resolve,reject) => {
            g_responder_tables[source_name].resolver = (signed_challenge) => {
                g_responder_tables[source_name] = {
                    "resolver" : false,
                    "rejector" : false            
                }
                resolve(signed_challenge)
            }
            g_responder_tables[source_name].rejector = () => {
                g_responder_tables[source_name] = {
                    "resolver" : false,
                    "rejector" : false            
                }
                reject(false)
            }
        })
        return p    
    }
    return false
}






async function req_signature(dobj) {
	let message = {
		"category": FRAME_ACTION_FROM_APP,
		"action" : FRAME_NEEDS_SIGNATURE,
		"data" : dobj
	}
	let p = promise_decryption("signed")  // the method returns a promise and does not faile
	if ( p !== false ) {
		tell_frame_page(message)
		let signed = await p
		return signed
	}
	return false
}


async function fetch_session_key(public_info) {
	// public_info.signer_public_key
	// public_info.pk_key
	try {
		let login_params = {
			"action" : "login",
			"ucwid" : public_info.ccwid,
			"strategy" : "igid"
		}
		let transition = await request_login(login_params)  // PRIMARY TRAHSITION
		if ( transition !== false ) {
			//
			let signed = await req_signature(transition)  // SIGN THE CHALLENGE
			if ( signed ) {
				// after waiting
				let secondary  = {
					"token" : transition.token,
					"signature" : signed
				}
				// elements === { "ucwid" : ccwid }  session_key === server side key === junk
				let [session_key,elements] = await post_secondary_login_data(secondary) // respond to the login seconday action
				if ( session_key ) {
					return session_key
				}
			}
		}
	} catch (e) {
	}
	return false
}


async function session_startup_process() {
    let message = {
        "category": FRAME_ACTION_FROM_APP,
        "action" : FRAME_START_SESSION,
        "data" : false
    }
    tell_frame_page(message)
}


function responding_alive() {
    let message = {
        "category": FRAME_COMPONENT_SAY_ALIVE,
        "action" : FRAME_COMPONENT_RESPOND,
        "data" : false
    }
    tell_frame_page(message)
}


async function app_fetch_session() {
	if ( g_frame_page ) {
		let message = {
			"category": FRAME_ACTION_FROM_APP,
			"action" : FRAME_WANTS_SESSION,
			"data" : location.hostname
		}
		//
		tell_frame_page(message)  // ask for the primary transition to be handled by the human frame...
		//
		try {
			let session = await promise_handling("session-req")
			return session
		} catch (e) {
		}
	}
	return false
}


async function app_make_request(session,req_obj) {
	if ( g_frame_page ) {
		req_obj.session_key = session
		let message = {
			"category": FRAME_ACTION_FROM_APP,
			"action" : FRAME_REQ_DATA,
			"data" : req_obj
		}
		//
		tell_frame_page(message)  // ask for the primary transition to be handled by the human frame...
		//
		try {
			let response = await promise_handling("data-req")
			return response
		} catch (e) {
		}
	}
	return false
}

