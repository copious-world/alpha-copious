

class BuilderPageResponse extends PageResponse {

	constructor(conf) {
		super(conf)

		this._until_page_reloads_identity = false
	}


	/**
	 * 
	 * @param {object} public_component 
	 */
	async store_public_identity(public_component) {
		await store_user(public_component)		// dB operation  use_db.js
	}

	/**
	 * 
	 * @param {object} identity 
	 */
	keep_identity_for_human_frame_startup(identity) {
		this._until_page_reloads_identity = identity
	}

	/**
	 * 
	 * @returns {object}
	 */
	get_identity_for_human_frame_startup() {
		return this._until_page_reloads_identity
	}

    /**
     * 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     */
    async default_category_message_handlers(action,relationship,params,mobj) {

		switch ( action ) {
			case FRAME_ACTION_INJECT: {
				let public_component = params;
				if ( typeof public_component === 'object') {
					await this.store_public_identity(public_component)  // public to local DB
				}
				break;
			}
			case FRAME_ACTION_INSTALL: {
				let identity = params;
				if ( typeof identity === 'object' ) {
					this.keep_identity_for_human_frame_startup(identity)
					if ( typeof identity.public_component === 'object' ) {
						if ( identity.public_component.human_frame_url ) {
							await this.store_public_identity(identity.public_component)  // public to local DB
							update_frame_source(identity.public_component.human_frame_url)
							try {
								let ok = await this.promise_handling("human_frame")
								if ( ok ) {
									let identity = this.get_identity_for_human_frame_startup()
									this.tell_frame_page(FRAME_COMPONENT_MANAGE_ID, FRAME_ACTION_INSTALL, identity)
								}
							} catch (e) {
							}
						}
						//
					}
				}
				break;
			}
		}
	}

}


let builder_page_responder = new BuilderPageResponse({
	"direction" : BUILDER_PAGE_TO_SITE,
	"category" : FRAME_COMPONENT_MANAGE_ID,
	"relationship" : false,
	"alive_category" : HOST_APP_PERSONALIZATION,
	"alive_requires_response" : FRAME_COMPONENT_RESPOND,
	"signal_responding" : FRAME_COMPONENT_RESPONDING
})

builder_page_responder.set_globals(builder_page_responder)
//
builder_page_responder.add_promise_handler("human_frame")
//
builder_page_responder.install_response()




/**
 * 
 */
class NewUserResponse extends PageResponse {

	constructor(conf) {
		super(conf)
	}


	async prompt_for_identity() {
		// TBD
	}

    /**
     * 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     */
    async default_category_message_handlers(action,relationship,params,mobj) {
		if ( action === FRAME_HAS_PERSONALIZATION ) {
			if ( mobj.data ) {
				update_frame_source(mobj.data)   // just change the page to the one indicated by `new_user.html`
			} else {
				await this.prompt_for_identity()
			}
			// then nothing else happens until a user identity builder sends partial (public) initial identity
		}
	}


}

let new_user_responder = new NewUserResponse({
	"direction" : NEW_USER_TO_FRAME,
	"category" : HOST_APP_PERSONALIZATION,
	"relationship" : false,
	"alive_category" : HOST_APP_PERSONALIZATION,
	"alive_requires_response" : FRAME_COMPONENT_RESPOND,
	"signal_responding" : FRAME_COMPONENT_RESPONDING
})

new_user_responder.set_globals(new_user_responder)
//
new_user_responder.install_response()
//





/**
 * 
 */
class HostedAppChangeResponse extends PageResponse {

	constructor(conf) {
		super(conf)
	}

    /**
     * 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     */
    async default_category_message_handlers(action,relationship,params,mobj) {
		if ( action === FRAME_HAS_PERSONALIZATION ) {
			update_frame_source(mobj.data)
		}
	}

}

let hosted_app_change_responder = new HostedAppChangeResponse({
	"direction" : HOSTED_APP_TO_FRAME,
	"category" : HOST_APP_PERSONALIZATION,
	"relationship" : false,
	"alive_category" : HOST_APP_PERSONALIZATION,
	"alive_requires_response" : FRAME_COMPONENT_RESPOND,
	"signal_responding" : FRAME_COMPONENT_RESPONDING
})

hosted_app_change_responder.set_globals(hosted_app_change_responder)
//
hosted_app_change_responder.install_response()



class ServiceFramework extends PageResponse {

	constructor(conf) {
		super(conf)
	}

	session_startup_process() {
		this.tell_frame_page(FRAME_ACTION_FROM_APP, FRAME_START_SESSION, false)
	}


	install_response() {
		super.install_response()
		this.session_startup_process()
	}


	async load_public_identity() {
		// dB operation
		let [users,identities] = await get_known_users()   // use_db.js
		if ( users && users.length ) {
			let u_record = identities[0]
			try {
				let upub = JSON.parse(u_record.data["user-meta"])
				return upub
			} catch(e) {
				console.log("parse error user data")
			}
		}
		return false
	}

	tell_human_page_new_source(app_url,use = 'app') {
		let data = {
			"revise_source" : app_url,
			"use" : use,
			"publications" : false
		}

		this.tell_frame_page(FRAME_ACTION_LOAD_APP, FRAME_ACTION_LOAD_APP, data)
	}



	human_page_has_app() {
		return this.promise_resolution("human_frame_loaded_app",true)
	}

	/**
	 * 
	 * @param {string} action 
	 * @param {object} params 
	 */
	async session_id_management(action,params) {
		switch ( action ) {
			case FRAME_COMPONENT_MANAGE_ID: {
				if ( params.data ) {
					// some action has provided data
					let id_state = params.data
					// "has_identity" : has_identity,
					// "identity_complete" : complete_identity
					if ( id_state.has_identity === false ) {		// when installing identity
						let pub_id = await this.load_public_identity()
						let id_packet = {
							"name" : pub_id.name,
							"ccwid" : pub_id.ccwid,
							"human_frame_url" : pub_id.human_frame_url,
							"name_as_uri" : pub_id.name_as_uri,
							"public_component" : pub_id
						}
						this.tell_frame_page(FRAME_COMPONENT_MANAGE_ID, FRAME_ACTION_INSTALL, id_packet)
					}
				}
				break;
			}
			case FRAME_ACTION_GET_LOGIN_URL: {
				let id_packet = {
					"revise_source" : LOGIN_URL,
					"use" : "login"
				}
				this.tell_frame_page(FRAME_PAGE_AUTO_LOGIN, FRAME_ACTION_REGISTER, id_packet)
				break;
			}
			case FRAME_ACTION_LOGIN: {
				this.tell_human_page_new_source(APPLICATION_URL)
				await this.human_page_has_app()
				let session_key = await fetch_session_key(params)   // FETCH SESSION KEY (LOGIN)
				if ( session_key ) {
					let data = {
							"name" : params.name,
							"ccwid" : params.ccwid,
							"session" : session_key
					}
					this.tell_frame_page(SITE_TO_FRAME_SESSIONS, FRAME_HAS_SESSION, data)
				}
				break;
			}
		}
	}


	/**
	 * 
	 * @param {string} action 
	 * @param {object} params 
	 */
	async public_component_for_pwa(action,params) {
		switch ( action ) {
			case FRAME_COMPONENT_RESPONDING: {
				if ( params !== "fail" ) {
					let session_key = await fetch_session_key(params.public_component)   // FETCH SESSION KEY (LOGIN)
					if ( session_key ) {
						let data = {
							"name" : params.name,
							"ccwid" : params.ccwid,
							"session" : session_key
						}
						this.tell_frame_page(FRAME_ACTION_FROM_APP, FRAME_HAS_SESSION, data)
					}
				}
				break
			}
			case FRAME_SIGNED: {
				let signed = params.signed
				this.promise_resolution("signed",signed)
				break
			}
		}
	}

    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     */
    async application_specific_handlers(category,action,relationship,params) {
		switch ( category ) {
			case FRAME_WANTS_SESSION: {
				await this.session_id_management(action,params)
				break;
			}
			case FRAME_TO_APP_PUBLIC_COMPONENT: {
				await this.public_component_for_pwa(action,params)
				break;
			}
		}
	}
}


//
// FRAME PAGE SITE RESPONSE  -- handle messageCountedPageAPPs from the site --
// either as a child window or as a page within an iframe
// 

let service_frame_responder = new ServiceFramework({
	"direction" : FRAME_PAGE_TO_SITE,
	"category" : false,
	"relationship" : FRAME_PAGE_RELATES_TO_SITE,
	"alive_category" : FRAME_COMPONENT_SAY_ALIVE,
	"alive_requires_response" : FRAME_COMPONENT_RESPOND,
	"signal_responding" : FRAME_COMPONENT_RESPONDING
})

service_frame_responder.set_globals(service_frame_responder)
//
service_frame_responder.add_promise_handler("human_frame")
service_frame_responder.add_promise_handler("human_frame_loaded_app")
service_frame_responder.add_promise_handler("builder")
service_frame_responder.install_response()
//


/**
 * TBD --- has not yet been used.  Looking for a fixed container
 */
function setup_iframe_readiness_response() {
	let id="app-human-frame"
	let human_frame = document.getElementById(id)
	if ( human_frame !== null ) {
		//
		human_frame.addEventListener('load', (evnt) => {
			if ( g_human_frame_url == evnt.target.src ) {
				let app_url = APPLICATION_URL
				tell_human_page_new_source(APPLICATION_URL)
			}
		});
		//
	}

}

let g_human_frame_url = ""
function update_frame_source(url_str) {
	let id="app-human-frame"
	let human_frame = document.getElementById(id)
	if ( human_frame !== null ) {
		g_human_frame_url = url_str
		human_frame.src = url_str
	}
}

update_frame_source("./new_user.html")


async function startup() {
	let pub_id = await service_frame_responder.load_public_identity()
	if ( pub_id !== false ) {
		let url = pub_id.human_frame_url
		if ( url !== undefined ) {
			update_frame_source(url)
		}
	}
}

startup()



















/*
if (navigator.storage && navigator.storage.estimate) {
  const quota = await navigator.storage.estimate();
  // quota.usage -> Number of bytes used.
  // quota.quota -> Maximum number of bytes available.
  const percentageUsed = (quota.usage / quota.quota) * 100;
  console.log(`You've used ${percentageUsed}% of the available storage.`);
  const remaining = quota.quota - quota.usage;
  console.log(`You can write up to ${remaining} more bytes.`);
}


// QuotaExceededError
const transaction = idb.transaction(['entries'], 'readwrite');
transaction.onabort = function(event) {
  const error = event.target.error; // DOMException
  if (error.name == 'QuotaExceededError') {
    // Fallback code goes here
  }
};



// cache -- QuotaExceededError
try {
  const cache = await caches.open('my-cache');
  await cache.add(new Request('/sample1.jpg'));
} catch (err) {
  if (error.name === 'QuotaExceededError') {
    // Fallback code goes here
  }
}







// Check if site's storage has been marked as persistent
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persisted();
  console.log(`Persisted storage granted: ${isPersisted}`);
}

// Request persistent storage for site -- A PERMISSION GRANTED BY THE USER
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persist();
  console.log(`Persisted storage granted: ${isPersisted}`);
}


// If the persistent storage permission is granted, the browser will not evict data stored in:

//     Cache API
//     Cookies
//     DOM Storage (Local Storage)
//     File System API (browser-provided and sandboxed file system)
//     IndexedDB
//     Service workers
//     App Cache (deprecated, should not be used)
//     WebSQL (deprecated, should not be used)


*/

// Each business puts this in a frame and knows how to conduct its login.
// The function must ask the frame to run private key related methods

// If captchas are being used, that is also part of the business logic.
// so, if this fetch is secondary to a captcha, then captcha handling is defined here. 
//




// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


