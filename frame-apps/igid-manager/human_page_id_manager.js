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
class ManagerPageAPP extends HumanFrameHostedApp {

    constructor() {
        super()
        //
        this.ui_data = new DataFromUi()
        this.proxy = new Proxy(this)

        // initial validation application is contact
        this.CurContainer = null // will be initilialized within the finalizers
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
						this.responder_tables["session-req"].resolver(response)
					} else {
						this.responder_tables["session-req"].rejector()
					}
					break
				}
				case FRAME_TO_HOSTED_APP_DATA: {
					let response = params.response
					if ( response ) {
						this.responder_tables["data-req"].resolver(response)
					} else {
						this.responder_tables["data-req"].rejector()
					}
					break
				}
			}
		}
    }


    async upload_identity() {
        let identity_str = await this.get_file()
        let identity = JSON.parse(identity_str)
        await restore_identity(identity)
        return identity
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //

    async get_file() {
        return await get_file_from_file_element(`drop-click-file_loader`)
    }

    async user_info_add_picture(fname,blob64) {
        // 
    }

    async load_blob_as_url(img_ucwid) {
        return await get_blob_file_from_file_element(`drop-click-file_loader`)
    }


    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //

    // Get the <span> element that closes the modal
    setupCaptchaClose() {
        let closerList = document.getElementsByClassName("close");
        let n = closerList.length
        for ( let i = 0; i < n; i++ ) {
            let span = closerList[i]
            span.onclick = function() {
                if ( this.CurContainer ) this.CurContainer.switchCaptchaDisplay(false)
                if ( this.captaFinalResolution ) this.captaFinalResolution(3)
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


let manager_frame_responder = new ManagerPageAPP({
    "direction" : MANAGER_PAGE_TO_FRAME,
    "category" : false,
    "relationship" : ID_MANAGER_ACTION_TO_FRAME,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})

manager_frame_responder.set_globals(manager_frame_responder)
//
manager_frame_responder.add_promise_handler("session-req")
manager_frame_responder.add_promise_handler("data-req")
manager_frame_responder.install_response()
//
manager_frame_responder.set_human_frame_responder(manager_frame_responder)
//
