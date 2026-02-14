
// human_page_media-grids.js

// FUNTIONS REQUIRED :: dependency
/*
    get_transition_endpoint -- auth_endpoints
    finalize_media_array_storage_deep_json -- upload_media
*/

/**
 * 
 */
class CalendarPageAPP extends CountedPageAPP {

    constructor(conf) {
        super(conf)
        this.admin_ucwid = "this-is-a-test"
		this.app_path = "command-upload"
    }

    set_admin_ucwid(a_ucwid) {
        this.admin_ucwid = a_ucwid
    }

	// this.app_path important to nginx configuration

	get_transition_endpoint(endpoint) {
		let url = `${location.protocol}//${location.host}/${this.app_path}/transition/${endpoint}`
		return url
	}

	get_secondary_transition_endpoint(endpoint) {  // uploader-commands
		let url = `${location.protocol}//${location.host}/${this.app_path}/transition/secondary/${endpoint}`
		return url
	}


	min_start_max_end_times(time_slots) {
		let min_start = Infinity
		let max_end = 0
		for ( let ts of time_slots ) {
			//
			let start = ts.start_time
			let end = ts.end_time
			if ( start < min_start ) min_start = start
			if ( end > max_end ) max_end = end
			//
		}
		return [min_start,max_end]
	}


	async send_time_slots(time_slots,time_slot_meta) {
		let slots_str = JSON.stringify(time_slots)
		let data_hash = do_hash(slots_str)
		let data = {
			"link" : get_transition_endpoint(time_slot_meta.link),
			"hash" : data_hash,
			"postable" : {		// send the fields this knows about. Expect the frame to had a hash and security
				"topic" : "command-upload",
				"path" : "upload-lite"
			}    /// slots are going later....
		}
		this.tell_frame_page(FRAME_ACTION_FROM_APP,HOST_UP_REQ_UPLOAD,data)
		//
		let primary_response = await this.promise_handling("post-response")
		if ( (primary_response.OK == true) &&  (primary_response.signage) ) {
			let upload_keys = primary_response.elements  // should be produced by publication handling
			let [min_time,max_time] = this.min_start_max_end_times(time_slots)
			let data_descriptor = {
				"ucwid" : primary_response.ucwid,
				"start_all_time" : min_time,
				"end_all_time" : max_time,
				"time_slots" : slots_str
			}
			let postable = {
				"token" : primary_response.token,		// primary action token (key to secondary)
				"topic" : "publish",
				"asset_type" : "calendar",
				"sign" : upload_keys.sign,
				"data" : data_descriptor,
				"hash" : data_hash
			}
			let link = this.get_secondary_transition_endpoint(time_slot_meta.secondary_link)
			let resp = await postData(link,postable)
			if ( resp.status = "OK" ) {
				return true
			}
			return false
		}
	}

}


// ---- ---- ---- ---- ---- ---- ----

//
// FRAME PAGE SITE RESPONSE  -- handle messages from the site --
// either as a child window or as a page within an iframe
// 

let calendar_frame_responder = new CalendarPageAPP({
    "direction" : FRAME_PAGE_TO_PUBLISHER,
    "category" : false,
    "relationship" : FRAME_PAGE_RELATES_TO_PUBLISHER,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})

calendar_frame_responder.set_globals(calendar_frame_responder)
//
calendar_frame_responder.add_promise_handler("session-req")
calendar_frame_responder.add_promise_handler("data-req")
calendar_frame_responder.install_response()
//
calendar_frame_responder.set_human_frame_responder(calendar_frame_responder)
//

