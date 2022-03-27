
   
if ( typeof messages === 'undefined' ) {
    messages = () => {}
}

// human_frame_page_opener
// open a human frame with an app in its frame
async function human_frame_page_opener(human_frame_url,frame_use) {
    let child = await open_cors_window(human_frame_url,("HUMAN-FRAME-" + frame_use))
    if ( child ) {
        g_galactic_maker_window = true
    }
    return child
}

var g_galactic_maker_window = false
async function galactic_id_maker_opener() {
    let child = await open_cors_window("{{intergalactic_id}}","IGID")
    if ( child ) {
        g_galactic_maker_window = true
    }
}
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- request_human_page
async function request_human_page(evt,human_name,public_identity) {
    if ( human_name ) {
        if ( human_name.length ) {
            let postable = {
                "human_name" : human_name,
                "public_identity" : public_identity
            }

            let srver = location.host
            let prot = location.protocol
            let sp = '//'
            let data_stem = "users"

            try {
                let response = await postData(`${prot}${sp}${srver}/${data_stem}`,postable)
                if ( response.status === "OK" ) {
                    let human_frame_url = response.human_url
                    await human_frame_page_opener(human_frame_url,"dash-board")
                }    
            } catch(e) {}

        } else {
            messages("please enter a value")
        }
    }
    return false
}


async function open_intergalactic_session_window(application,human_info,service_tandems) {
    let human_frame_url = human_info.url
    let child_tab = await human_frame_page_opener(human_frame_url,application)
    if ( child_tab ) {
        let display_page = service_url(application)
        if ( service_tandems === undefined ) {
            service_tandems = {}
        }
        human_app_window_initializer_message(child_tab,human_info,display_page,service_tandems)
    }
}

async function intergalactic_session_going() {
    try {
        let human_public_identity = await exists_galactic_identity()
        if ( human_public_identity.session === undefined ) {
            return false
        }
        return human_public_identity
    } catch (e) {
    }
    return false
}





window.addEventListener("message", async (ev) => {
    let mobj = ev.data
    if ( mobj && (mobj.category === "ucwid") ) {
        if ( mobj.direction === "from-ucwid-builder" ) {
            let ucwid = mobj.ucwid
            if ( mobj.action === "close" ) {
                ev.source.close();
            } else if ( mobj.action === "inject" ) {
                if ( mobj.public_id ) {
                    injest_identity_to_current_id(mobj.public_id)
                }
            }
        }
    } else if ( mobj && (mobj.category === "alive") ) {
        if ( mobj.direction === "from-ucwid-builder" ) {
            console.log("User interaction is ready")
        }
    }
});


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

let g_current_user_id = false
let g_current_user_name = false
let g_current_pub_identity = false

//
function set_current_galactic_identity(public_id) {
    g_current_user_id = public_id.ucwid
    g_current_user_name = public_id.name
    g_current_pub_identity = public_id
}


async function exists_galactic_identity() {
    if ( (typeof g_human_user_storage === "undefined") || !g_human_user_storage ) { return false }
    if ( g_current_pub_identity !== false ) {
        return g_current_pub_identity
    }
    let public_id = await g_human_user_storage.get_user(name_key)
    if ( public_id ) {
        set_current_galactic_identity(public_id)
        return g_current_pub_identity
    }
    return false
}

async function add_galactic_identity(public_identity) {
    if ( (typeof g_human_user_storage === "undefined") || !g_human_user_storage ) { return false }
    g_human_user_storage.add_user(public_identity)
    return false
}

async function update_galactic_identity(public_identity) {
    if ( (typeof g_human_user_storage === "undefined") || !g_human_user_storage ) { return false }
    g_human_user_storage.update_user(public_identity)
    return false
}


function set_current_galactic_identity(descr) {
    for ( let el_id in descr ) {
        let el = descr[el_id]
        let value = el.info === "name" ? g_current_user_name : g_current_user_id
        if ( el.type === "element" ) {
            let el = document.getElementById(el_id)
            if ( el ) {
                el.innerHTML = value
            }
        } else if ( el.type === "field" ) {
            let el = document.getElementById(el_id)
            if ( el ) {
                el.value = value
            }
        }
    }
}



async function injest_identity_to_current_id(public_id) {
	await add_galactic_identity(public_id)
	set_current_galactic_identity(public_id)
	set_contact_identity()
	initLogin()
}


