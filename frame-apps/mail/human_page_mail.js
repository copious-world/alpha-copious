
// human_page_media-grids.js

// FUNTIONS REQUIRED :: dependency
/*
    get_transition_endpoint -- auth_endpoints
    finalize_media_array_storage_deep_json -- upload_media
*/

/**
 * 
 */
class MailPageAPP extends CountedPageAPP {

    constructor(conf) {
        super(conf)
        this.admin_ucwid = "this-is-a-test"
    }

    set_admin_ucwid(a_ucwid) {
        this.admin_ucwid = a_ucwid
    }

	async remove_contact(contact) {
		let contact_handler_url = `${location.protocol}//${location.host}/captcha/transition/contact`
		let body = {
			"admin" : this.admin_ucwid,
			"ucwid" : contact.ucwid,
			"_tracking" : contact._tracking,
			"remove" : true
		}
		try {
			let resp = await postData(contact_handler_url, data,'include')
			if ( resp.OK === "true" ) {
				// reset the search results
			} else {
				// failed transmitio
			}
		} catch (e) {
			// failed handling
		}

	}
    
}


// ---- ---- ---- ---- ---- ---- ----

//
// FRAME PAGE SITE RESPONSE  -- handle messages from the site --
// either as a child window or as a page within an iframe
// 

let media_view_frame_responder = new MailPageAPP({
    "direction" : FRAME_PAGE_TO_PUBLISHER,
    "category" : false,
    "relationship" : FRAME_PAGE_RELATES_TO_PUBLISHER,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})

media_view_frame_responder.set_globals(media_view_frame_responder)
//
media_view_frame_responder.add_promise_handler("session-req")
media_view_frame_responder.add_promise_handler("data-req")
media_view_frame_responder.install_response()
//
media_view_frame_responder.set_human_frame_responder(media_view_frame_responder)
//

