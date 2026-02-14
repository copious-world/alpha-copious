
// FUNTIONS REQUIRED :: dependency
/*
    app_check_session
*/


/**
 * 
 * 
 */

class HumanFrameHostedApp extends PageResponse {

    /**
     * 
     */
    constructor(conf) {
        super(conf)

        this.frame_page = window.parent
        if ( this.frame_page.postMessage === undefined ) {
            console.log("parent does not receive messages ")
        }
        // included just in case, but the next three are likely obsolete
        this.siteURL = window.location.host;
        this.finalizers = []
        this.loginStateViewHolders = {}
        //
        this.responder = false
        this.in_real_session = false

        this.add_receiver(this.frame_page,"everyone",HOSTED_APP_TO_ALL,APP_RELATES_TO_ALL)
        this.add_accepted_receiver("human-page")

    }

    /**
     * 
     * @param {object} human_frame 
     */
    set_human_frame_responder(human_frame) {
        this.responder = human_frame
    }


    /**
     * 
     * @param {string} u_name 
     */
    set_user_title(u_name) {
        let el = document.getElementById('active-user-title')
        if ( el  && u_name && (typeof u_name === "string") ) {
            el.innerHTML = u_name
        }
    }



    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     */
    common_promise_resolution(category,action,relationship,params) {
		if ( category === FRAME_TO_APP_PUBLIC_COMPONENT ) {
			switch ( action ) {
				case FRAME_HAS_SESSION: {
                    this.promise_resolution("session-req",params.response)
					return true
				}
				case FRAME_TO_HOSTED_APP_DATA: {
                    this.promise_resolution("data-req",params.response)
					return true
				}
			}
		}
        return false
    }

    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} data 
     * @returns {boolean}
     */
    tell_frame_page(category,action,data) {
        let message = { category, action, data }
        return this.tell_requesting_page(message,"human-frame")
    }

    relay_to_pages(category,action,data) {
        let message = { category, action, data }
        return this.tell_requesting_page(message,"everyone")
    }

    // message_handlers is used when there is no default category
    //
    async message_handlers(category,action,relationship,params) {
        switch ( category ) {
            case HOST_APP_PERSONALIZATION : {
                if ( typeof injest_personalization === "function" ) {
                    await this.injest_personalization(action,params)
                }
                break;
            }
            case FRAME_TO_HOSTED_APP_SESSIONS : {          /// a hosted page that does not start a session.
                if ( typeof injest_session === "function" ) {
                    await this.injest_session(action,params)
                }
                break;
            }
            default: {                  /// any other actions ... could be a login page that fetches a session
                try {
                    await this.application_specific_handlers(category,action,relationship,params)
                } catch (e) {
			        console.log(e)
                }
                break;
            }
        }
    }

    //
    async injest_personalization(action,params) {
		this.in_real_session = await app_check_session()
    }


	session_acquired() {
		return this.in_real_session
	}


    async injest_session(action,params) {}
    async personalization(post_params){}
    //
    async application_specific_handlers(category,action,relationship,params) {}



    async app_fetch_session() {
        if ( this.frame_page ) {
            let sent = this.tell_frame_page(FRAME_ACTION_FROM_APP,FRAME_WANTS_SESSION,location.hostname)
            if ( sent ) {
                try {
                    let session = await this.promise_handling("session-req")
                    return session
                } catch (e) {
                }
            }
        }
        return false
    }



    async app_make_request(session,req_obj) {   // req_obj has url in it
        if ( this.frame_page ) {
            req_obj.session_key = session
            //
            let sent = this.tell_frame_page(FRAME_ACTION_FROM_APP,FRAME_REQ_DATA,req_obj)  // ask for the primary transition to be handled by the human frame...
            //
            if ( sent ) {
                try {
                    let response = await this.promise_handling("data-req")
                    return response
                } catch (e) {
                }
            }
        }
        return false
    }
    
    
    url_for_use(base_url,frame_use) {   // builder application determined...
        return `${base_url}/${frame_use}`
    }

    /**
     * 
     * @param {string} human_frame_url 
     * @param {string} frame_use 
     * @returns {pair} -- pair[0] === child window or frame ...
     */
    async open_app_page_in_human_frame(human_frame_url,frame_use) {
        let [child,uri_of_launch] = (!check_frame_status()) ? 
                                        await open_cors_window(human_frame_url,("HUMAN-FRAME-" + frame_use))
                                        : [false,normalized_launch_url(human_frame_url)]
        if ( child ) {
            g_frame_page = child
            g_frame_cors_uri = uri_of_launch
            let p = this.alive_response("human_frame")
            this.tell_frame_page(FRAME_COMPONENT_SAY_ALIVE,FRAME_COMPONENT_RESPOND,false)
            try {
                let ok = await p
                if ( ok ) {
                    let frame_user_url = url_for_use(human_frame_url,frame_use)
                    if ( frame_user_url ) {
                        let data = {
                            "revise_source" : frame_user_url,
                            "use" : frame_use
                        }
                        this.tell_frame_page(FRAME_ACTION_LOAD_APP,FRAME_ACTION_LOAD_APP,data)
                    }
                }
            } catch (e) {}
        }
        return [child,uri_of_launch]
    }


    async open_intergalactic_session_window(frame_use,human_info,session) {
        if ( human_info ) {
            g_current_pub_identity = human_info
            let human_frame_url = human_info.human_frame_url
            let [frame_window,uri_of_launch] = await this.open_app_page_in_human_frame(human_frame_url,frame_use)
            if ( frame_window && session ) {
                this.tell_frame_page(SITE_TO_FRAME_SESSIONS,FRAME_HAS_SESSION,session)
            }
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

    
}


