


// FUNTIONS REQUIRED :: dependency
/*
    check_frame_status
    registration
    get_complete_user_identity  -- use db

*/


/**
 * 
 */
class FramePageSiteResponse extends PageResponse {

    //
    constructor(conf) {
        super(conf)
        this.template_subst_id = ""
        this._captured_domain = false  // it has to be captured first to be a string
        //
        this._window_in_frame = false
        this._site_page = false
        this.DEFAULT_APP_CONTAINER_FRAME_ID = conf.app_container
        this.DEFAULT_APP_UPLOADER_FRAME_ID = conf.upload_container
    }
    //


    /**
     * 
     */
    install_response() {
        super.install_response()
        // initialize the frame status

        let fstats = check_frame_status()
        this._window_in_frame = fstats.in_frame
        if ( this._window_in_frame ) {
            this._site_page = fstats.from_site
        }
    }


    /**
     * 
     * @param {string} str 
     */
    set_template_subst_id(str) {
        this.template_subst_id = str
    }



    /**
     * Given a URL with a "login" path element, this 
     * method replaces that with a symbol indicating a place for substitution.
     * 
     * The resultant string is assigned to the *captured* domain, which is a member variable
     * 
     * 
     * @param {string} source 
     */
    if_logging_in_capture(source) {
        if ( source.indexOf("login") > 0 ) {
            this._captured_domain = source.replace("login","@")
        }
    }


    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     */
    async message_handlers(category,action,relationship,params,mobj) {
        try {       // relationship checked by super
            switch ( category ) {    // 
                case FRAME_PAGE_AUTO_LOGIN: {
                    await this.human_frame_site_login_capture(params)
                    break;
                }
                case FRAME_ACTION_LOAD_APP : {
                    this.human_frame_application_load_app_page(params)
                    this.human_frame_application_load_uploader(params)
                    break;
                }
                case SITE_TO_FRAME_SESSIONS: {   // action === FRAME_HAS_SESSION
                    if ( action === FRAME_HAS_SESSION ) {
                        let session = data
                        this._g.current_session = session
                        this._g.this_page_instance_is_session_owner = true
                        //
                        let msg = {
                            "category" : FRAME_TO_HOSTED_APP_SESSIONS,
                            "action" : FRAME_START_SESSION,
                            "data" : {
                                "session" : session,
                                "ccwid" : this._g.current_pub_identity ? this._g.current_pub_identity.ccwid : false
                            }
                        }
                        this.tell_requesting_page(msg,"hosted-app")
                        this.tell_requesting_page(msg,"service-worker")
                        msg = {
                            "category" : FRAME_TO_HOSTED_APP_SESSIONS,
                            "action" : FRAME_START_SESSION,
                            "data" : {
                                "ccwid" : this._g.current_pub_identity ? this._g.current_pub_identity.ccwid : false
                            }
                        }
                        let sent = this.tell_requesting_page(msg,"publisher")
                        if ( !sent ) {
                            this._g.publisher_message_queue.push(msg)
                        }
                        //
                        this.update_preferences_frame(session)
                    }
                    break;
                }
                case FRAME_COMPONENT_MANAGE_ID :
                case HOST_APP_PERSONALIZATION: {
                    if ( action === FRAME_ACTION_INSTALL ) {   // In mobile app, a partial ID is sent the first time
                        let identity = data
                        await this._g.human_frame_application_id_installation(identity,true)
                        // The first time, this will present the completion mode
                        await this._g.update_UI_user_data_present()
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        } catch (e) {

        }
    }





    human_frame_application_load_uploader(data) {
        let source = data.publications
        if ( source ) {
            let frame = document.getElementById(this.DEFAULT_APP_UPLOADER_FRAME_ID)
            if ( frame ) {
                source = fussy_url(source)
                this._g.capture_app(source)
                frame.src = source
            }    
        }
    }


    /**
     * 
     * @param {object} data 
     */
    human_frame_application_load_app_page(data) {
        let source = data.revise_source
        if ( source ) {
            let frame = document.getElementById(this.DEFAULT_APP_CONTAINER_FRAME_ID)
            if ( frame ) {
                this.if_logging_in_capture(source)
                source = fussy_url(source)
                frame.src = source
            }    
        }
    }



    /**
     * 
     * @param {object} user_info 
     * @returns {boolean}
     */
    async register_on_PWA_login_capture(user_info) {
        if ( this._window_in_frame ) {
            if ( user_info ) {
                //
                let OK = await this._g.registration(user_info.public_component)
                return OK
                //
            }
        }
        return false
    }


    /**
     * human_frame_site_login_capture
     * 
     * 
     */
    async human_frame_site_login_capture(data) {
        let source = data.revise_source
        if ( source ) {
            // 
            this.if_logging_in_capture(source)           // LOGIN CAPTURE
            source = fussy_url(source)
            //
            let frame = document.getElementById(this.DEFAULT_APP_CONTAINER_FRAME_ID)
            frame.src = source
            // login capture ... means url template from login
            /// done after login capture... login capture enables apps to start sessions and get a session id token

            let identity = await get_complete_user_identity(this.template_subst_id)

            let registered = await this.register_on_PWA_login_capture(identity) 

            if ( registered ) {
                //
                let has_identity = identity == false ? false : true
                let complete_identity = true
                if ( identity.private === undefined ) {
                    complete_identity = false
                }
                //
                let identity_state_data = {
                    "has_identity" : has_identity,
                    "identity_complete" : complete_identity,
                    "app_ready" : true
                }
                this.human_frame_singaling_alive(identity_state_data)
            }

        }
    }


    // ADDED FOR PWA ...
    /**
     * Called only if 'registered' returned true, which means this is functioning in a PWA
     * @param {object} id_state_descr 
     */
    human_frame_singaling_alive(id_state_descr) {
        //
        let action = FRAME_ACTION_GET_LOGIN_URL
        let action_choice = id_state_descr.has_identity && id_state_descr.complete_identity && id_state_descr.app_ready
        if ( action_choice ) {
            action = FRAME_ACTION_LOGIN
        } else {
            if ( id_state_descr.has_identity && !(id_state_descr.complete_identity) ) {
                action = FRAME_COMPONENT_MANAGE_ID
            }
        }
        //
        let message = {
            "category": FRAME_WANTS_SESSION,
            "action" : action,
            "data" : id_state_descr
        }
        this.tell_requesting_page(message,"site-page")
    }


    // PERSONALIZATION MESSAGES
    /**
     * 
     * @param {string} session 
     */
    update_preferences_frame(session) {
        let msg = {
            "category" : HOST_APP_PERSONALIZATION,
            "action" : FRAME_HAS_PERSONALIZATION,
            "data" : {
                "session" : session,
                "puplic_info" : g_current_pub_identity,     // make ccwid available to the private app...
                "personalization" : g_current_pub_identity ? g_current_pub_identity.preferences : false
            }
        }
        this.tell_requesting_page(msg,"hosted-app")
    }


}



