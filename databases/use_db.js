
//$>>	db_startup

const DB_VERSION = 1
const DATA_STORE = "human-projects"
const describe_data = "user records"

let g_human_user_storage = false
let g_human_user_storage_ref = [false]

if ( typeof self === "undefined" ) {
    if ( typeof window !== "undefined" ) {
        window.self = window
    }
}


if ( typeof name_key_of !== "function" ) {
    self.name_key_of = (uobj) => { return "test"}
}


/**
 * 
 * @returns {object}
 */
async function db_startup() {
    //
    g_human_user_storage = new HumanUserDB({
        "DB_VERSION" : DB_VERSION,
        "DATA_STORE" : DATA_STORE,
        "describe_data" : describe_data
    })

    await g_human_user_storage.init_database()
    await g_human_user_storage.load_name_list()

    g_human_user_storage_ref[0] = g_human_user_storage
    
    return g_human_user_storage
}






const TXDB_VERSION = 1
const TXDATA_STORE = "human-transactions"
const tx_describe_data = "transaction data records"

let g_human_user_transaction_log_storage = false
let g_human_user_transaction_log_storage_ref = [false]

async function tx_db_startup() {
    //
    if ( (g_human_user_transaction_log_storage !== false) && (g_human_user_transaction_log_storage !== undefined) ) {
        return g_human_user_transaction_log_storage
    }
    //
    g_human_user_transaction_log_storage = new AppDBWrapper({
        "DB_VERSION" : TXDB_VERSION,
        "DATA_STORE" : TXDATA_STORE,
        "describe_data" : tx_describe_data
    })

    await g_human_user_transaction_log_storage.init_database()
    await g_human_user_transaction_log_storage.load_name_list()

    g_human_user_transaction_log_storage_ref[0] = g_human_user_transaction_log_storage
    
    return g_human_user_transaction_log_storage
}



const KYDB_VERSION = 1
const KYDATA_STORE = "human-session-keys"
const ky_describe_data = "session signer key data records"

let g_human_user_signer_storage = false
let g_human_user_signer_storage_ref = [false]

async function ky_db_startup() {
    //
    if ( (g_human_user_signer_storage !== false) && (g_human_user_signer_storage !== undefined) ) {
        return g_human_user_signer_storage
    }
    //
    g_human_user_signer_storage = new AppDBWrapper({
        "DB_VERSION" : KYDB_VERSION,
        "DATA_STORE" : KYDATA_STORE,
        "describe_data" : ky_describe_data
    })

    await g_human_user_signer_storage.init_database()
    await g_human_user_signer_storage.load_name_list()

    g_human_user_signer_storage_ref[0] = g_human_user_signer_storage
    
    return g_human_user_signer_storage
}


/**
 * 
 * @param {object} mobj 
 */
async function store_external_transaction(mobj) {
    let db = g_human_user_transaction_log_storage
    await db.add_data(mobj,mobj.tx_id)
}


/**
 * 
 * @param {object} mobj 
 */
async function store_sessions_to_keys(mobj) {
    let db = g_human_user_signer_storage
    await db.add_data(mobj,mobj.session)    
}



//$>>	store_user
// for this verision of store_user, it is assumed that the shape of the user information has been fully 
// determined by the base domain page (www.of-this.world/builder ... for instance) 
async function store_user(user_information) {
    if ( !g_human_user_storage ) return(false)
    await g_human_user_storage.add_user(user_information)
    return(true)
}


/**
 * 
 * @param {string} name_key 
 * @returns {object}
 */
async function get_user_public_wrapper_key(name_key) {
    let user_object = await g_human_user_storage.get_user(name_key)
    if ( user_object ) {
        let pub_key = g_human_user_storage.current_user_info.public_key
        return pub_key
    }
    return false
}



/**
 * 
 * @param {string} name_key 
 * @returns {object}
 */
async function get_user_public_signer_key(name_key) {
	//
    let user_object = await g_human_user_storage.get_user(name_key)
    if ( user_object ) {
        let signer_public_key = g_human_user_storage.current_user_info.signer_public_key
        return signer_public_key
    }
    return false
}


/**
 * 
 * @param {object} identity 
 * @returns {boolean}
 */
async function unstore_user(identity) {
    if ( !g_human_user_storage ) return(false)
    try {
        let name_key = identity.name
        if ( g_human_user_storage.current_user_name !== name_key ) {
            await g_human_user_storage.get_user(name_key)
        }
        await g_human_user_storage.remove_user()
        return(true)
    } catch (e) {
    }
    return false
}

/**
 * 
 * @param {object} identity 
 */
async function restore_identity(identity) {
    try {
        await g_human_user_storage.add_user(identity)
    } catch (e) {
    }
}


/**
 * 
 * @param {object} user_info 
 * @returns 
 */
async function identity_from_user(user_info) {
    if ( !g_human_user_storage ) return(false)
    //
    let name_key = name_key_of(user_info)
    if ( !name_key ) return(false)
    //
    try {
       let identity = await g_human_user_storage.get_user(name_key)
       return identity
    } catch (e) {
    }
    return false
}



/**
 * 
 * @param {string} name_key 
 * @returns {object|boolean}
 */
async function identity_from_user_name(name_key) {
    if ( !name_key ) return(false)
    //
    try {
       let identity = await g_human_user_storage.get_user(name_key)
       return identity
    } catch (e) {
    }
    return false
}



/**
 * 
 * @param {string} uname
 * @returns {object|boolean}
 */
async function get_complete_user_identity(uname) {
    let identity = await identity_from_user_name(uname)
    console.log(identity)
    if ( identity && identity.data ) {
        let data_map = identity.data
        let part_id = "user-meta"
        try {
            let user_info = JSON.parse(data_map[part_id])
            if ( typeof user_info === 'object' ) {
                return user_info
            }
        } catch (e) {}
    }
    return false
}


/**
 * 
 * Once the application gets its user ucwid's, it calls finalize_user_identity 
 * and this function stores the user values in the identity object in indexedDB.
 * 
 * @param {object} u_info 
 * @param {object} identity_files 
 */
async function finalize_user_identity(u_info,identity_files) {
    //
// "id" : ucwid with key,
// "clear_id" : ucwid without key,
// "dir_data" : user directory structure
    //
    let storage_obj = await identity_from_user(u_info)
    //
    let ucwid = value_fallback(identity_files.id)
    storage_obj.ucwid = ucwid
    storage_obj.dirs = value_fallback(value_fallback(identity_files.dir_data).dirs)
    storage_obj.files = value_fallback(value_fallback(identity_files.dir_data).files)
    storage_obj.stored_externally =  (ucwid.length > 0)
    //
    // UPDATE
    await g_human_user_storage.update_user(storage_obj)
}




/**
 * 
 * @param {object} identity 
 */
async function update_identity(identity) {
    try {
        let u_info = identity.user_info
        let storage_obj = await identity_from_user(u_info)
        for ( let ky in storage_obj ) {
            if ( (ky == "dirs") || (ky === "files") ) {
                storage_obj[ky] = identity[ky]
            }
        }
        if ( identity.profile_image ) {
            storage_obj.profile_image = identity.profile_image
        }
        if ( identity.asset_keys ) {
            storage_obj.asset_keys = Object.assign({},identity.asset_keys)
        }
        if ( identity.introductions ) {
            storage_obj.introductions = identity.introductions
        }
        if ( identity.messages ) {
            storage_obj.messages = identity.messages
        }
        // UPDATE
        await g_human_user_storage.update_user(storage_obj)
        //
    } catch (e) {
    }
}




/**
 * 
 * @param {object} identity 
 * @returns 
 */
async function fix_keys(identity) {
	let u_info = identity.user_info
	if ( !u_info ) return // can't fix it
	if ( ( identity.priv_key === undefined) || ( identity.signer_priv_key === undefined ) || ( u_info.signer_public_key === undefined ) ) {
		try {
			let storage_obj = await identity_from_user(u_info)
			if ( identity.priv_key === undefined ) {
				let keypair = await pc_wrapper_keypair_promise()
				// ---- ---- ---- ----
				let pub_key = keypair.publicKey
				let priv_key = keypair.privateKey
				let exported = await g_crypto.exportKey("jwk",pub_key);
				let pub_key_str = JSON.stringify(exported)

				let priv_exported = await g_crypto.exportKey("jwk",priv_key);
				let priv_key_str =  JSON.stringify(priv_exported);
				//
				storage_obj.priv_key = priv_key_str
				u_info.public_key = pub_key_str
			}
			//
			if ( ( identity.signer_priv_key === undefined ) || ( u_info.signer_public_key === undefined ) ) {
				let signer_pair = await pc_keypair_promise()
				//
				let signer_pub_key = signer_pair.publicKey
				let signer_priv_key = signer_pair.privateKey

				let sign_exported = await g_crypto.exportKey("jwk",signer_pub_key);
				let sign_pub_key_str = JSON.stringify(sign_exported)

				let sign_priv_exported = await g_crypto.exportKey("jwk",signer_priv_key);
				let sign_priv_key_str = JSON.stringify(sign_priv_exported);
				//
				storage_obj.signer_priv_key = sign_priv_key_str					
				u_info.signer_public_key = sign_pub_key_str
			}

            // UPDATE
            await g_human_user_storage.update_user(identity)
 
		} catch (e) {
		}
	}
}



/**
 * makes a temporary hash of the data
 * 
 * ```
 user_data = {
    "name": name,
    "DOB" : DOB,
    "place_of_origin" : place_of_origin, 
    "public_information" : public_information, 
    "business" : (business === undefined) ? false : business, 
    "public_key" : public_key,
    "signer_public_key" : signer_public_key,
    "axiom_public_key" : axiom_public_key
}
 * ```
 * @param {object} user_data 
 * @returns {object}
 */
async function pre_user_keys(user_data) {   // USER DATA (See above)
    //
    let id_packet = {
        "human_name" : user_data.name,
        "public_component" : false
    }

    id_packet.public_component = Object.assign(user_data)  // KEEP THE FIELD ENTRIES HERE `user_data`

    let hashable_data = JSON.stringify(id_packet)
    let hash_of_data = await do_hash(hashable_data)
    // add to the user data ....
    id_packet.ccwid = hash_of_data                      // junk keys (yet Sha256)
    id_packet.public_component.ccwid = hash_of_data
    //
    return id_packet
}



/**
 * 
 * @param {object} identity - a complete identity packet, will only have a `public_component` field
 * @returns {pair}
 */
async function inialize_user_resources(identity) {
	//
    if ( identity.public_component ) {
        // identity and public_component have junk hashes (place holders) useful only in clients
        // `name_as_uri` will identify the correct record for private key creation and final user frame 
        // population. The identity site (of-this.world) produces the user frame page and url before ID completiton
        let [child_window,human_frame_url,name_as_uri] = await request_human_page(identity)
        identity.public_component.human_frame_url = human_frame_url
        identity.public_component.name_as_uri = name_as_uri
        // store this locally (under the builder ... this has to do with coming back to the device and a second user 
        // wants to store their identity)
        if ( g_human_user_storage ) await g_human_user_storage.update_user(identity.public_component)
        return [child_window,identity]
    } else {
        return [false,false]
    }
}
