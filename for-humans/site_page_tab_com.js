// SITE PAGE COM
//

let g_frame_page = false
let g_id_builder_page = false
let g_frame_cors_uri = '*'
let g_id_builder_cors_uri = '*'

let g_builder_ready = false

let g_responder_tables = {
    "human_frame" : {
        "resolver" : false,
        "rejector" : false
    },
    "builder" : {
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


let human_frame_page_application_handlers = (category,action,data,relationship) => {}
let id_builder_page_application_handlers = (category,action,data,relationship) => {}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// MESSAGE HANDLERS


// FRAME PAGE
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
            if ( direction === FRAME_PAGE_TO_SITE ) {
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



// BUILDER  --- happens on load before ever opening the builder page in the event that it is 
function install_id_builder_page_response() {
    window.addEventListener("message", (event) => {
        let page_source = event.origin
        if ( page_source !== '*' ) {  // g_id_builder_cors_uri
            // let opener = event.source --- the site page is assumed to be the top level of the interactions
            try {
                let mobj = JSON.parse(event.data)
                let category = mobj.category
                let relationship = mobj.relationship
                let action = mobj.action
                let direction = mobj.direction
                //
                if ( direction === BUILDER_PAGE_TO_SITE ) {
                    if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                        if ( action === FRAME_COMPONENT_RESPONDING ) {
                            if ( typeof g_responder_tables.builder.resolver === "function" ) {
                                g_responder_tables.builder.resolver(relationship,action)
                            }
                        }
                    } else {
                        let data = mobj.data
                        id_builder_page_application_handlers(category,action,data,relationship)
                    }
                }
            } catch (e) {
            }    
        }
    })

}

async function galactic_id_maker_opener() {
    let [child,uri_of_launch] = await open_cors_window("{{intergalactic_id}}","IGID")
    if ( child ) {
        g_id_builder_page = child
        g_id_builder_cors_uri = uri_of_launch
        let message = {
            "category": FRAME_COMPONENT_SAY_ALIVE,
            "action" : FRAME_COMPONENT_RESPOND,
            "data" : false
        }
        let p =  alive_response("builder")
        tell_id_builder_page(message)
        try {
            g_builder_ready = await p
        } catch (e) {}
    }
    return [child,uri_of_launch]
}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// MESSAGE SENDERS


function tell_id_builder_page(message) {
    if ( !g_id_builder_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = SITE_PAGE_TO_BUILDER
    msg.relationship = SITE_RELATES_TO_BUILDER
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_id_builder_page.postMessage(message_str,g_id_builder_cors_uri)
    return true
}

function tell_frame_page(message) {
    if ( !g_frame_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = SITE_PAGE_TO_FRAME
    msg.relationship = SITE_RELATES_TO_FRAME
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_frame_page.postMessage(message_str,g_frame_cors_uri)
    return true
}


function relay_to_pages(message) {
    if ( !g_frame_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = SITE_PAGE_TO_ALL
    msg.relationship = SITE_RELATES_TO_ALL
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_frame_page.postMessage(message_str,'*')
}




install_frame_page_response()
install_id_builder_page_response()
