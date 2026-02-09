// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// OPENERS


let url_for_use = (base_url,frame_use) => {   // builder application determined...
    return `${base_url}/${frame_use}`
}



async function open_app_page_in_human_frame(human_frame_url,frame_use) {
    let [child,uri_of_launch] = (!check_frame_status()) ? 
                                    await open_cors_window(human_frame_url,("HUMAN-FRAME-" + frame_use))
                                    : [false,normalized_launch_url(human_frame_url)]
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
                let frame_user_url = url_for_use(human_frame_url,frame_use)
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


async function open_intergalactic_session_window(frame_use,human_info,session) {
    if ( human_info ) {
        g_current_pub_identity = human_info
        let human_frame_url = human_info.human_frame_url
        let [frame_window,uri_of_launch] = await open_app_page_in_human_frame(human_frame_url,frame_use)
        if ( frame_window && session ) {
            let message = {
                "category": SITE_TO_FRAME_SESSIONS,
                "action" : FRAME_HAS_SESSION,
                "data" : session
            }

            tell_frame_page(message)
        }
    }
}

