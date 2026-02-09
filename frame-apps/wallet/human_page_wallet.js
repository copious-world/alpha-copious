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
class WalletPageAPP extends HumanFrameHostedApp {

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


    async download_identity(user_info,remove) {
        //
        let downloadlink = document.getElementById("identity-download-link")
        if ( !(downloadlink) ) return false
        try {
            //
            let identity = await identity_from_user(user_info)
            let download_str = JSON.stringify(identity,null,4)

            let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(download_str);

            let ext = ".json"
            let fname = identity.name_key

            downloadlink.setAttribute("href",     dataStr     );
            downloadlink.setAttribute("download", (fname + ext) );
            downloadlink.click();
            //
            if ( remove ) {
                await unstore_user(identity)
            }
        } catch (e) {}
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

    // ---- parent_upload_identity
    async parent_upload_identity() {
        this.tell_frame_page(FRAME_COMPONENT_MANAGE_ID,FRAME_ACTION_UPLOAD,false) 
    }

    // ---- app_download_identity
    async parent_download_identity() {
        this.tell_frame_page(FRAME_COMPONENT_MANAGE_ID,FRAME_ACTION_DOWNLOAD,false) 
    }


    async parent_download_public_intro() {
        this.tell_frame_page(FRAME_COMPONENT_MANAGE_ID,FRAME_ACTION_DOWNLOAD_PUBLIC,false) 
    }


    async tell_parent_to_remove_identity() {
        this.tell_frame_page(FRAME_COMPONENT_MANAGE_ID,FRAME_ACTION_REMOVE,false) 
    }


    tell_frame_profile_image(blob64) {
        let removal_msg = {
            "image_url" : blob64
        }
        this.tell_frame_page(FRAME_MANAGE_PICTURE_ASSET,FRAME_ACTION_ATTACH,removal_msg) 
    }


    set_user_title(u_name) {
        let el = document.getElementById('active-user-title')
        if ( el  && u_name && (typeof u_name === "string") ) {
            el.innerHTML = u_name
        }
    }


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


let wallet_frame_responder = new WalletPageAPP({
    "direction" : WALLET_PAGE_TO_FRAME,
    "category" : false,
    "relationship" : ID_WALLET_ACTION_TO_FRAME,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})

wallet_frame_responder.set_globals(wallet_frame_responder)
//
wallet_frame_responder.add_promise_handler("session-req")
wallet_frame_responder.add_promise_handler("data-req")
wallet_frame_responder.install_response()
//
wallet_frame_responder.set_human_frame_responder(wallet_frame_responder)
//

