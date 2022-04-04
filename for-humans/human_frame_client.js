
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


