



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


let g_app_message_queue = []
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



let g_publisher_message_queue = []
function tell_publisher_page(message) {
    if ( !g_publisher_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = FRAME_PAGE_TO_PUBLISHER
    msg.relationship = FRAME_PAGE_RELATES_TO_PUBLISHER
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_publisher_page.postMessage(message_str,'*') //g_id_builder_cors_uri)
    return true
}


function tell_app_worker(message) {
    if ( !g_app_worker ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = FRAME_PAGE_TO_WORKER
    msg.relationship = FRAME_PAGE_RELATES_TO_WORKER
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_app_worker.postMessage(message_str,'*') //g_id_builder_cors_uri)
    return true
}


/**
 * tell_wallet_page
 */
function tell_wallet_page(message) {
    if ( !g_wallet_page ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = FRAME_PAGE_TO_WORKER
    msg.relationship = FRAME_PAGE_RELATES_TO_WORKER
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_wallet_page.postMessage(message_str,'*') //g_id_builder_cors_uri)
    return true
}
