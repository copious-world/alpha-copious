
// FOR HUMANS  >> HUMAN FRAME CLIENT .JS


if ( window.g_human_user_storage === undefined ) window.g_human_user_storage = false



//  human client frame

let g_my_current_session = false

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


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


//
function set_current_galactic_user(public_id) {
    g_current_user_id = public_id.ccwid
    g_current_user_name = public_id.name
    g_current_pub_identity = public_id
}


async function exists_galactic_identity() {
    if ( (typeof g_human_user_storage === "undefined") || !g_human_user_storage ) { return false }
    if ( g_current_pub_identity !== false ) {
        return g_current_pub_identity
    }
    let name_key = false
    let users = await g_human_user_storage.get_known_users()
    if ( Array.isArray(users) ) {
        for ( let u of users ) {
            let u_obj = u[0]
            if ( u_obj !== undefined ) {  // and is this the current user??
                let name_key = u_obj.name
                let public_id = await g_human_user_storage.get_user(name_key)
                if ( public_id ) {
                    if ( (typeof public_id.data === "object") && (typeof public_id.data["user-meta"] === "string")) {
                        public_id = JSON.parse(public_id.data["user-meta"])
                    }
                    set_current_galactic_user(public_id)
                    return g_current_pub_identity
                }
            }
        }
    }
    return false
}


async function add_galactic_identity(public_identity) {
    if ( (typeof g_human_user_storage === "undefined") || !g_human_user_storage ) { return false }
    await g_human_user_storage.add_user(public_identity)
    return false
}

async function update_galactic_identity(public_identity) {
    if ( (typeof g_human_user_storage === "undefined") || !g_human_user_storage ) { return false }
    await g_human_user_storage.update_user(public_identity)
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
	set_current_galactic_user(public_id)
	set_contact_identity()
	initLogin()
}


// <<<----  ((END))  FOR HUMANS  >> HUMAN FRAME CLIENT .JS
