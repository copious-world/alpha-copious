// ID BUILDER PAGE COM
//
// constants in shared constants
//
let g_frame_page = false
let g_site_page = false



let g_responder_tables = {
    "human_frame" : {
        "resolver" : false,
        "rejector" : false
    }
}

function alive_response(source_name) {
    if ( g_responder_tables[source_name] !== undefined ) {
        let p = new Promise((resolve,reject) => {
            g_responder_tables[source_name].resolver = (relationship,action) => {
                g_responder_tables[source_name] = {
                    "resolver" : false,
                    "rejector" : false            
                }
                resolve(true)
            }
            g_responder_tables[source_name].rejector = (relationship,action) => {
                g_responder_tables[source_name] = {
                    "resolver" : false,
                    "rejector" : false            
                }
                reject(false)
            }
        })
        return p    
    }
    return false
}

//
let human_frame_page_application_handlers = (category,action,data,relationship) => {}
let builder_app_site_command = (category,action,data) => {}
//

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// MESSAGE HANDLERS


function install_site_page_response() {
    window.addEventListener("message", (event) => {
        let page_source = event.origin
        let expected_site = normalized_launch_url("{{intergalactic_id}}")  // from common
        if ( page_source !== expected_site ) {
            //
            // let opener = event.source --- the site page is assumed to be the top level of the interactions
            try {
                let mobj = JSON.parse(event.data)
                let category = mobj.category
                let relationship = mobj.relationship
                let action = mobj.action
                let direction = mobj.direction
                //
                if ( direction === SITE_PAGE_TO_BUILDER ) {
                    if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                        if ( action === FRAME_COMPONENT_RESPOND ) {
                            g_site_page = event.source
                            let message = {
                                "category": FRAME_COMPONENT_SAY_ALIVE,
                                "action" : FRAME_COMPONENT_RESPONDING,
                                "data" : false
                            }
                            tell_site_page(message)
                        }
                    } else if ( relationship === SITE_RELATES_TO_BUILDER ) {
                        let data = mobj.data
                        builder_app_site_command(category,action,data)
                    }
                }
            } catch (e) {
            }    
        }
    })
}

function install_frame_page_response() {
    window.addEventListener("message", (event) => {
        // let opener = event.source --- the site page is assumed to be the top level of the interactions
        try {
            let mobj = JSON.parse(event.data)
            let category = mobj.category
            let relationship = mobj.relationship
            let action = mobj.action
            let direction = mobj.direction
            //    
            if ( direction === FRAME_PAGE_TO_BUILDER ) {
                if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                    if ( action === FRAME_COMPONENT_RESPONDING ) {
                        if ( typeof g_responder_tables.human_frame.resolver === "function" ) {
                            g_responder_tables.human_frame.resolver(relationship,action)
                        }
                    }
                } else {
                    let data = mobj.data
                    human_frame_page_application_handlers(category,action,data,relationship)
                }
            }
        } catch (e) {
        }
    })
}



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// OPENERS

let url_for_use = (frame_use) => {   // builder application determined...
    return false
}

async function open_app_page_in_human_frame(human_frame_url,frame_use) {
    let [child,uri_of_launch] = await open_cors_window(human_frame_url,("HUMAN-FRAME-" + frame_use))
    if ( child ) {
        g_frame_page = child
        g_frame_cors_uri = uri_of_launch
        let message = {
            "category": FRAME_COMPONENT_SAY_ALIVE,
            "action" : FRAME_COMPONENT_RESPOND,
            "data" : false
        }
        let p = alive_response("human_frame")
        tell_frame_page(message)
        try {
            let ok = await p
            if ( ok ) {
                let frame_user_url = url_for_use(frame_use)
                if ( frame_user_url ) {
                    let app_message = {
                        "category": FRAME_ACTION_LOAD_APP,
                        "action" : FRAME_ACTION_LOAD_APP,
                        "data" : {
                            "revise_source" : frame_user_url,
                            "use" : frame_use
                        }
                    }
                    tell_frame_page(app_message)
                }
            }
        } catch (e) {}
    }
    return [child,uri_of_launch]
}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// MESSAGE SENDERS


function tell_site_page(message) {
    if ( !g_site_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = BUILDER_PAGE_TO_SITE
    msg.relationship = BUILDER_RELATES_TO_SITE
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_site_page.postMessage(message_str,'*')
    return true
}

function tell_frame_page(message) {
    if ( !g_frame_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = BUILDER_PAGE_TO_FRAME
    msg.relationship = BUILDER_ACTION_TO_FRAME
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_frame_page.postMessage(message_str,'*')
    return true
}



install_site_page_response()
install_frame_page_response()