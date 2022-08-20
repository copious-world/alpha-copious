// HOSTED APP PAGE COM
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

let g_frame_page = window.parent

let hosted_page_application_handlers = (category,action,relationship,params) => {}



function reponding_alive() {
    let message = {
        "category": FRAME_COMPONENT_SAY_ALIVE,
        "action" : FRAME_COMPONENT_RESPONDING,
        "data" : false
    }
    tell_frame_page(message)
}


function install_frame_page_response() {
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
                if ( direction === FRAME_PAGE_TO_HOSTED_APP ) {
                    if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                        if ( action === FRAME_COMPONENT_RESPOND ) {
                            reponding_alive()
                        }
                    } else {
                        let params = mobj.data
                        hosted_page_application_handlers(category,action,relationship,params)
                    }
                }
            } catch (e) {
            }    
        }
    })
}


let injest_personalization = false
let injest_session = false
let application_specific_handlers = (category,action,relationship,params) => {}

let personalization = (post_params) => {}

hosted_page_application_handlers = async (category,action,relationship,params) => {
    switch ( category ) {
        case HOST_APP_PERSONALIZATION : {
            if ( typeof injest_personalization === "function" ) {
                await injest_personalization(action,params)
            }
            break;
        }
        case FRAME_TO_HOSTED_APP_SESSIONS : {          /// a hosted page that does not start a session.
            if ( typeof injest_session === "function" ) {
                await injest_session(action,params)
            }
            break;
        }
        default: {                  /// any other actions ... could be a login page that fetches a session
            await application_specific_handlers(category,action,relationship,params)
            break;
        }
    }
}


function tell_frame_page(message) {
    if ( !g_frame_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = HOSTED_APP_TO_FRAME
    msg.relationship = APP_RELATES_TO_FRAME
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_frame_page.postMessage(message_str,'*')
    return true
}

function relay_to_pages(message) {
    if ( !g_frame_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = HOSTED_APP_TO_ALL
    msg.relationship = APP_RELATES_TO_ALL
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_frame_page.postMessage(message_str,'*')
}
