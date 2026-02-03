// HOSTED APP PAGE COM

// constants in shared constants

let g_frame_page = window.parent

/**
 * 
 */
class HostedPageResponse extends PageResponse {
    //
    constructor(conf) {
        super(conf)

        this.injest_personalization = false
        this.injest_session = false
    }
    //

    async application_specific_handlers(category,action,relationship,params) {}
    personalization(post_params) {}

    /**
     *  override
     * @param {string} category 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     */
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
                await this.application_specific_handlers(category,action,relationship,params)
                break;
            }
        }
    }

}


let host_page_responder = new HostedPageResponse({
    "direction" : FRAME_PAGE_TO_HOSTED_APP,
    "category" : false,
    "relationship" : false,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})


host_page_responder.add_receiver(g_frame_page,"host_app_msg",HOSTED_APP_TO_FRAME,APP_RELATES_TO_FRAME)
host_page_responder.add_receiver(g_frame_page,"host_app_publish",HOSTED_APP_TO_ALL,APP_RELATES_TO_ALL)

host_page_responder.install_response()


// END OF HOSTED APP PAGE COM  (ALPHA)
