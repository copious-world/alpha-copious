

// FUNTIONS REQUIRED :: dependency
/*
    derived_decipher_message_jwk  -- crypto wraps

*/



/**
 * 
 */
class FramePagePublisherResponse extends PageResponse {

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
            await this.human_frame_publisher_page_use_cases(relationship,action,params)
        } catch (e) {
        }
    }

    /**
     * 
     * @param {string} op 
     */
    publisher_performed_operation(op) {
        let message = {
            "category": FRAME_TO_APP_PUBLIC_COMPONENT,
            "action" : FRAME_RAN_PUB_OP,
            "data" : {
                "op" : op   // if used
            }
        }
        this.tell_requesting_page(message,"publisher")
    }


    async human_frame_publisher_page_use_cases(relationship,action,params) {
        switch ( action ) {
            case FRAME_CHECK_SESSION: {
                if ( this._g.current_session ) {
                    let message = {
                        "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                        "action" : FRAME_RETURNS_SESSION_CHECK,
                        "data" : {
                            "active" : true                    // if we got here, the site page has the ccwid
                        }
                    }
                    this.tell_requesting_page(message,"publisher")
                } else {
                    let message = {
                        "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                        "action" : FRAME_RETURNS_SESSION_CHECK,
                        "data" : {
                            "active" : false                    // if we got here, the site page has the ccwid
                        }
                    }
                    this.tell_requesting_page(message,"publisher")
                }
                break;
            }
            // UPLOAD ---->
            case HOST_UP_REQ_UPLOAD : {
                let session = this._g.current_session
                let user_info = await this._g.get_current_user()
                if ( session && user_info ) {   // data === {  "link", "hash", "postable" }

                    // postable === { "topic", "path", ... } //  "meta" : good_data, "protocol" : - , "preamble_size" : -
                    let link = params.link
                    //
                    let postable = params.postable
                    postable.ucwid = user_info.public_component.ccwid
                    postable.session = session
                    postable.hash = params.hash
                    //
                    // KEYS -- will derive a key to encrypt something to sign and verify
                    //
                    postable.public_signer = this._g.current_pub_identity.signer_public_key
                    postable.axiom_public_key = this._g.current_pub_identity.axiom_public_key  // derivation key public
                    //  -- SEND
                    let response = await postData(link,postable)   // POST DATA ... 
                    if ( (response.OK == "true") && (response.elements !== undefined) && response.elements.signage ) {
                        //  HANDLE GOOD RESPONSE
                        let remote_dat = response.elements   // work with the elements sent by backend via publisher manager
                        let obfuscated = remote_dat.ctext
                        let iv = remote_dat.iv_nonce;
                        let remote_public = remote_dat.host_public_derivation
                        let priv_key = user_info.private.axiom_priv_key       // derivation key private
                        let clear = await derived_decipher_message_jwk(obfuscated,remote_public,priv_key,iv)
                        let signkey = user_info.private.signer_priv_key
                        let sign = await key_signer(clear,signkey) 
                        delete remote_dat.ctext
                        remote_dat.sign = sign
                        response.ucwid = postable.ucwid
                        let message = {
                            "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                            "action" : FRAME_POSTED_PRIMARY,
                            "data" : {
                                "response" : response
                            }
                        }
                        this.tell_requesting_page(message,"publisher")
                    } else {
                        // failed response (e.g. no session established)
                        let message = {
                            "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                            "action" : FRAME_POSTED_PRIMARY,
                            "data" : {
                                "response" : response
                            }
                        }
                        this.tell_requesting_page(message,"publisher")
                    }
                }
                break;
            }
            // LOCAL FILE OPERATIONS
            case HOSTED_APP_FILE_OPERATION: {
                let session = this._g.current_session
                let user_info = await this._g.get_current_user()
                if ( session && user_info ) {
                    let file_cmd = params
                    let file_obj = params.file
                    switch ( file_cmd.op ) {
                        case "store" : {
                            await this._g.human_user_storage.add_file(file_obj.name,file_obj.description,undefined,undefined,file_obj)
                            this.publisher_performed_operation(file_cmd.op)
                            break;
                        }
                        case "update" : {  // overwrites
                            await this._g.human_user_storage.add_file(file_obj.name,file_obj.description,undefined,undefined,file_obj)
                            this.publisher_performed_operation(file_cmd.op)
                            break;
                        }
                        case "remove" : {
                            await this._g.human_user_storage.remove_file(file_obj.name)
                            this.publisher_performed_operation(file_cmd.op)
                            break;
                        }
                        case "list" : {
                            let file_names = await this._g.human_user_storage.get_file_names()
                            let message = {
                                "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                                "action" : FRAME_LIST_DATA,
                                "data" : {
                                    "file_names" : file_names
                                }
                            }
                            this.tell_requesting_page(message,"publisher")
                            break;
                        }
                        case "file-meta" : {
                            let file_meta = await this._g.human_user_storage.get_file_details(file_obj.name)
                            let message = {
                                "category": FRAME_TO_APP_PUBLIC_COMPONENT,
                                "action" : FRAME_RETURNS_DATA,
                                "data" : file_meta
                            }
                            this.tell_requesting_page(message,"publisher")
                            break;
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



