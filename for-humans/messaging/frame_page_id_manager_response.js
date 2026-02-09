

// FUNTIONS REQUIRED :: dependency
/*
    derived_decipher_message_jwk  -- crypto wraps
    identity_from_user -- 
    unstore_user -- use_db
*/



/**
 * 
 */
class FramePageIDManagerResponse extends PageResponse {

    //
    constructor(conf) {
        super(conf)

        this._download_link = ""
        this._production_app_location  = "https://www.of-this.world"
    }
    //


    set_download_link(a_link) {
        this._download_link = a_link
    }

    set_production_application_location(locstr) {
        this._production_app_location  = locstr
    }
    
    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     * @param {object} mobj -- The original event.data object, which is sometimed edited and sent back or forwarded
     */
    async message_handlers(category,action,relationship,params,mobj) {
        switch ( category ) {
            case FRAME_COMPONENT_MANAGE_ID : {
                if ( action === FRAME_ACTION_DOWNLOAD ) {
                    let user_info = await this._g.get_current_user()
                    if ( user_info ) {
                        await this.download_identity(user_info,false,false)
                    }
                } else if ( action === FRAME_ACTION_DOWNLOAD_PUBLIC  ) {
                    let user_info = await this._g.get_current_user()
                    if ( user_info ) {
                        await this.download_public_intro(user_info,false,false)
                    }
                } else if ( action === FRAME_ACTION_REMOVE ) {
                    let user_info = await this._g.get_current_user()
                    if ( user_info ) {
                        let remove = true
                        await this.download_identity(user_info,remove,false)
                        window.location.assign(this._production_app_location)
                    }
                } else if ( action === FRAME_ACTION_UPLOAD ) {  // called when uploading an identity
                    let user_data = await this.upload_identity()
                    if ( user_data ) {
                        await this._g.human_frame_application_id_installation(user_data)
                        //info_to_manager_container()
                    }
                }
                break;
            } 
            case FRAME_MANAGE_PICTURE_ASSET: {
                if ( action === FRAME_ACTION_ATTACH ) {
                    let image_url = mobj.image_url
                    await this.add_user_public_field("profile_image",image_url)
                    this._g.info_to_manager_container()
                }
                break;
            }
            default: {
                break;
            }
        }
    }


    /**
     * 
     * @param {object} user_info 
     * @param {boolean} remove 
     * @param {boolean} translate_identity 
     * @returns {boolean}
     */
    async download_identity(user_info,remove,translate_identity) {
        //
        let downloadlink = document.getElementById(this._download_link)
        if ( !(downloadlink) ) return false
        try {
            //
            let identity = translate_identity ? await identity_from_user(user_info) : user_info
            let download_str = JSON.stringify(identity,null,4)

            let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(download_str);

            let ext = ".json"
            let fname = identity.name_key
            if ( fname === undefined ) {
                fname = window.location.hostname
            }
            if ( fname === undefined ) {
                fname = "of-this-world-id"
            }

            downloadlink.setAttribute("href",     dataStr     );
            downloadlink.setAttribute("download", (fname + ext) );
            downloadlink.click();
            //
            if ( remove ) {
                let check = confirm("The next step will actually remove the record from local storage: continue?")
                if ( check ) {
                    await unstore_user(identity)
                }
            }
            //
        } catch (e) {}

        return true
    }



    async download_public_intro(user_info,remove,translate_identity) {
        //
        let downloadlink = document.getElementById(this._download_link)
        if ( !(downloadlink) ) return false
        try {
            //
            let identity = translate_identity ? await identity_from_user(user_info) : user_info
            //
            //  Get the public part
            let data = JSON.parse(identity.data["user-meta"])
            //
            let pub = data.public_component
            let output = {}
            for ( let ky in pub ) {
                if ( ky.indexOf('key') > 0 ) continue;      // for this token like object, don't carry keys. This will yield the url and ucwid
                output[ky] = pub[ky]
            }
            //
            let download_str = JSON.stringify(output,null,4)
            //
            let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(download_str);

            let ext = ".json"
            let fname = identity.name_key
            if ( fname === undefined ) {
                fname = window.location.hostname
            }
            if ( fname === undefined ) {
                fname = "of-this-world-id"
            }

            downloadlink.setAttribute("href",     dataStr     );
            downloadlink.setAttribute("download", (fname + ext) );
            downloadlink.click();
            //
            if ( remove ) {
                let check = confirm("The next step will actually remove the record from local storage: continue?")
                if ( check ) {
                    await unstore_user(identity)
                }
            }
            //
        } catch (e) {}
    }


    //$>>	upload_identity
    async upload_identity() {
        let identity_str = await this._g.get_file()
        let identity = JSON.parse(identity_str)
        let core_data = JSON.parse(identity.data["user-meta"])
        await restore_identity(core_data)
        return core_data
    }


    /**
     * 
     * @param {string} field_name 
     * @param {string} value 
     */
    async add_user_public_field(field_name,value) {
        let user_data = await this._g.exists_galactic_identity()
        if ( user_data ) {
            user_data[field_name] = value
            await this._g.human_frame_application_id_installation(user_data)
        }
    }

}

