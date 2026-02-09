
/**
 * 
 * This methods connects a web interfeace (user's session) to a counter, managed by the copious world auth stack
 * 
 * // _x_link_counter -> counter_link
 * 
 * @param {string} tracking 
 * @param {string} protocol -- a very small vocabulary of protocols to direct the application use cases (local,test, other)
 * @param {object} media 
 * @param {string} counter_link  -- the counter link is complete, stored in the _x_link_counter field of the meta object
 * @param {string} session 
 * @returns {object}
 */
	async function media_startup(tracking,protocol,media,counter_link,session) { // _x_link_counter > counter_link
		if ( tracking === undefined ) return false
		if ( protocol === 'local' ) {	
			let links = await clear_counted(counter_link,tracking,session,media)  // src is for checking...
			return links
		} else if ( protocol !== 'test' ) {
			let links = await crypto_ready_counted(counter_link,tracking,session,media)  // src is for checking...
			return links
		} else {		// default for test
			counter_link = "localhost:3777"
			let links = await clear_counted(counter_link,tracking,session,media)
			return links
		}
	}


	/**
	 * This method should only be called if the user has a session going.
	 * 
	 * @param {string} counter_link 
	 * @param {string} tracking 
	 * @param {string} session 
	 * @param {object} media 
	 * @returns {object}  - links to the media that the user will see/hear/etc.
	 */
	async function crypto_ready_counted(counter_link,tracking,session,media) {
		//
		let prot = "https:"  // https -- no choice about the protocol even if the page is not on https
		let sp = "//"
		let url = `${prot}${sp}${counter_link}/transition/key-media`
		
		// /${tracking}`
		// if ( (typeof session === 'string') && (session.length > 0) ) {
		// 	url += `/${session}`
		// }

		try {
			let req_obj = {
				"url" : url,
				"session" : session,
				"protocol" : media.protocol,			// the server may need to know which storage protocol is in use
				"_tracking" : tracking
			}
			let result = await app_make_request(session,req_obj)  // asks the frame to get the object
			if ( result.status === "OK" ) {
				return result.links
			}
		} catch(e) {
		}
		return false
	}


	/**
	 * 
	 * @param {string} counter_link 
	 * @param {string} tracking 
	 * @param {string} session 
	 * @param {object} media 
	 * @returns {object}  - links to the media that the user will see/hear/etc.
	 */
	async function clear_counted(counter_link,tracking,session,media) {
		//
		let prot = location.protocol
		let sp = "//"
		let url = `${prot}${sp}${counter_link}/transition/clear-media`
		if ( (typeof session === 'string') && session.length > 0 ) {
			url += `/${session}`
		}
		//
		try {
			let req_obj = {
				"url" : url,
				"protocol" : media.protocol,			// the server may need to know which storage protocol is in use
				"_tracking" : tracking
			}
			let result = await app_make_request(session,req_obj)  // asks the frame to get the object
			if ( result.status === "OK" ) {
				return result.links
			}
		} catch(e) {
		}
		return false
	}

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	async function retrieve_session() {			// should be stored in some kind of local storage....
		return await app_fetch_session()
	}
