

// FUNTIONS REQUIRED :: dependency
/*
    get_complete_user_identity  -- use db
    store_user

*/



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
            if ( g_human_user_storage == false ) {
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
            await update_UI_user_data_present()
        } catch (e) {
        }
        //
    }



    async update_UI_user_data_present() {
        let identity = await get_complete_user_identity("{{who_am_I}}")
        if ( identity !== false ) {
            if ( identity.private && identity.private.axiom_priv_key) {
                //
                g_identity_installed = true

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
        
        if ( g_identity_installed ) {
            show_application()
        } else {
            show_local_data()
        }

        await finalize_info_to_containers()
    }



    request_user_identity() {
        let msg = {
            "category" : HOST_APP_PERSONALIZATION,
            "action" : ID_MANAGER_ACTION_TO_FRAME
        }
        tell_site_page(msg)
    }

}



let G_human_page_app_globals = new HumanAppPageGlobals()


// left as functions to make it easier to render html click handlers
//
// ---- show_local_data
function show_local_data(size,title) {
    hide_div("application_container",false,size)
    hide_div("manager_container",false,size)
    hide_div("wallet_container",false,size)
    if ( size != undefined ) {
        show_div("db_container",false,size)
    } else {
        show_div("db_container")
    }
    adjust_dashboard_frame_top(size,title)
}

function show_id_manager(size,title) {
    hide_div("application_container",false,size)
    hide_div("db_container",false,size)
    hide_div("wallet_container",false,size)
    if ( size != undefined ) {
        show_div("manager_container",false,size)
    } else {
        show_div("manager_container")
    }
    update_selected_frame_title(title)
}

function navigate_to_uploader() {
    show_id_manager()
    show_id_manager('sml','identity manager')
}

function show_wallet_manager(size,title) {
    hide_div("application_container",false,size)
    hide_div("db_container",false,size)   
    hide_div("manager_container",false,size)
    if ( size != undefined ) {
        show_div("wallet_container",false,size)
    } else {
        show_div("wallet_container")
    }
    update_selected_frame_title(title)
}

function show_application(size,title) {
    hide_div("manager_container",false,size)
    hide_div("db_container",false,size)
    hide_div("wallet_container",false,size)
    if ( size != undefined ) {
        show_div("application_container",false,size)
    } else {
        show_div("application_container")
    }
    update_selected_frame_title(title)
}

function show_uploader() {
    show_local_data()
}

// ---- ---- ---- ---- ---- ---- ----

// This is to be part of an application file...


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
frame_page_app_responder.install_response()

