// human_page_uploader.js


// FUNTIONS REQUIRED :: dependency
/*
    get_transition_endpoint -- auth_endpoints
    finalize_media_array_storage_deep_json -- upload_media
*/


const APLLICATION_HUMAN_PAGE_SERVER = 'https://of-this.world'



//
/**
 * 
 */
class UCWID_UIPageAPP extends HumanFrameHostedApp {

    constructor() {
        super()
        //
        this.site_page = false // HumanFrameHostedApp has the field frame_page, this has site_page, since it might not be embedded
        //
        this.ui_data = new DataFromUi()
        this.proxy = new Proxy(this)
        this.window_in_frame = false

        // initial validation application is coinstall_response()ntact
        this.CurContainer = null // will be initilialized within the finalizers
    }

    install_response() {
        super.install_response()
        this.window_in_frame = check_frame_status()
        //
        if ( this.window_in_frame ) {
            this.site_page = window.parent
            this.frame_page = this.site_page
        } else {
            this.site_page = window.parent
            this.frame_page = false
        }
        //
    }



    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} data 
     * @returns {boolean}
     */
    tell_site_page(category,action,data) {
        let message = { category, action, data }
        return this.tell_requesting_page(message,"site-page")
    }


    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     */
    async application_specific_handlers(category,action,relationship,params) {
    }



    add_site_page_opener_response() {}   /// might still need this


    async add_user_to_human_url(id_packet) {
        this.tell_frame_page(FRAME_COMPONENT_MANAGE_ID,FRAME_ACTION_INSTALL,id_packet)  // ask for the primary transition to be handled by the human frame...
    }


    // Give the site page what it needs to open the frame window.
    // The session will be negotiated by another page.
    //
    async add_site_public_user(publc_info) {
        let site_pub_info = Object.assign({},publc_info)
        //
        // delete information that should not be shared
        delete site_pub_info.public_key
        delete site_pub_info.signer_public_key
        delete site_pub_info.axiom_public_key
        //
        this.tell_site_page(FRAME_COMPONENT_MANAGE_ID,FRAME_ACTION_INJECT,site_pub_info)
    }

    /**
     * 
     * @param {object} id_packet 
     */
    load_human_url_with_identity(id_packet) {
        this.tell_site_page(FRAME_COMPONENT_MANAGE_ID,FRAME_ACTION_INSTALL,id_packet)
    }


    /**
     * 
     * @param {object} postable 
     * @returns {tripple}
     */
    async request_human_page(postable) {
        let human_name = postable.human_name
        if ( human_name && (typeof postable.public_component === "object") ) {
            if ( human_name.length ) {
                //
                let srver = APLLICATION_HUMAN_PAGE_SERVER
                // let prot = location.protocol
                // let sp = '//' // ${prot}${sp}
                let data_stem = "intake/"

                //srver = "http://localhost:6443"
                //
                try {
                    // postable -- includes a makeshift ccwid which will be used as a temporary ID.
                    let response = await postData(`${srver}/${data_stem}`,postable)
                    if ( response.status === "OK" ) {
                        let name_as_uri= response.name_as_uri
                        let human_frame_url = response.human_url
                        let [child,uri_of_launch] = await this.open_app_page_in_human_frame(human_frame_url,"manager")
                        return [child,uri_of_launch,name_as_uri]
                    }    
                } catch(e) {}

            } else {
                messages("please enter a value")
            }
        }
        return [false,false,false]
    }



}


// ---- ---- ---- ---- ---- ---- ----

let g_app_auth_endpoint = "publisher"

//
// FRAME PAGE SITE RESPONSE  -- handle messages from the site --
// either as a child window or as a page within an iframe
// 


let ucwuid_frame_responder = new UCWID_UIPageAPP({
    "direction" : BUILDER_PAGE_TO_FRAME,
    "category" : false,
    "relationship" : BUILDER_ACTION_TO_FRAME,
    "alive_category" : FRAME_COMPONENT_SAY_ALIVE,
    "alive_requires_response" : FRAME_COMPONENT_RESPOND,
    "signal_responding" : FRAME_COMPONENT_RESPONDING
})


ucwuid_frame_responder.set_globals(ucwuid_frame_responder)
ucwuid_frame_responder.add_receiver(ucwuid_frame_responder.site_page,"site-page",BUILDER_PAGE_TO_SITE,BUILDER_RELATES_TO_SITE)
//
ucwuid_frame_responder.add_promise_handler("session-req")
ucwuid_frame_responder.add_promise_handler("data-req")
ucwuid_frame_responder.install_response()
//
ucwuid_frame_responder.set_human_frame_responder(ucwuid_frame_responder)
//

