// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// OPENERS

let url_for_use = (frame_use) => {   // default set later by app
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
        tell_frame_page(message)
        try {
            let ok = await alive_response("human_frame")
            if ( ok ) {
                let frame_user_url = url_for_use(frame_use)
                if ( frame_user_url ) {
                    let app_message = {
                        "category": FRAME_ACTION_LOAD_APP,
                        "action" : FAME_ACTION_LOAD_APP,
                        "data" : {
                            "revise_source" : frame_user_url,
                            "use" : frame_use
                        }
                    }
                    tell_frame_page(app_message)
                }
            }
        } catch (e) {
            return false
        }
    }
    return [child,uri_of_launch]
}
