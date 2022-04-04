
// SHARED CONSTANTS


// SITE PATE
//
const SITE_PAGE_TO_FRAME = "site_page_to_frame"
const SITE_PAGE_TO_BUILDER = "site_page_to_builder"
const SITE_PAGE_TO_ALL = "RELAY"
const SITE_RELATES_TO_BUILDER = "site_page_request_id"
const SITE_RELATES_TO_FRAME = "site_page_request_action"
const SITE_RELATES_TO_ALL = "site_frame_yields_news"

// FRAME PAGE
const FRAME_PAGE_TO_HOSTED_APP = "frame_page_to_hosted_app"
const FRAME_PAGE_TO_SITE = "frame_page_to_site"
const FRAME_PAGE_TO_BUILDER = "frame_page_to_builder"
const FRAME_PAGE_TO_SERVICE_WORKER = "frame_page_to_sw"
const FRAME_PAGE_RELATES_TO_SITE = "frame_page_injector"
const FRAME_PAGE_RELATES_TO_BUILDER = "frame_page_reponses"
const FRAME_PAGE_RELATES_TO_SERVICE_WORKER = "frame_page_shared_action"
const FRAME_ACTION_TO_APP = "frame_page_request_action"
const FRAME_REQUEST_SESSION = "frame_page_request_session"
const FRAME_ACTION_FROM_APP = "hosted_app_requests_action"

// APP PAGE
//
const HOSTED_APP_TO_FRAME = "hosted_app_to_frame"
const HOSTED_APP_TO_ALL = "RELAY"
const APP_RELATES_TO_FRAME = "app_in_human_context"
const APP_RELATES_TO_ALL = "app_in_frame_yields_news"

// BUILDER PAGE
//
const BUILDER_PAGE_TO_FRAME = "builder_page_to_frame"
const BUILDER_PAGE_TO_SITE = "builder_page_to_site"
const BUILDER_RELATES_TO_SITE = "builder_page_injector"
const BUILDER_ACTION_TO_FRAME = "builder_page_request_action"


// actions
const FRAME_COMPONENT_RESPOND = "respond"
const FRAME_COMPONENT_RESPONDING = "responding"
const FAME_ACTION_LOAD_APP = "load-app"
const FAME_ACTION_INSTALL = "install-id"
const FAME_ACTION_INJECT = "inject"
const FRAME_START_SESSION = "start-session"
const FRAME_HAS_SESSION = "has-session"

// categories
const FRAME_COMPONENT_SAY_ALIVE = "q-alive"
const FRAME_COMPONENT_MANAGE_ID = "m-igid"



let g_current_user_id = false
let g_current_user_name = false
let g_current_pub_identity = false


const g_message_template =  {
                                "category" : "",
                                "direction" : "",
                                "action" : "",
                                "relationship" : ""
                            }
