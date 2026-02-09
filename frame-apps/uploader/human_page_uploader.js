
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
class UploaderPageGlobals extends HumanFrameHostedApp {

    constructor() {
        super()
        //
        this._uploader_path = "uploaders"  // see "publisher" below
        //
        this.ui_data = new DataFromUi()
        this.proxy = new Proxy(this)
    }



	set_global_user_id(ccwid) {
		if ( this.ui_data ) {
			this.ui_data.set_user_id(ccwid)
		}
	}


    /**
     * 
     * @param {string} endpoint -- ???
     * @returns 
     */
	get_secondary_transition_uploader_endpoint(endpoint) {
		let url = `${location.protocol}//${location.host}/${this._uploader_path}/secondary/transition/${endpoint}`
		return url
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
                case FRAME_POSTED_PRIMARY: {
                    let response = params.response
                    if ( response ) {
                        this.responder_tables["post-response"].resolver(response)
                    } else {
                        this.responder_tables["post-response"].rejector()
                    }
                    break
                }
                case FRAME_LIST_DATA: {
                    if ( params && params.file_names ) {
                        this.responder_tables["data-requests"].resolver(params.file_names)
                    } else {
                        this.responder_tables["data-requests"].rejector()
                    }
                    break
                }
                case FRAME_RAN_PUB_OP: {
                    if ( params.op ) {
                        this.responder_tables["data-requests"].resolver(params.op)
                    } else {
                        this.responder_tables["data-requests"].rejector()
                    }
                    break
                }
                case FRAME_RETURNS_DATA: {
                    if ( params ) {
                        this.responder_tables["data-requests"].resolver(params)
                    } else {
                        this.responder_tables["data-requests"].rejector()
                    }
                    break
                }
                case FRAME_RETURNS_SESSION_CHECK: {
                    if ( params.active ) {
                        this.responder_tables["session-check"].resolver(true)
                    } else {
                        this.responder_tables["session-check"].resolver(false)
                    }
                    break;
                }
            }
        }
    }

	//
	// ---- create_entry ---- ---- ---- ---- ---- ---- ----
    /**
     * 
     * field_data :: in the following, field_data is a map of fields ids to DOM element objects.
     * calculation on values will be handled by gather_fields
     * values will be read in from those fields
     * 
     * FILES: two fields will refer to the DOM element for file uploaders. 
     *  -- rec-file-name	--- likely a media file e.g. mp3, mov, etc.
     *  -- rec-poster-name   --- likely an image file that will be displayed
     * 
     * @param {object} field_data 
     * @returns 
     */
    async create_entry(field_data) {
        if ( !this.proxy || !this.ui_data ) return
        if ( field_data ) {
			let good_data = await this.ui_data.gather_fields(field_data)  // puts the upload file into the structure
			if ( good_data ) {
				let t_num = await this.proxy.new_entry(good_data)
				return t_num /// for placement into display				
			}
			return false
        }
    }

	// ---- get_entry ---- ---- ----
    /**
     * 
     * @param {object} field_data 
     * @returns 
     */
	async get_entry(field_data) {
        if ( !this.proxy || !this.ui_data ) return
		let good_data = await this.ui_data.gather_identifying_fields(field_data)
		if ( good_data ) {
          let obj = await this.proxy.get_entry(good_data)
          let t_num = obj._tracking
          if ( t_num !== false ) {
			field_data["asset-id"] = t_num
          }
		  for ( let fld in field_data ) {
			let v = obj[fld]
			if ( v !== undefined ) {
				field_data[fld] = obj[fld]
			}
		  }
        }
    }
  
	// ---- update_entry ---- ---- ----
    /**
     * 
     * @param {object} field_data 
     * @returns 
     */
    async update_entry(field_data) {
        if ( !this.proxy || !this.ui_data ) return
        let good_data = await this.ui_data.gather_fields(field_data)
        if ( good_data ) {
          let t_num = await this.proxy.update_entry(good_data)
          if ( t_num !== false ) {
			field_data["asset-id"] = t_num
          }
        }
    }

	// ---- delete_entry ---- ---- ----
    /**
     * 
     * @param {object} field_data 
     * @returns 
     */
    async delete_entry(field_data)  {
        if ( !this.proxy || !this.ui_data ) return
        let good_data = await this.ui_data.gather_identifying_fields(field_data)
        if ( good_data ) {
          await this.proxy.delete_entry(good_data)
        }
    }

	// ---- publish_entry ---- ---- ----
    /**
     * 
     * @param {object} field_data 
     * @returns 
     */
    async publish_entry(field_data) {
        if ( !this.proxy || !this.ui_data ) return
        let good_data = await this.ui_data.gather_identifying_fields(field_data)
        if ( good_data ) {
          await this.proxy.publish_entry(good_data)
        }
    }

	// ---- unpublish_entry ---- ---- ----
    /**
     * 
     * @param {object} field_data 
     * @returns 
     */
    async unpublish_entry(field_data) {
        if ( !this.proxy || !this.ui_data ) return
        let good_data = await this.ui_data.gather_identifying_fields(field_data)
        if ( good_data ) {
          await this.proxy.unpublish_entry(good_data)
        }
    }



    /**
     * 
     * @param {string} command 
     * @param {object} object_data_meta 
     * @param {string} link_meta 
     * @returns 
     */
	async send_publication_command(command,object_data_meta,link_meta) {
		let data_hash = do_hash(object_data_meta)
		//
		let postable = Object.assign(object_data_meta,{
			"topic" : `command-${command}`,
			"path" : "upload-media",
			"file_name" : data_hash
		})
		//
        let data ={
            "link" : get_transition_endpoint(link_meta.link),
            "hash" : data_hash,
            "postable" : postable
        }
        //
		this.tell_frame_page(FRAME_ACTION_FROM_PUBLISHER, HOST_UP_REQ_UPLOAD, data)   // ask for the primary transition to be handled by the human frame...
		//
		let primary_response = await this.promise_handling("post-response")
		if ( primary_response.OK == "true" ) {
			return true
		}
		return false
		//
	}


    /**
     * 
     * @param {object} file_obj 
     * @param {string} operation 
     * @returns 
     */
	async app_run_file_op(file_obj,operation) {
        let data = {
            "op" : operation,
            "file" : file_obj
        }
		//
		this.tell_frame_page(FRAME_ACTION_FROM_PUBLISHER, HOSTED_APP_FILE_OPERATION, data)   // ask for the primary transition to be handled by the human frame...
		//
		try {
			let file_info = await this.promise_handling("data-requests")
			return file_info
		} catch (e) {
			console.log(e)
		}
		return false
	}


    /**
     * 
     * @returns {Array}
     */
	async get_all_user_files() {
        //
        let data = { "op" : "list" }
		//
		this.tell_frame_page(FRAME_ACTION_FROM_PUBLISHER, HOSTED_APP_FILE_OPERATION, data)   // ask for the primary transition to be handled by the human frame...

		try {
			let all_files = await this.promise_handling("data-requests")
			return all_files
		} catch (e) {
		}
		return []
	}

    /**
     * 
     * @param {string} name 
     * @returns 
     */
	async app_get_file(name) {
        //
        let data = {
				"op" : "file-meta",
				"file" : { "name" : name }
			}
		//
		this.tell_frame_page(FRAME_ACTION_FROM_PUBLISHER, HOSTED_APP_FILE_OPERATION,data)   // ask for the primary transition to be handled by the human frame...
		// 
		try {
			let file_info = await this.promise_handling("data-requests")
			return file_info
		} catch (e) {
		}
		return false
	}



    /**
     * 
     * @returns {boolean}
     */
	async app_check_session() {
		if ( this.frame_page ) {
			//
			this.tell_frame_page(FRAME_ACTION_FROM_PUBLISHER, FRAME_CHECK_SESSION, false)   // ask for the primary transition to be handled by the human frame...
			//
			try {
				let is_active = await this.promise_handling("session-check")
				return is_active
			} catch (e) {
			}
		}
		return false
	}



    /**
     * prep_send_new_entry
     * 
     * Begin uploading by getting permission from the human frame.
     * This begins a primary transitiobjecton on the server and yields a transition token 
     * to be used in a secondary transition called upon in `finalize_media_array_storage_deep_json`.
     * 
     */
    async prep_send_new_entry(data_hash,send_obj,link_meta) {
        // send the fields this knows about. Expect the human frame to handle a hash and security
        let postable = Object.assign(send_obj,{
            "topic" : "command-upload",
            "path" : "upload-media"			// dashboard is sending files... while others may send just JSON on the 'lite' path
        })
        //
        let data = {
            "link" : get_transition_endpoint(link_meta.link),
            "hash" : data_hash,
            "postable" : postable
        }

        this.tell_frame_page(FRAME_ACTION_FROM_PUBLISHER, HOST_UP_REQ_UPLOAD, data)   // ask for the primary transition to be handled by the human frame...
        //
        let primary_response = await this.promise_handling("post-response")
        return primary_response
    }


    /**
     * Note that the meta object contains description of the media under meta.media.source
     * and, that the media may be accompanied by a poster for applications hoping to display 
     * a static image/ 
     * 
     * @param {object} object_data_meta -- the meta descriptof of the file being sent (includes blob)
     * @param {object} link_meta - contains primary and secondary links to the API endpoints that will process the upload
     * @param {string} asset_type 
     * @returns {pair}
     */
    async send_new_entry(object_data_meta,link_meta,asset_type) {
        /*
        object_data_meta === { "meta" : good_data }  // search for>> "meta" : good_data
        */
        if ( object_data_meta?.meta.media && object_data_meta?.meta?.media.source ) {
            //  The blob has been stored as a URL (using web File operations)
            let blob_data = object_data_meta.meta.media.source.blob_url         // Data    
            let blob_data_size = object_data_meta.meta.media.source.size        // Data Sizes
            if ( object_data_meta.meta.media.poster ) {
                blob_data_size += object_data_meta.meta.media.poster.size
            }
            //
            // com object is sent to the upload service with information about
            // how it will be stored and the size requested.
            let com_obj = {
                protocol : 'p2p-default',       // uses the default storage scheme
                preamble_size : blob_data_size  // send total size
            }
            com_obj = Object.assign(object_data_meta,com_obj)
            //
            // +  obj.protocol,  + obj.preamble_size    // { "meta" : good_data, "protocol" : - ,  "preamble_size" : - }
            let data_hash = await do_hash(blob_data)  // the file data of the main type of media (e.g. movie, sound, which might also upload an image)
            //   post data in here  (prep --- don't send the actual file... )

            let backup_media = {
                "source" : com_obj.meta.media.source ? com_obj.meta.media.source : undefined,
                "poster" : com_obj.meta.media.poster ? com_obj.meta.media.poster : undefined
            }

            // make copies of the media components  -- it was passed by reference, and there may be changes before delivery
            com_obj.meta.media.source = Object.assign({},com_obj.meta.media.source)
            delete com_obj.meta.media.source.blob_url  // (prep --- don't send the actual file... )
            //
            if ( object_data_meta.meta.media.poster ) {
                com_obj.meta.media.poster = Object.assign({},com_obj.meta.media.poster)
                delete com_obj.meta.media.poster.blob_url   // (prep --- don't send the actual file... )
            }

            // TELL THE FRAME THAT YOU ARE ABOUT TO UPLOAD DATA (and need a ticket)
            // Frame will make arrangements with the server...
            let primary_response = await this.prep_send_new_entry(data_hash,com_obj,link_meta)
            //
            if ( primary_response.OK == "true" ) {  // SUCCESSFUL setup for the upload
                let upload_keys = primary_response.elements  // should be produced by publication handling
                let postable = Object.assign(com_obj,{
                    "token" : primary_response.token,		// primary action token (key to secondary)
                    "asset_type" : asset_type,
                    "sign" : upload_keys.sign,
                    "hash" : data_hash
                })
                // --- backup_media -- the blobs should be loaded (later -- maybe sliceable)
                let blob_list = []
                if ( backup_media.source ) blob_list.push(backup_media.source)
                if ( backup_media.poster ) blob_list.push(backup_media.poster)
                //
                let link = this.get_secondary_transition_uploader_endpoint(link_meta.secondary_link)
                //
                let token = primary_response.elements.token
                //  , primary_response -> original respone, false -> will make FromData, blob_data -> one file, 
                let media_store_characteristics = await finalize_media_array_storage_deep_json(link,token,primary_response,false,blob_list,postable)
                
                return media_store_characteristics
            }
        }

        return [false,false]
        //
    }

}


// ---- ---- ---- ---- ---- ---- ----

let g_app_auth_endpoint = "publisher"

//
// FRAME PAGE SITE RESPONSE  -- handle messages from the site --
// either as a child window or as a page within an iframe
// 

let uploader_frame_responder = new UploaderPageGlobals({
    "direction" : FRAME_PAGE_TO_PUBLISHER,
    "category" : false,
    "relationship" : FRAME_PAGE_RELATES_TO_PUBLISHER,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})


uploader_frame_responder.set_globals(uploader_frame_responder)
//
uploader_frame_responder.add_accepted_receiver("human-page")
uploader_frame_responder.add_promise_handler("data-requests")
uploader_frame_responder.add_promise_handler("post-response")
uploader_frame_responder.add_promise_handler("session-check")

uploader_frame_responder.install_response()
//
uploader_frame_responder.set_human_frame_responder(uploader_frame_responder)
//

window.onload = (ev) => {  // loaded after the frame page loads
	uploader_frame_responder.proxy.set_links({
			"new_entry" : {
				"link" : "publication-commands",
				"secondary_link" : "do_param_upload"
			},
			"update_entry" : {
				"link" : "publication-commands",
				"secondary_link" : "do_param_upload"
			},
			"get_entry" : false,
			"delete_entry" : {
				"link" : "publication-commands"
			},
			"publish_entry" : {
				"link" : "publication-commands"
			},
			"unpublish_entry" : {
				"link" : "publication-commands"
			},
			"get_user" : false
		}
	)
    //
    uploader_frame_responder.responding_alive()
}
