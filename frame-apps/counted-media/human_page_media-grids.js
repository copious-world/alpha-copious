
// human_page_media-grids.js

// FUNTIONS REQUIRED :: dependency
/*
    get_transition_endpoint -- auth_endpoints
    finalize_media_array_storage_deep_json -- upload_media
*/

/**
 * 
 */
class CountedPageAPP extends HumanFrameHostedApp {

    constructor() {
        super()
        //
        this.testing = false
    }

    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     */
    async application_specific_handlers(category,action,relationship,params) {
        if ( !( this.common_promise_resolution(category,action,relationship,params) ) ) {
            if ( this.testing ) {
                console.log("descendant application")
            }
        }
    }
 


    // this code is questionable --- most likely not used in these applications 
    hide_thankyou_box(theBox) {
        theBox.style.visibility = "hidden"
        theBox.style.display = "none";
        theBox.style.zIndex = 0
    }

    show_thankyou_box(msg) {
        let theBox = document.querySelector("#thankyou_box")
        if ( theBox ) {
            if ( msg ) {
                let mbox = document.querySelector("#thankyou_box-message")
                if ( mbox ) mbox.innerHTML = msg

            }
            theBox.style.display = "block";
            theBox.style.visibility = "visible"
            theBox.style.zIndex = 2000
        }
    }

}


if ( typeof window !== "undefined" ) {
    if ( window.self === undefined ) {
        window.self = window
        self._x_counted_app_application_extension = false
    }
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
if  ( self._x_counted_app_application_extension === false ) {
    //
    // FRAME PAGE SITE RESPONSE  -- handle messages from the site --
    // either as a child window or as a page within an iframe
    // 

    let media_view_frame_responder = new CountedPageAPP({
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
}