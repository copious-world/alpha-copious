


// FUNTIONS REQUIRED :: dependency
/*
    check_frame_status
    registration
    get_complete_user_identity  -- use db

*/


/**
 * 
 */
class FrameBroadCastResponse extends PageResponse {

    //
    constructor(conf) {
        super(conf)
        this.template_subst_id = ""
        this._captured_domain = false  // it has to be captured first to be a string
        //
        this.page_instance_is_session_owner
    }
    //



    /**
     * 
     * @param {string} str 
     */
    set_template_subst_id(str) {
        this.template_subst_id = str
    }


    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     * @param {object} mobj 
     */
    default_category_message_handlers(category,action,relationship,params,mobj) {
        let session = params
        switch ( action ) {
            case FRAME_STOP_SESSION: {
                if (  this._g.current_session === session ) {
                    let msg = {
                        "category" : FRAME_TO_HOSTED_APP_SESSIONS,
                        "action" : FRAME_STOP_SESSION,
                        "data" : {
                            "session" : session,
                            "ccwid" : this._g.current_pub_identity ? this._g.current_pub_identity.ccwid : false
                        }
                    }
                    this.tell_requesting_page(msg,'hosted-app')
                    this._g.set_current_session(false)
                    if ( this.page_instance_is_session_owner ) {
                        msg.category = FRAME_TO_SITE_MANAGE_SESSION
                        this.tell_requesting_page(msg,'site-page')
                    }
                }
                break;
            }
            case FRAME_WANTS_SESSION: 
            default: {
                this._g.set_current_session(session)
                //
                let msg = {
                    "category" : FRAME_TO_HOSTED_APP_SESSIONS,
                    "action" : FRAME_START_SESSION,
                    "data" : {
                        "session" : session,
                        "ccwid" : this._g.current_pub_identity ? this._g.current_pub_identity.ccwid : false
                    }
                }
                this.tell_requesting_page(msg,'hosted-app')
                this.update_preferences_frame(session)
                break;
            }
        }
    }


    // PERSONALIZATION MESSAGES
    update_preferences_frame(session) {
        let msg = {
            "category" : HOST_APP_PERSONALIZATION,
            "action" : FRAME_HAS_PERSONALIZATION,
            "data" : {
                "session" : session,
                "puplic_info" : this._g.current_pub_identity,     // make ccwid available to the private app...
                "personalization" : this._g.current_pub_identity ? this._g.current_pub_identity.preferences : false
            }
        }
        this.tell_requesting_page(msg,"broadcaster")
    }


}



