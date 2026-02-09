
// human_page_uploader.js


// FUNTIONS REQUIRED :: dependency
/*
    get_transition_endpoint -- auth_endpoints
    finalize_media_array_storage_deep_json -- upload_media
*/



//
/**
 * 
 */
class StreamerPageAPP extends HumanFrameHostedApp {

    constructor() {
        super()
        //
        this.ui_data = new DataFromUi()
        this.proxy = new Proxy(this)
    }


    /**
     * 
     * @param {*} category 
     * @param {*} action 
     * @param {*} relationship 
     * @param {*} params 
     */
    async application_specific_handlers(category,action,relationship,params) {
		if ( category === FRAME_TO_APP_PUBLIC_COMPONENT ) {
			switch ( action ) {
				case FRAME_HAS_SESSION: {
					let response = params.response
					if ( response ) {
						g_responder_tables["session-req"].resolver(response)
					} else {
						g_responder_tables["session-req"].rejector()
					}
					break
				}
				case FRAME_TO_HOSTED_APP_DATA: {
					let response = params.response
					if ( response ) {
						g_responder_tables["data-req"].resolver(response)
					} else {
						g_responder_tables["data-req"].rejector()
					}
					break
				}
			}
		}
    }


}


// ---- ---- ---- ---- ---- ---- ----

let g_app_auth_endpoint = "publisher"

//
// FRAME PAGE SITE RESPONSE  -- handle messages from the site --
// either as a child window or as a page within an iframe
// 

let streamer_frame_responder = new StreamerPageAPP({
    "direction" : FRAME_PAGE_TO_PUBLISHER,
    "category" : false,
    "relationship" : FRAME_PAGE_RELATES_TO_PUBLISHER,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})

streamer_frame_responder.set_globals(streamer_frame_responder)
//
streamer_frame_responder.add_promise_handler("session-req")
streamer_frame_responder.add_promise_handler("data-req")
streamer_frame_responder.install_response()
//
streamer_frame_responder.set_human_frame_responder(streamer_frame_responder)
//

