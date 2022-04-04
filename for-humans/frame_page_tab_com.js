// FRAME PAGE COM
//
if ( typeof g_message_template === undefined ) {
    window.g_message_template = g_message_template = {
        "category" : "",
        "direction" : "",
        "action" : "",
        "relationship" : ""
    }
}

// constants in shared constants
//

let g_site_page = false
let g_hosted_app_page = false       // child iframe
let g_frame_page_service_worker = false

//
const DEFAULT_APP_CONTAINER_FRAME_ID = 'content-frame'

// 
let human_frame_application_id_installation = (id_data) => {}
let human_frame_hosted_page_use_cases = (relationship,action,data) => {}
//
function human_frame_application_load_app_page(data) {
    let data = mobj.revise_source
    let frame = document.getElementById(DEFAULT_APP_CONTAINER_FRAME_ID)
    if ( frame ) {
        frame.src = source
    }   
}



/// ALIVE RESPONSES
function site_reponding_alive() {
    let message = {
        "category": FRAME_COMPONENT_SAY_ALIVE,
        "action" :FRAME_COMPONENT_RESPONDING,
        "data" : false
    }
    tell_site_page(message)
}

function app_reponding_alive() {
    let message = {
        "category": FRAME_COMPONENT_SAY_ALIVE,
        "action" :FRAME_COMPONENT_RESPONDING,
        "data" : false
    }
    tell_hosted_app_page(message)
}

function builder_reponding_alive() {
    let message = {
        "category": FRAME_COMPONENT_SAY_ALIVE,
        "action" :FRAME_COMPONENT_RESPONDING,
        "data" : false
    }
    tell_id_builder_page(message)
}



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// MESSAGE HANDLERS

function install_site_page_response() {
    window.addEventListener("message", (event) => {
        let page_source = event.origin
        if ( page_source !== '*' ) {
            // let opener = event.source --- the site page is assumed to be the top level of the interactions
            try {
                let mobj = JSON.parse(event.data)
                let category = mobj.category
                let relationship = mobj.relationship
                let action = mobj.action
                let direction = mobj.direction
                //
                if ( direction === SITE_PAGE_TO_FRAME ) {
                    if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                        if ( action === FRAME_COMPONENT_RESPOND ) {
                            site_reponding_alive()
                        }
                    } else if ( relationship === SITE_RELATES_TO_FRAME ) {
                        let data = mobj.data
                        switch ( category ) {
                            case FAME_ACTION_LOAD_APP : {
                                human_frame_application_load_app_page(data)
                                break;
                            }
                            default: {
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
            }    
        }
    })
}


function install_application_page_response() {
    window.addEventListener("message", (event) => {
        let page_source = event.origin
        if ( page_source !== '*' ) {
            // let opener = event.source --- the site page is assumed to be the top level of the interactions
            try {
                let mobj = JSON.parse(event.data)
                let category = mobj.category
                let relationship = mobj.relationship
                let action = mobj.action
                let direction = mobj.direction
                //
                if ( direction === HOSTED_APP_TO_FRAME ) {
                    g_hosted_app_page = event.source
                    if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                        if ( action === FRAME_COMPONENT_RESPOND ) {
                            app_reponding_alive()
                        }
                    } else if ( relationship === APP_RELATES_TO_FRAME ) {
                        let data = mobj.data
                        switch ( category ) {
                            case FRAME_ACTION_FROM_APP : {
                                human_frame_hosted_page_use_cases(relationship,action,data)
                                break;
                            }
                            default: {
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
            }    
        }
    })
}

//
function install_id_builder_page_response() {
    window.addEventListener("message", (event) => {
        let page_source = event.origin
        if ( page_source !== '*' ) {
            // let opener = event.source --- the site page is assumed to be the top level of the interactions
            try {
                let mobj = JSON.parse(event.data)
                let category = mobj.category
                let relationship = mobj.relationship
                let action = mobj.action
                let direction = mobj.direction
                //
                if ( direction === BUILDER_PAGE_TO_FRAME ) {
                    if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                        if ( action === FRAME_COMPONENT_RESPOND ) {
                            builder_reponding_alive()
                        }
                    } else if ( relationship === BUILDER_ACTION_TO_FRAME ) {
                        let data = mobj.data
                        switch ( category ) {
                            case FAME_ACTION_INSTALL : {
                                human_frame_application_id_installation(data)
                                break;
                            }
                            default: {
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
            }    
        }
    })
}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// OPENERS


function install_service_worker_response() {

}

//
function load_service_worker() {

}



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// MESSAGE SENDERS

function tell_site_page(message) {
    if ( !g_site_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = FRAME_PAGE_TO_SITE
    msg.relationship = FRAME_PAGE_RELATES_TO_SITE
    msg.action = message.action
    msg.category = message.category
    msg.data = message
    let message_str = JSON.stringify(msg)
    g_site_page.postMessage(message_str,'*')
    return true
}


function tell_hosted_app_page(message,relationship) {
    if ( !g_hosted_app_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = FRAME_PAGE_TO_HOSTED_APP
    msg.relationship = (relationship === undefined) ?  FRAME_ACTION_TO_APP : relationship
    msg.action = message.action
    msg.category = message.category
    msg.data = message
    let message_str = JSON.stringify(msg)
    g_hosted_app_page.postMessage(message_str,'*')
    return true
}


function ask_hosted_app_page_session(message) {
    tell_hosted_app_page(message,FRAME_REQUEST_SESSION)
    return true
}


function tell_service_worker(message) {
    if ( !g_frame_page_service_worker ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = FRAME_PAGE_TO_SERVICE_WORKER
    msg.relationship = FRAME_PAGE_RELATES_TO_SERVICE_WORKER
    msg.action = message.action
    msg.category = message.category
    msg.data = message
    let message_str = JSON.stringify(msg)
    g_frame_page_service_worker.postMessage(message_str,'*')
    return true

}

function relay_to_pages(message) {
    tell_site_page(message)
    tell_hosted_app_page(message)
    tell_service_worker(message)
}


function tell_id_builder_page(message) {
    if ( !g_id_builder_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = FRAME_PAGE_TO_BUILDER
    msg.relationship = FRAME_PAGE_RELATES_TO_BUILDER
    msg.action = message.action
    msg.category = message.category
    msg.data = message
    let message_str = JSON.stringify(msg)
    g_id_builder_page.postMessage(message_str,g_id_builder_cors_uri)
    return true
}



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

install_application_page_response()
install_id_builder_page_response()
