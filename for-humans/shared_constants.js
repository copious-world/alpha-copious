
// SHARED CONSTANTS


// SITE PAGE
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
const FRAME_PAGE_TO_WORKER = "frame_page_to_w"
const FRAME_PAGE_RELATES_TO_SITE = "frame_page_injector"
const FRAME_PAGE_RELATES_TO_BUILDER = "frame_page_reponses"
const FRAME_PAGE_RELATES_TO_SERVICE_WORKER = "frame_page_shared_action"
const FRAME_ACTION_TO_APP = "frame_page_request_action"
const FRAME_REQUEST_SESSION = "frame_page_request_session"
const FRAME_ACTION_FROM_APP = "hosted_app_requests_action"
const FRAME_PAGE_TO_PUBLISHER = "frame_page_to_publisher"
const FRAME_PAGE_RELATES_TO_PUBLISHER= "frame_page_publications"
const FRAME_ACTION_FROM_PUBLISHER = "publisher_app_requests_action"


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

// HUMAN FRAME WORKER
const WORKER_TO_FRAME = "worker_to_frame"
const WORKER_RELATES_TO_FRAME = "worker_request_action"

// PUBLISHER PAGE
const HOSTED_PUBLISHER_TO_FRAME = "publisher_to_frame"
const PUBLISHER_RELATES_TO_FRAME = "publisher_ask_frame_op"

const NEW_USER_TO_FRAME = "new_user_to_frame"

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

//
// actions
const FRAME_COMPONENT_RESPOND = "respond"
const FRAME_COMPONENT_RESPONDING = "responding"
const FRAME_ACTION_LOAD_APP = "load-app"
const FRAME_ACTION_INSTALL = "install-id"
const FRAME_ACTION_INJECT = "inject"
const FRAME_START_SESSION = "start-session"
const FRAME_HAS_SESSION = "has-session"
const FRAME_CHECK_SESSION = "check-session"
const FRAME_NEEDS_SIGNATURE = "get-signature"
const FRAME_WANTS_SESSION = "get-session"
const FRAME_STOP_SESSION = "stop-session"
const FRAME_HAS_PERSONALIZATION = "has-personalization"
const SITE_WANTS_SIGNATURE = "send-sig-remote"
const HOST_UP_REQ_UPLOAD = "send-request-upload"
const FRAME_REQ_DATA = "send-request-respond"


const MANAGER_PAGE_TO_FRAME = "from-manager-to-frame"
const ID_MANAGER_ACTION_TO_FRAME = "id-presence-manager"
const FRAME_ACTION_REMOVE = "id-manager-remove-id"
const FRAME_ACTION_UPLOAD = "id-manager-upload-id"
const FRAME_ACTION_DOWNLOAD = "id-manager-download-id"
const FRAME_ACTION_DOWNLOAD_PUBLIC = "id-manager-download-public-intro"
const FRAME_MANAGE_PICTURE_ASSET = "manager-picture-asset"
const FRAME_ACTION_ATTACH = "manager-asset-attach"

const HOST_APP_WANTS_SESSION = "session-to-app"

// categories
const FRAME_COMPONENT_SAY_ALIVE = "q-alive"
const FRAME_COMPONENT_MANAGE_ID = "m-igid"
const HOST_APP_PERSONALIZATION = "personalization"
const FRAME_TO_APP_PUBLIC_COMPONENT = "process-public-info"
const SITE_TO_FRAME_SESSIONS = "transfer-session"
const FRAME_TO_SITE_MANAGE_SESSION = "site-manage-session"
const WORKER_TO_FRAME_SESSIONS = "w-transfer-session"
const FRAME_WORKER_TO_SESSIONS = "transfer-session"
const FRAME_TO_HOSTED_APP_SESSIONS = "transfer-session"
const FRAME_TO_APP_SIGNATURE = "signed-data"
const FRAME_SIGNED = "yep-signed"
const FRAME_POSTED_PRIMARY = "yep-primary-response"
const FRAME_RAN_PUB_OP = "yep-publication-operation"

const HOSTED_APP_FILE_OPERATION = "yep-file-creation-db"
const HOSTED_APP_WORKER_OPERATION = "yep-worker-op"
const HOSTED_APP_LOAD_WORKER = "yep-worker-select"
const HOSTED_APP_INIT_WORKER = "yep-worker-ready"

const HOSTED_APP_DATA_FLIGHT = "yep-worker-dat-fly"
const HOSTED_APP_DATABASE_STORE  = "yep-data-to-db"
const HOSTED_APP_PROPERTIES = "yep-data-properties"
const HOSTED_APP_DATA_VERIFY = "yep-data-verify"
const FRAME_TO_HOSTED_APP_DATA = "yep-data-from-db"
const FRAME_LIST_DATA = "frame-lists-data-part-ids"
const FRAME_RETURNS_DATA = "frame-provides-data-part"
const FRAME_RETURNS_SESSION_CHECK = "frame-provides-session-check"

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

let g_user_current_session = false
let g_current_user_id = false
let g_current_user_name = false
let g_current_pub_identity = false

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

var g_current_session = false


const g_message_template =  {
                                "category" : "",
                                "direction" : "",
                                "action" : "",
                                "relationship" : ""
                            }

/// END OF CONSTANTS  (ALPHA)

