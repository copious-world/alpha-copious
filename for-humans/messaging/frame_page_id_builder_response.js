

// FUNTIONS REQUIRED :: dependency
/*
    derived_decipher_message_jwk  -- crypto wraps

*/



/**
 * 
 */
class FramePageIDBuilderResponse extends PageResponse {
    //
    constructor(conf) {
        super(conf)
    }
    //

    /**
     * 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     * @param {object} mobj -- The original event.data object, which is sometimed edited and sent back or forwarded
     */
    async default_category_message_handlers(action,relationship,params,mobj) {
        try {       // relationship checked by super  // default category set
            if ( action === FRAME_ACTION_INSTALL ) {
                this._g.human_frame_application_id_installation(params)
            }
        } catch (e) {
        }
    }
}




