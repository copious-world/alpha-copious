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
let g_id_builder_page = false
let g_frame_page_service_worker = false
let g_frame_broadcast_channel = false

let g_this_page_instance_is_session_owner = false

//
const DEFAULT_APP_CONTAINER_FRAME_ID = 'content-frame'

// 
let human_frame_application_id_installation = (id_data) => {}
let human_frame_hosted_page_use_cases = (relationship,action,data) => {}


//
//  human_frame_application_load_app_page
//  -- Frame application loader -- loads the pages and then steps back
//  -- It is up to the loaded page to initialize communication...
//
let g_captured_domain = false

function if_logging_in_capture(source) {
    if ( source.indexOf("login")  > 0 ) {
        g_captured_domain = source.replace("login","$$$$")
    }
}

//
function human_frame_application_load_app_page(data) {
    let source = data.revise_source
    if ( source ) {
        let frame = document.getElementById(DEFAULT_APP_CONTAINER_FRAME_ID)
        if ( frame ) {
            frame.src = source
            if_logging_in_capture(source)
        }    
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


function worker_reponding_alive() {
    let message = {
        "category": FRAME_COMPONENT_SAY_ALIVE,
        "action" : FRAME_COMPONENT_RESPONDING,
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

var g_current_session = false

// PERSONALIZATION MESSAGES
function update_preferences_frame(session) {
    let msg = {
        "category" : HOST_APP_PERSONALIZATION,
        "action" : FRAME_HAS_PERSONALIZATION,
        "data" : {
            "session" : session,
            "personalization" : g_current_pub_identity ? g_current_pub_identity.preferences : false
        }
    }
    tell_hosted_app_page(msg)

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
                    g_site_page = event.source
                    if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                        if ( action === FRAME_COMPONENT_RESPOND ) {
                            site_reponding_alive()
                        }
                    } else if ( relationship === SITE_RELATES_TO_FRAME ) {
                        let data = mobj.data
                        switch ( category ) {
                            case FRAME_ACTION_LOAD_APP : {
                                human_frame_application_load_app_page(data)
                                break;
                            }
                            case SITE_TO_FRAME_SESSIONS: {
                                let session = data
                                g_current_session = session
                                g_this_page_instance_is_session_owner = true
                                //
                                let msg = {
                                    "category" : FRAME_TO_HOSTED_APP_SESSIONS,
                                    "action" : FRAME_START_SESSION,
                                    "data" : {
                                        "session" : session,
                                        "ccwid" : g_current_pub_identity ? g_current_pub_identity.ccwid : false
                                    }
                                }
                                // tell_hosted_app_page(msg)
                                tell_service_worker(msg)  // need to 
                                //
                                update_preferences_frame(session)
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
                    g_id_builder_page = event.source
                    if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                        if ( action === FRAME_COMPONENT_RESPOND ) {
                            builder_reponding_alive()
                        }
                    } else if ( relationship === BUILDER_ACTION_TO_FRAME ) {
                        let data = mobj.data
                        switch ( category ) {
                            case FRAME_COMPONENT_MANAGE_ID : {
                                if ( action === FRAME_ACTION_INSTALL ) {
                                    human_frame_application_id_installation(data)
                                }
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
    g_frame_page_service_worker.port.addEventListener("message", (event) => {
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
                if ( direction === WORKER_TO_FRAME ) {
                    if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                        if ( action === FRAME_COMPONENT_RESPOND ) {
                            worker_reponding_alive()
                        }
                    } else if ( relationship === WORKER_RELATES_TO_FRAME ) {
                        let data = mobj.data
                        switch ( category ) {
                            // ??
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


function install_broadcast_channel() {
    g_frame_broadcast_channel = new BroadcastChannel("human_frame_broadcast")
    //
    g_frame_broadcast_channel.onmessage = (event) => {
        try {
            let mobj = JSON.parse(event.data)
            let category = mobj.category
            let relationship = mobj.relationship
            let action = mobj.action
            let direction = mobj.direction
            //
            if ( direction === WORKER_TO_FRAME ) {
                g_site_page = event.source
                if ( relationship === WORKER_RELATES_TO_FRAME ) {
                    let data = mobj.data
                    switch ( category ) {
                        case WORKER_TO_FRAME_SESSIONS: {
                            let session = data
                            switch ( action ) {
                                case FRAME_STOP_SESSION: {
                                    if (  g_current_session === session ) {
                                        let msg = {
                                            "category" : FRAME_TO_HOSTED_APP_SESSIONS,
                                            "action" : FRAME_STOP_SESSION,
                                            "data" : {
                                                "session" : session,
                                                "ccwid" : g_current_pub_identity ? g_current_pub_identity.ccwid : false
                                            }
                                        }
                                        tell_hosted_app_page(msg)
                                        g_current_session = false
                                        if ( g_this_page_instance_is_session_owner ) {
                                            msg.category = FRAME_TO_SITE_MANAGE_SESSION
                                            tell_site_page(msg)
                                        }
                                    }
                                    break;
                                }
                                case FRAME_WANTS_SESSION: 
                                default: {
                                    g_current_session = session
                                    //
                                    let msg = {
                                        "category" : FRAME_TO_HOSTED_APP_SESSIONS,
                                        "action" : FRAME_START_SESSION,
                                        "data" : {
                                            "session" : session,
                                            "ccwid" : g_current_pub_identity ? g_current_pub_identity.ccwid : false
                                        }
                                    }
                                    tell_hosted_app_page(msg)
                                    update_preferences_frame(session)
                                    break;
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
        } catch (e) {
        }
    };
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// WORKER


//
function load_human_frame_worker() {
    g_frame_page_service_worker = new SharedWorker('./human_frame_worker.js');
    if ( g_frame_page_service_worker ) {
        try {
            g_frame_page_service_worker.port.start();
            install_service_worker_response()        
        } catch (e) {
            console.log(e)
        }
    }
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
    msg.data = message.data
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
    msg.data = message.data
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
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_frame_page_service_worker.port.postMessage(message_str,'*')
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
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_id_builder_page.postMessage(message_str,'*') //g_id_builder_cors_uri)
    return true
}



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

install_application_page_response()
install_id_builder_page_response()


//
// END OF FRAME PAGE TAB COM