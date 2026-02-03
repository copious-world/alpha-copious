
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




//$>>	db_startup
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





//$>>	store_user
// for this verision of store_user, it is assumed that the shape of the user information has been fully 
// determined by the base domain page (www.of-this.world/builder ... for instance) 
async function store_user(user_information) {
    if ( !g_human_user_storage ) return(false)
    await g_human_user_storage.add_user(user_information)
    return(true)
}



//$>>	get_user_public_wrapper_key
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




//$>>	get_user_public_signer_key
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




//$>>	store_user
/**
 * 
 * @param {*} user_information 
 * @returns 
 */
async function store_user(user_information) {
    if ( !g_human_user_storage ) return(false)
    await g_human_user_storage.add_user(user_information)
    return(true)
}


//$>>	unstore_user
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


//$>>	identity_from_user
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


//$>>	identity_from_user_name
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



//$>>	get_complete_user_identity
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


