
// ---- ---- ---- ---- ---- ---- ----

// This is to be part of an application file...

// ---- ---- ---- ---- ---- ---- ----


// FUNTIONS REQUIRED :: dependency
/*
    get_complete_user_identity  -- use db
    store_user
    check_frame_status
    make_host_request
*/

const APLLICATION_HUMAN_PAGE_SERVER = "{{human_url}}" // 'https://{{namer}}.of-this.world'
const DEFAULT_APP_CONTAINER_FRAME_ID = 'content-frame'
const DEFAULT_APP_UPLOADER_FRAME_ID = 'humans-uploader-frame'



class HumanAppPageGlobals {

    constructor() {
        //
        this.supported_workers = false
        this.current_session = false

        this.contacts = {}

        this.site_page = false
        this.hosted_app_page = false      // child iframe
        this.id_builder_page = false
        this.publisher_page = false

        this.frame_page_service_worker = false
        this.frame_broadcast_channel = false

        this.app_worker = false
        // // // 

        this.this_page_instance_is_session_owner = false

        this.window_in_frame = false

        this.human_user_storage = false
        this.human_user_storage_ref = [false]

        this.human_user_transaction_lostorage = false
        this.human_user_transaction_lostorage_ref = [false]

        this.human_user_signer_storage = false
        this.human_user_signer_storage_ref = [false]

        this.user_current_session = false
        this.current_user_id = false
        this.current_user_name = false
        this.current_pub_identity = false

        this.hash_session_map = {}
        this.my_current_session = false

        this.captured_domain = false
        this.captured_app_domain = false

        this.app_message_queue = []
        this.publisher_message_queue = []
        this.identity_installed = false
        //


        this._site_responder = false


        this.tout_count = 0
        this.wout_count = 0 
        this.uout_count = 0 


        this.initialize_frame_status()

    }



    async get_file() {
        return await get_file_from_file_element(`drop-click-file_loader`)
    }


    async load_blob_as_url() {
        return await get_blob_file_from_file_element(`drop-click-file_loader`)
    }

    capture_app(source) {
        this.captured_app_domain = source
    }



    // Carefull not to overwrite a complete user ID
    /**
     * 
     * @param {object} u_info 
     * @param {boolean} check -- (optional)
\     */
    async human_frame_application_id_installation(u_info,check = false){
        //
        try {
            if ( this.human_user_storage == false ) {
            }
            if ( check ) {
                let identity = await get_complete_user_identity("{{who_am_I}}")
                if ( identity !== false ) {
                    if ( identity.private && identity.private.axiom_priv_key) {
                        await this.update_UI_user_data_present()
                        return
                    }
                }
            }
            await store_user(u_info)     // the id_packet has the update in it
            await this.update_UI_user_data_present()
        } catch (e) {
        }
        //
    }



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- request_human_page_update


/*
	let postable = {
		"post_url" : `/intake-update`,
		"ccwids" : {
			"replace" : temporary_ccwid,
			"new" : new_ccwid
		},
		"user_info" : {
			"public_component" : { "ccwid" : new_ccwid }
		}
	}

	//
	let fields = [ "name_as_uri" ]
*/


    // called by the window app component of the builder app (see template/scripts)
    async request_human_page_update(temporary_ccwid,new_ccwid,name_as_uri,user_info) {
        if ( name_as_uri ) {
            if ( name_as_uri.length ) {
                let postable = {
                    "ccwids" : {
                        "replace" : temporary_ccwid,
                        "new" : new_ccwid,
                    },
                    "name_as_uri" : name_as_uri,
                    "user_info" : user_info
                }
                //
                let srver = APLLICATION_HUMAN_PAGE_SERVER
                let data_stem = "intake-update"
                //
                try {
                    let response = await postDataWithRefer(`${srver}/${data_stem}/`,postable)
                    if ( response.status === "OK" ) {
                        return true
                    }    
                } catch(e) {}

            } else {
                messages("please enter a value")
            }
        }
        return false
    }



    /**
     * 
     */
    async update_UI_user_data_present() {
        let identity = await get_complete_user_identity("{{who_am_I}}")
        if ( identity !== false ) {
            if ( identity.private && identity.private.axiom_priv_key) {
                //
                this.identity_installed = true

                let goner = document.getElementById("signer-upper-controller")
                let keeper = document.getElementById("dashboard-frame")

                goner.style.display = "none"
                keeper.style.visibility = "visible"
                //
            } else {
                let next_steps = document.getElementById("waiting-for-key-state")
                next_steps.innerText = "complete this step to activate your application"
            }
        } else {
            if ( this.window_in_frame ) {
                this.request_user_identity()
            }
        }
        
        if ( this.identity_installed ) {
            show_application()
        } else {
            show_local_data()
        }

        await this.finalize_info_to_containers()
    }



    request_user_identity() {
        let msg = {
            "category" : HOST_APP_PERSONALIZATION,
            "action" : ID_MANAGER_ACTION_TO_FRAME
        }
        tell_site_page(msg)
    }


    async get_current_user() {
        let userObj = await this.human_user_storage.get_user("{{who_am_I}}")
        if ( userObj && (userObj.public_component === undefined) ) {
            try {
                let real_data = JSON.parse(userObj.data["user-meta"])
                let pdata = real_data.public_component
                userObj.public_component = pdata
                userObj.private = real_data.private
            } catch (e) {
                userObj.public_component = {}
            }
        }
        return userObj
    }



    async finalize_info_to_containers() {
        //
        await this.info_to_manager_container()
        await this.info_to_wallet_container()
        await this.info_to_uploader_container()
        //
    }


    //
    set_current_galactic_user(public_id) {
        this.current_user_id = public_id.ccwid
        this.current_user_name = public_id.name
        this.current_pub_identity = public_id
    }


    async exists_galactic_identity() {
        if ( (typeof this.human_user_storage === "undefined") || !this.human_user_storage ) { return false }
        if ( this.current_pub_identity !== false ) {
            return this.current_pub_identity
        }
        let users = await this.human_user_storage.get_known_users()
        if ( Array.isArray(users) ) {
            for ( let u of users ) {
                let u_obj = u[0]
                if ( u_obj !== undefined ) {  // and is this the current user??
                    let name_key = u_obj.name
                    let public_id = await this.human_user_storage.get_user(name_key)
                    if ( public_id ) {
                        if ( (typeof public_id.data === "object") && (typeof public_id.data["user-meta"] === "string")) {
                            public_id = JSON.parse(public_id.data["user-meta"])
                            if ( public_id.public_component ) {
                                public_id = public_id.public_component
                            }
                        }
                        this.set_current_galactic_user(public_id)
                        return this.current_pub_identity
                    }
                }
            }
        }
        return false
    }


    /**
     * 
     * @param {object} public_info 
     * @returns {object}
     */
    async registration(public_info) {
        if ( this.captured_domain ) {
            let url = g_captured_domain.replace("@","captcha/users/register")
            let data = {
                "action" : "register",
                "name" : public_info.name,
                "ucwid" : public_info.ccwid,
                "public_derivation" : public_info.axiom_public_key,
                "signer_public_key" : public_info.signer_public_key
            }
            return await make_host_request(url,data)
        }
    }


    /**
     * this is the ID manager of a person...
     */
    async info_to_manager_container() {
        if ( !this.human_user_storage ) {
            this.tout_count++
            if ( this.tout_count > 10 ) return
            setTimeout(this.info_to_manager_container,500)
            return
        }
        let gid = await this.exists_galactic_identity()
        let framel = document.getElementById("id-manager-frame")
        if ( framel && gid ) {
            let jmsg = JSON.stringify(gid)
            framel.contentWindow.postMessage(jmsg, '*');
        }
    }


    /**
     * Loads a user's prefered wallet manager
     */
    async info_to_wallet_container() {
        if ( !g_human_user_storage ) {
            this.wout_count++
            if ( this.wout_count > 10 ) return
            setTimeout(this.info_to_wallet_container,500)
            return
        }
        let gid = await this.exists_galactic_identity()
        let framel = document.getElementById("id-wallet-frame")
        if ( framel && gid ) {
            let jmsg = JSON.stringify(gid)
            framel.contentWindow.postMessage(jmsg, '*');
        }
    }


    /**
     * Each user can pick an uploader application to make arrangements with the 
     * site being used. Public information about the user can be provided to the 
     * uploader for working within sessions.
     */
    async info_to_uploader_container() {
        //
        if ( !this.human_user_storage ) {
            this.uout_count++
            if ( this.uout_count > 10 ) return
            setTimeout(this.info_to_uploader_container,500)
            return
        }
        let gid = await this.exists_galactic_identity()
        let framel = document.getElementById(DEFAULT_APP_UPLOADER_FRAME_ID)
        if ( framel && gid ) {
            let jmsg = JSON.stringify(gid.public_component)
            framel.contentWindow.postMessage(jmsg, '*');
        }
        //
    }


    // initialize the frame status
    initialize_frame_status() {
        let fstats = check_frame_status()
        this.window_in_frame = fstats.in_frame
        if ( this.window_in_frame ) {
            this.site_page = fstats.from_site
        }
    }



    async do_update_on_server(bio_data) {
        let identity = await get_complete_user_identity("{{who_am_I}}")
        if ( identity !== false ) {
            let temporary_ccwid = identity.public_component.ccwid
            if ( identity.private === undefined ) {
                identity.private = {"biometric" : false }
            }
            identity.private.biometric = bio_data
            try {
                let id_packet = await user_keys(identity)   // keys as in EC/RSA - updates the ccwid to an intergalactic identity
                let new_ccwid = id_packet.public_component.ccwid
                let uri_name = id_packet.public_component.name_as_uri
                let user_info = Object.assign({},id_packet)
                delete user_info.private        // complete the storage of the identity
                let status = await this.request_human_page_update(temporary_ccwid,new_ccwid,uri_name,user_info) 
                if ( status ) {
                    return id_packet
                }
            } catch (e) {
                // 
            }
        }
        return false
    }



    set_site_responder(srep) {
        this._site_responder = srep
    }


    async startup() {
        //
        await db_startup()
        //
        if ( this.window_in_frame ) {
            //
            let identity = await get_complete_user_identity("{{who_am_I}}")
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
                "app_ready" : false,
                "public_component" : (has_identity ? identity.public_component : undefined)
            }
            this._site_responder.human_frame_singaling_alive(identity_state_data)
            if ( complete_identity !== false ) {
                await this.update_UI_user_data_present()
            }
            return
        }
        await this.update_UI_user_data_present()
        //
    }


}



let G_human_page_app_globals = new HumanAppPageGlobals()

// ---- ---- ---- ---- ---- ---- ----

//
// FRAME PAGE SITE RESPONSE  -- handle messages from the site --
// either as a child window or as a page within an iframe
// 

let frame_page_site_responder = new FramePageSiteResponse({
    "direction" : SITE_PAGE_TO_FRAME,
    "category" : false,
    "relationship" : SITE_RELATES_TO_FRAME,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING,
    "app_container"  :  'content-frame',
    "upload_container" : 'humans-uploader-frame'
})

frame_page_site_responder.set_globals(G_human_page_app_globals)
frame_page_site_responder.set_template_subst_id("{{who_am_I}}")
//
frame_page_site_responder.add_accepted_receiver("hosted-app")
frame_page_site_responder.add_accepted_receiver("site-page")
frame_page_site_responder.add_accepted_receiver("service-worker")
frame_page_site_responder.add_accepted_receiver("publisher")
frame_page_site_responder.install_response()
//
G_human_page_app_globals.set_site_responder(frame_page_site_responder)
//

//
// FRAME PAGE APP RESPONSE  -- handle messages from the hosted application
// 
let frame_page_app_responder = new FramePageAppResponse({
    "direction" : HOSTED_APP_TO_FRAME,
    "category" : false,
    "relationship" : APP_RELATES_TO_FRAME,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})

frame_page_app_responder.set_globals(G_human_page_app_globals)

if ( window.g_known_worker !== undefined ) {
    frame_page_app_responder.add_receiver(g_known_worker,"app_worker")  // one worker for general cases
}
//
frame_page_app_responder.add_accepted_receiver("hosted-app")
frame_page_app_responder.add_accepted_receiver("site-page")
frame_page_app_responder.add_message_queue("hosted-app")
frame_page_app_responder.install_response()


//
// FRAME PAGE PUBLISHER RESPONSE  -- handle messages from the hosted publisher
// 
let frame_page_publisher_responder = new FramePagePublisherResponse({
    "direction" : HOSTED_PUBLISHER_TO_FRAME,
    "category" : FRAME_ACTION_FROM_PUBLISHER,
    "relationship" : PUBLISHER_RELATES_TO_FRAME,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})

frame_page_publisher_responder.set_globals(G_human_page_app_globals)
//
frame_page_publisher_responder.add_accepted_receiver("hosted-app")
frame_page_publisher_responder.add_accepted_receiver("site-page")
frame_page_publisher_responder.add_accepted_receiver("publisher")
frame_page_publisher_responder.add_message_queue("publisher")
frame_page_publisher_responder.install_response()


//
// FRAME PAGE ID MANAGER RESPONSE  -- handle messages from the hosted publisher
// 
let frame_page_id_manager_responder = new FramePageIDManagerResponse({
    "direction" : MANAGER_PAGE_TO_FRAME,
    "category" : false,
    "relationship" : ID_MANAGER_ACTION_TO_FRAME,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})

frame_page_id_manager_responder.set_globals(G_human_page_app_globals)
//
frame_page_id_manager_responder.set_download_link("identity-download-link")
frame_page_id_manager_responder.set_production_application_location("https://www.of-this.world")
//
frame_page_id_manager_responder.add_accepted_receiver("manager")
frame_page_id_manager_responder.install_response()

//

// FRAME PAGE ID BUILDER RESPONSE  -- handle messages from the hosted publisher
// 
let frame_page_id_builder_responder = new FramePageIDBuilderResponse({
    "direction" : BUILDER_PAGE_TO_FRAME,
    "category" : FRAME_COMPONENT_MANAGE_ID,
    "relationship" : BUILDER_ACTION_TO_FRAME,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})

frame_page_id_builder_responder.set_globals(G_human_page_app_globals)
//
frame_page_id_builder_responder.add_accepted_receiver("id-builder")
frame_page_id_builder_responder.install_response()









//


// FUNTIONS REQUIRED :: dependency
/*
    FramePageSiteResponse.human_frame_application_load_app_page
    FramePageSiteResponse.human_frame_application_load_uploader
*/

function surf_to_link(link_src) {
    if ( link_src ) {
        let link_el = document.getElementById(link_src)
        if ( link_el ) {
            let link = link_el.value
            if ( link && link.length ) {
                //console.log(link)
                let data = {
                    "revise_source" : link
                }
                frame_page_site_responder.human_frame_application_load_app_page(data)
                show_application()
            }
        }
    }
}



function surf_to_uploader(link_src) {
    if ( link_src ) {
        let link_el = document.getElementById(link_src)
        if ( link_el ) {
            let link = link_el.value
            if ( link && link.length ) {
                //console.log(link)
                let data = {
                    "publications" : link
                }
                frame_page_site_responder.human_frame_application_load_uploader(data)
                show_uploader()
            }
        }
    }
}