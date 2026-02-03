
/**
 * 
 */
class FramePageAppResponse extends PageResponse {

    //
    constructor(conf) {
        super(conf)

        this._hash_session_map = {}
        this._user_current_session = false


        this._supported_workers = {}
        this._app_worker = false
    }
    //

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
                case FRAME_ACTION_FROM_APP : {
                    this.human_frame_hosted_page_use_cases(action,params)
                    break;
                }
                case HOSTED_APP_WORKER_OPERATION : {
                    this.human_frame_hosted_app_to_shared_worker(action,params)
                    break;
                }
                default: {
                    break;
                }
            }
        } catch (e) {

        }
    }


    /**
     * Handle actions for messages with the category FRAME_ACTION_FROM_APP
     * 
     * FRAME_HAS_SESSION responds by passing on session information to the site page (provider)
     * This is must enough information to key a session and not more.
     * 
     * All other actions send reponses back to the requesting application.
     * 
     * @param {string} action 
     * @param {object} data 
     */
    async human_frame_hosted_page_use_cases(action,data) {
        //
        if ( action === FRAME_HAS_SESSION ) {       // pass on 
            let session = data.session
            let message = {
                "category": FRAME_HAS_SESSION,
                "action" : FRAME_START_SESSION,            
                "data" : session                    // if we got here, the site page has the ccwid
            }
            this._user_current_session = session // just in case
            this.tell_requesting_page(message,"site-page")
        } else if ( action === HOSTED_APP_WANTS_SESSION ) { 
            let host_name = data
            let hash = await do_hash(host_name)
            // make sure the session is in the map for later requests
            this._hash_session_map[hash] = this._user_current_session   // sending the key into the session map
            let message = {
                "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                "action" : FRAME_HAS_SESSION,            
                "data" : hash                    // if we got here, the site page has the ccwid
            }
            this.tell_requesting_page(message,"hosted-app")
        } else {
            let user_info = await get_current_user()
            if ( user_info ) {
                switch ( action ) {
                    case FRAME_START_SESSION: {
                        let message = false
                        let OK = await registration(user_info.public_component)
                        if ( OK ) {
                            let pub_info = user_info.public_component
                            message = {
                                "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                                "action" : FRAME_COMPONENT_RESPONDING,       // FRAME_COMPONENT_RESPONDING FRAME_HAS_PERSONALIZATION       
                                "data" : pub_info
                            }
                        } else {
                            message = {
                                "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                                "action" : FRAME_COMPONENT_RESPONDING,       // FRAME_COMPONENT_RESPONDING           
                                "data" : "fail"
                            }
                        }
                        this.tell_requesting_page(message,"hosted-app")
                        break
                    }
                    case FRAME_NEEDS_SIGNATURE : {
                        //
                        let obfuscated = data.ctext
                        let iv = data.iv_nonce;
                        let remote_public = data.host_public_derivation
                        let priv_key = user_info.private.axiom_priv_key
                        let clear = await derived_decipher_message_jwk(obfuscated,remote_public,priv_key,iv)
                        let signkey = user_info.private.signer_priv_key
                        let sign = await key_signer(clear,signkey) 
                        //
                        let message = {
                            "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                            "action" : FRAME_SIGNED,
                            "data" : {
                                "signed" : sign
                            }
                        }
                        this.tell_requesting_page(message,"hosted-app")
                        break
                    }
                    case FRAME_REQ_DATA: {
                        let sky = data.session_key
                        let endpoint = data.url
                        if ( sky ) {
                            //
                            let session = sky ? this._hash_session_map[sky] : "public"
                            if ( session === undefined ) session = sky
                            //
                            if ( session ) {   // data === { "hash", "postable" }
                                data.ucwid = user_info.public_component.ccwid
                                data.session = session
                                //
                                let response = await make_host_request(endpoint,data)
                                if ( response.OK == true ) {        // { 'type' : 'transition', 'OK' : 'true', 'transition' : transitionObj, 'elements' : send_elements }
                                    let message = {
                                        "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                                        "action" : FRAME_TO_HOSTED_APP_DATA,            
                                        "data" : response.elements                    // if we got here, the site page has the ccwid
                                    }
                                    this.tell_requesting_page(message,"hosted-app")
                                }
                            }
                        }
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
        }
    }



    /**
     * Actions are provided in the event that the application prefers to use one of a few
     * signature gateways provided by preset worker threads
     * 
     * @param {*} action 
     */
    async human_frame_hosted_app_to_shared_worker(action) {
        if ( action === HOSTED_APP_DATABASE_STORE ) {
            switch ( mobj.type ) { 
                case "info-ws" : {
                    // transaction log -- external transaction from contracts
                    await store_external_transaction(mobj)
                    return
                }
                case "keys-up" : {
                    await store_sessions_to_keys(mobj)
                    return
                }
            }
        } else if ( [HOSTED_APP_INIT_WORKER,HOSTED_APP_LOAD_WORKER].indexOf(action) >= 0 ) {
            let user_info = await get_current_user()
            if ( user_info ) {
                switch ( action ) {
                    case HOSTED_APP_INIT_WORKER: {
                        this.tell_requesting_page({
                                "category" : FRAME_TO_APP_PUBLIC_COMPONENT,
                                "action" : FRAME_HAS_PERSONALIZATION,
                                "data" : user_info.public_component
                            },"hosted-app")
                        break;
                    }
                    case HOSTED_APP_LOAD_WORKER: {
                        if ( mobj.type === "init" )  {
                            mobj.user_info = user_info  // the worker will be loaded from the human url
                            let wrkr_src = this._supported_workers[mobj.worker_type]
                            if ( wrkr_src ) {
                                try {
                                    g_app_worker = new Worker(wrkr_src)
                                    let message = {
                                        "type" : "init",
                                        "action" : action,
                                        "category" : category,
                                        "data" : mobj
                                    }
                                    this.tell_requesting_page(message,"app_worker")
                                } catch(e) {}
                            }
                        }
                        break;
                    }
                }
            }
        } else {
            if ( this._app_worker ) {
                let message = {
                    "type" : mobj.type,
                    "action" : action,
                    "category" : category,
                    "data" : mobj
                }
                this.tell_requesting_page(message,"app_worker")
            }
        }
    }

}

