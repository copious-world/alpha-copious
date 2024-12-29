
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----

const CHUNK_POST_COM_WSSURL_REQ = `https://${self.location.host}/song-search/guarded/dynamic/hash_progress_com_wss_url`
const STORE_ASSET_POST_URL = `https://${self.location.host}/song-search/transition/store_waves`  // SESSION STORAGE FOR THIS DEVICE
const SESSION_DEVICE_MOVE = `https://${self.location.host}/song-search/transition/move_waves`    // FROM THIS DEVICE TO STORAGE
const SESSION_DEVICE_VERIFY = `https://${self.location.host}/song-search/transition/verify`    // FROM THIS DEVICE TO STORAGE
//
const AUDIO_SESSION_STORE = 'audio_sessions'
const AUDIO_USERID_STORE = 'audio_users'
const AUDIO_SESSION_COMPLETE = 'audio_complete'
const DB_VERSION = 5.0
//
var g_user_info = {}
var g_current_aes_key = null
var g_current_chunks = []       // chunk hashes
var g_current_nonces = []
var g_current_chunk_times = []
var g_chunk_signer = false
var g_chunk_signer_list = []
let g_nonce_buffer = new Uint8Array((256/8))        // 256 bits or 32 bytes 
var g_current_session_name = "none"
var g_current_session_machine_name = ""
var g_session_changed = false
var g_current_geo_location = ""
var g_current_geo_location_str = ""
var g_current_session_nonce = ""

// 
var g_crypto = crypto.subtle
var g_app_web_socket = null

// 
var g_session_start_time = 0 
var g_local_session_start_time = 0



// This key will be written each time a new virtual identity is made for the guest interactor (a virtual identity)
//
let g_gratis_negotiator = new Worker('./guest_presence_$$key')


function figure_server_time_offset() {
    let t = Date.now()
    t -= g_local_session_start_time
    let t_server = g_session_start_time + t
    return t_server
}

// DATABASE
var g_audio_db = null
const gc_song_db_name = "SongCatcher"
const describe_data = "wave records"


class UsersAudioDB extends AppDBWrapper {

  constructor(conf) {
      super(gc_song_db_name,conf)
      this.current_user_name = ""
      this.current_description = ""
      this.current_file_list = []
      //
      this.current_user_object = false
      this.current_user_data = false
      //
      this.clear_identity_list_data()
  }


  set session_name(name) {
        this.current_session_name = name
        g_current_session_name = name
  }


  get_file_details(part_id) {
      if ( !(part_id) || (part_id.length === 0) ) return ""
      if ( this.current_user_object ) {
          let user_Obj = this.current_user_object
          if ( user_Obj ) {
              let data_map = user_Obj.data
              if ( typeof data_map[part_id] === "string" ) {
                  return JSON.parse(data_map[part_id])    
              }
          }
      }
      return false
  }

  //
  async add_file(file_name,description,svg,to_layer) {
      if ( svg === undefined ) svg = ""
      if ( to_layer == undefined ) to_layer = 0
      let file_record = {
          "name" : file_name, 
          "description" : description,
          "data" : "", "ouput" : "", "svg" : svg, "layer" : to_layer }
      //
      let data = JSON.stringify(file_record)
      await this.add_data(data,file_name)
  }

  //
  async remove_file(file_name) {
      this.session_name = file_name
      await this.remove_data(file_name,this.current_user_name)
  }

  // 
  async get_file_names() {
      let sess_name = this.session_name
      try {
          let sess_data = await this.get_session(sess_name)
          if ( sess_data ) {
              let f_names = Object.keys(sess_data.data)
              return f_names
          }    
      } catch (e) {
          console.log("get_file_names")
      }
      return []
  }

  async get_file_entries() {
      let sess_name = this.session_name
      try {
          let sess_data = await this.get_session(sess_name)
          if ( sess_data ) {
              let f_names = sess_data.data.map((f_data) => JSON.parse(f_data))
              return f_names
          }
      } catch (e) {
          console.log("get_file_entries")
      }
      return []    
  }

  // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

  app_add_fields(sessionObj) {
      sessionObj.project_name = this.current_user_name
      sessionObj.author = this.current_author
      sessionObj.description = this.current_description
  }


  // ----
  async application_data_update(blob_url,part_id,blob_data,other_id) {
      // implemented by derived method (override)
      add_audio_element(blob_url,section_id,audioBlob,other_id)
      if ( other_id !== undefined ) {
        await wv_secure_total_session(this.session_name)
      }
  }


  // ----
  app_pre_update_action(blob_data,part_id,op_parameters) {
        // implemented by derived method (override)
        let operation = {'op' : 'backup'}
        if ( op_parameters ) {
            let operation = {'op' : 'cut', "startX" :  op_parameters.startX, "w" : op_parameters.w, "samples" : op_parameters.samplePP }
        }
        wv_secure('edit-update',blob_data,part_id)
        return operation
  }

  // ----
  async app_post_update_action(blob_data,part_id,blob_url) {
    update_audio_element(blob_url,part_id,blob_data)  // visual rep
    await wv_secure_total_session(this.session_name)
  }

  //
  async app_secure_total_session(sess_name) {
      // implemented by derived method (override)
  }

  //
  application_revise_current_session(sess_name) {
      // implemented by derived method (override)
      this.current_session_name = sess_name
      choose_edit_user_session(this.session_name)
  }
  
  //
  application_update_session_name_selections(sess_name,name_list) {
  }

  //
  clear_identity_list_data() {
      this.identity_list = []
      this.user_list = []
  }

  application_total_entry(identity) {
      this.identity_list.push(identity)
      this.user_list.push(identity.user_info)
  }


  async get_known_users() {
      this.clear_identity_list_data()
      await g_human_user_storage.load_name_list()
      return [this.user_list,this.identity_list]
  }

}





async function wv_init_database() {
    // request an open of DB
    let p = new Promise(async (resolve,reject) => {
        g_audio_db = new UsersAudioDB({
            "DB_VERSION" : DB_VERSION,
            "DATA_STORE" : AUDIO_SESSION_STORE,
            "COMPLETION_STORE" : AUDIO_SESSION_COMPLETE,
            "describe_data" : describe_data
        })

        try {
        await g_audio_db.init_database()
        resolve(g_audio_db)
        } catch (e) {
        reject(false)
        }
    })
    //
    return p
};



// ---- ---- ---- ---- ---- ---- ---- ---- ----

function interaction_state(state,error) {
    if ( error ) {
        //
    } else {
        self.postMessage({'type': 'status', 'status': state });
    }
}

function interaction_info(info) {
    self.postMessage({'type': 'info-ws', 'status': info });
}

// ---- ---- ---- ---- ---- ---- ---- ---- ----

//>--
function get_client_device_name() {
    let oscpu = navigator.oscpu
    let ua = navigator.userAgent
    let user_given_machine_name = g_current_session_machine_name
    //
    let b = `${oscpu}-${ua}-${user_given_machine_name}`
    b = encodeURIComponent(b.trim())
    return(b)
}
//--<

// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----

async function postData(url = '', data = {}, creds = 'omit', do_stringify = true,ctype) {
    let content_type = 'application/json'
    if ( ctype !== undefined ) {
        content_type = ctype
    }
    let options = {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: creds, // include, *same-origin, omit
        headers: {
        'Content-Type': content_type
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *client
        body: (do_stringify ? JSON.stringify(data)  : data)	// body data type must match "Content-Type" header
    }

    if ( ctype === 'multipart/form-data') {
        delete options.headers['Content-Type']  // content type will be set automatically with a boundary
    }

    // Default options are marked with *
    const response = await fetch(url, options);
    if ( response.ok == false ) {
        console.log(response.status + ': ' + response.statusText)
        return {}
    } else {
        return await response.json(); // parses JSON response into native JavaScript objects
    }
}



// ---- ---- ---- ---- ---- ---- ---- ---- ----

async function wv_update_user(user_object) {
    // may send this to the client page....
}

//
function apply_find_audio_session(sess_name, store, success_callback, not_found_callback) {
    //
    var nameIndex = store.index('name');
    nameIndex.get(sess_name).onsuccess = (evt) => {
        var value = evt.target.result;
        if ( value ) {
        if ( success_callback ) success_callback(value,nameIndex);
        } else {
        if ( not_found_callback ) not_found_callback();
        }
    };
    //
}


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// HANDLE HEX AND BYTE ARRAYS
//>--
function hex_fromArrayOfBytes(arrayOfBytes) {
    const hexstr = arrayOfBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    return(hexstr)
}
//--<

//>--
function hex_fromTypedArray(byteArray){
    let arrayOfBytes = Array.from(byteArray)
    return(hex_fromArrayOfBytes(arrayOfBytes))
}
//--<

//>--
function hex_fromByteArray(byteArray){
    return hex_fromTypedArray(ArrayOfBytes_toByteArray(byteArray))
}
//--<

//>--
function hex_toArrayOfBytes(hexString) {
    let result = [];
    for ( let i = 0; i < hexString.length; i += 2 ) {
    result.push(parseInt(hexString.substr(i, 2), 16));
    }
    return result;
}
//--<

//>--
function hex_toByteArray(hexstr) {
    let aob = hex_toArrayOfBytes(hexstr)
    return ArrayOfBytes_toByteArray(aob)
}
//--<

//>--
function ArrayOfBytes_toByteArray(arrayOfBytes) {
    let byteArray = new Uint8Array(arrayOfBytes)
    return(byteArray)
}
//--<

//>--
function xor_arrays(a1,a2) {
    let n = Math.min(a1.length,a2.length)
    let N = Math.max(a1.length,a2.length)
    //
    let output = []
    for ( let i = 0; i < n; i++ ) {
        let a = a1[i]
        let b = a2[i]
        output.push(a ^ b)
    }
    let rest = a1.length > a2.length ? a1.slice(n,N) :  a2.slice(n,N)
    output = output.concat(rest)
    return(output)
}
//--<

//>--
function xor_byte_arrays(ba1,ba2) {
    let n = Math.min(ba1.length,ba2.length)
    let N = Math.max(ba1.length,ba2.length)
    // -- make the new array out of the longer array
    let xored = ba1.length > ba2.length ? new Uint8Array(ba1) : new Uint8Array(ba2)
    for ( let i = 0; i < n; i++ ) { // xor in the shorter array
        xored[i] = ba1[2] ^ ba1[i]
    }
    return xored
}
//--<

//>--
function hex_xor_of_strings(str1,str2) {
    let bytes1 = hex_toArrayOfBytes(str1)
    let bytes2 = hex_toArrayOfBytes(str2)
    //
    let xored = xor_arrays(bytes1,bytes2)
    return(hex_fromArrayOfBytes(xored))
}
//--<

//>--
// xor_all
//  -- 
function xor_all_to_hex_str(hexs_chunks) {  // chunks are text hashes
    let start_chunk = hexs_chunks[0]
    let encoded = hex_toArrayOfBytes(start_chunk)
    let n = hexs_chunks.length
    for ( let i = 1; i < n; i++ ) {
        let next_source = hex_toArrayOfBytes(hexs_chunks[i]);
        encoded = xor_arrays(encoded,next_source)
    }
    const hashHex = hex_fromArrayOfBytes(encoded); // convert bytes to hex string
    return hashHex;
}
//--<



//>--
// geo_loc_str_to_byte_array
//  -- 
function geo_loc_str_to_byte_array(loc_str) {
    let loc = null
    try {
        loc = JSON.parse(loc_str)
        if ( (loc.latitude === undefined) || (loc.longitude === undefined) ) {
            loc = g_current_geo_location
        }
    } catch(e) {
        loc = g_current_geo_location
    }
    let lat = '' + loc.latitude
    let long = '' + loc.longitude
    lat = lat.replace('.','')
    long = long.replace('.','')
    let stringup = lat + long
    let array = hex_toArrayOfBytes(stringup)
    return(array)
}
//--<


//>--
// wv_nowrap_decrypted_local_priv_key
// --
async function wv_nowrap_decrypted_local_priv_key(key_bytes,unwrapped_aes,iv_buffer) {
    //
    let clear_key = await g_crypto.decrypt({
                                                name: "AES-CBC",
                                                iv : iv_buffer
                                            },unwrapped_aes,key_bytes)
    //
    let dec = new TextDecoder()
    let txt = dec.decode(clear_key)
    let clear_jwk = JSON.parse(txt)
    //
    let key = await g_crypto.importKey('jwk',clear_jwk,{
            'name': "ECDSA",
            'namedCurve': "P-384"
        },
        true,
        ["sign"]
    )
    return key
}
//--<


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// HANDLE HEX AND BYTE ARRAYS

async function encrypt_hash(hashAsBytes) {
    // do nothing for now...
}

//>--
// digestByteArray
//  Xor a nonce onto the data bytes take from the Blob.
//  Then use SHA-256 to hash the result. 
//  Return the SHA hash as a hex string.
//  -- 
async function digestByteArray(byteArray,secret) {
    if ( secret ) {  // the secret has to match the Uint8Array type
        byteArray = new Uint8Array(byteArray)  // copy the array
        byteArray = xor_byte_arrays(byteArray,secret)
    }
    const hashBuffer = await g_crypto.digest('SHA-256', byteArray);          // hash the message
    const hashAsBytes = new Uint8Array(hashBuffer)
    // await encrypt_hash(hashAsBytes)
    const hashArray = Array.from(hashAsBytes);                // convert buffer to byte array
    const hashHex = hex_fromArrayOfBytes(hashArray); // convert bytes to hex string
    return hashHex;
}
//--<


//>--
// hash_of_chunk
//
//  Get the array of bytes from a blob (audio blob, e.g.)
//  -- 
async function hash_of_chunk(a_chunk,secret) {
    let chunkArray = await a_chunk.arrayBuffer();   // a_chunk is a blob
    let hexHash = await digestByteArray(chunkArray,secret)
    return(hexHash)
}
//--<

//>--
// sign_hash
// --
// sign with the private key of the user on the device...
async function sign_hash(text,signing_key) {
    //
    let enc = new TextEncoder();   // one each time or one for app ???
    let encoded =  enc.encode(text);
    let signature = await g_crypto.sign({
                                            name: "ECDSA",
                                            hash: {name: "SHA-256"},
                                        },
                                        signing_key,
                                        encoded
                                    );
    return(signature)
}
//--<

function store_hashes_and_nonces(map_id,hashObj) {
    let p = new Promise((resolve,reject) => {
        let sess_name = g_current_session_name
        let transaction = g_audio_db.transaction(AUDIO_SESSION_STORE, "readwrite");
        let audioStore = transaction.objectStore(AUDIO_SESSION_STORE);
        //
        let update_list_hashes_callback = (value,dbIndex) => {
            let keyRangeValue = IDBKeyRange.only(value.name);
            dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                var cursor = event.target.result;
                if ( cursor ) {
                    let sessionObj = cursor.value
                    sessionObj.hashes[map_id] = hashObj
                    cursor.update(sessionObj);
                    resolve(true)
                }
            }
        }

        let not_found_callback = () => {
            reject(false)
            console.log(`The session ${sess_name} is not in the database`)
        }
    
        apply_find_audio_session(sess_name, audioStore, update_list_hashes_callback, not_found_callback)
    })
    return p
}


// combined_hash_signed_and_store
// parameters:
//  hexs_chunk_array - either the new hashes from audio chunks or stored ones from previous recording and return to edit
//  blob_id - the id for local storage and/or identifying this as part of the larger sessions container
//  new_blob - this is the combined blob data of all gathered chunks for a sessions of a named session
//  prev_blob_hash (optional) - provided during the editing of a section... this will be incorporated
//
async function combined_hash_signed_and_store(hashObj,blob_id,new_blob,prev_blob_hash) {
    let is_new_storage = prev_blob_hash ? false : true // store the history of changes if the parameter is provided
    // hexs_chunk_array passed
    let nonces = is_new_storage ? g_current_nonces : hashObj.nonces
    let times = is_new_storage ? g_current_chunk_times : hashObj.times
    let hexs_chunk_array = is_new_storage ? g_current_chunks :  hashObj.hashed_chunks
    //
    if ( is_new_storage ) {     // demarcate data representation from editing history representation
        nonces.push("0")
        hexs_chunk_array.push("0")
        times.push("0")
    } else {
        hexs_chunk_array.push(prev_blob_hash)   // previous result of this function
    }
    
    // hash
    let blobArray = await new_blob.arrayBuffer();          // -- recorded data
    const hashBuffer = await g_crypto.digest('SHA-256', blobArray);     // SHA 256
    //  convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex_suffix = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    // add to the hash list
    hexs_chunk_array.push(hashHex_suffix)
    //
    let hx_time = Date.now().toString(16)
    times.push(hx_time)             // ensuing times correspond to first store and edits.
    let last_loc_bytes = geo_loc_str_to_byte_array(hashObj.sess_geo_location)
    let stored_token = hashHex_suffix 
    if ( last_loc_bytes ) {
        let a_view = new Uint8Array(hashHex_suffix)
        let o_array = [...a_view]
        let xored = xor_arrays(last_loc_bytes,o_array)
        hashHex_suffix = hex_fromArrayOfBytes(xored)
        hashHex_suffix = hex_xor_of_strings(hashHex_suffix,hx_time)
    }
    //
    //
    // get an xor of all the hashes in the chunk array
    let hash_prefix = xor_all_to_hex_str(hexs_chunk_array)
    //
    let output = hash_prefix + '|{+}|' + hashHex_suffix  // the hex of the xor of chunk hashses... with the hex of the Sha2 hash of blob
    //        
    output = await sign_hash(output,g_chunk_signer.signer_priv_key)
    let hashObjUpdate = {
        'hash_combo' : stored_token,      // signed and sent to server
        'combined' : hash_prefix,
        'blob_hash' : hashHex,
        'nonces' : nonces,
        'hashed_chunks' : hashed_chunks,
        'times' : times
    }
    //
    for ( let hky in hashObjUpdate ) {
        hashObj[hky] = hashObjUpdate[hky]
    }
    //
    await store_hashes_and_nonces(blob_id,hashObj)
    //
    return(output)
}


// retrieve_hash_from_db
//      A benchmark has has been stored... This gets it and does no operations on it.
async function retrieve_hash_from_db(map_id,sess_name) {
    let transaction = g_audio_db.transaction(AUDIO_SESSION_STORE, "readwrite");
    let audioStore = transaction.objectStore(AUDIO_SESSION_STORE);
    //
    let p = new Promise((resolve,reject) => {
        let get_listed_hash_callback = (value,dbIndex) => {
            let keyRangeValue = IDBKeyRange.only(value.name);
            dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                var cursor = event.target.result;
                if ( cursor ) {
                    let sessionObj = cursor.value
                    let result = sessionObj.hashes[map_id]
                    resolve(result)
                }
            }
        }
    
        let not_found_callback = () => {
            reject(`The session ${sess_name} is not in the database`)
        }

        apply_find_audio_session(sess_name, audioStore, get_listed_hash_callback, not_found_callback)
    })
    //
    return p
}


async function fetch_compressed_session_from_db(sess_name) {
    let transaction = g_audio_db.transaction(AUDIO_SESSION_COMPLETE, "readwrite");
    let audioStore = transaction.objectStore(AUDIO_SESSION_COMPLETE);
    //
    let p = new Promise((resolve,reject) => {
        let get_governing_session_callback = (value,dbIndex) => {
            let keyRangeValue = IDBKeyRange.only(value.name);
            dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                var cursor = event.target.result;
                if ( cursor ) {
                    let sessionObj = cursor.value
                    resolve(sessionObj)
                }
            }
        }
        //
        let not_found_callback = () => {
            reject(`The session ${sess_name} is not in the database`)
        }
        //
        apply_find_audio_session(sess_name, audioStore, get_governing_session_callback, not_found_callback)
    })
    return p
}


var g_wss_active_session_id = "nothing"
function set_current_app_ws_id(ws_id) {
    g_wss_active_session_id = ws_id
}

// two names -- not calling one with the other
function post_wss(message) {
    if ( g_app_web_socket ) {
        let chunk_message = JSON.stringify(message)
        g_app_web_socket.send(chunk_message)    
    }
}

function post_chunk(chunk_data) {
    if ( g_app_web_socket ) {
        let chunk_message = JSON.stringify(chunk_data)
        g_app_web_socket.send(chunk_message)    
    }
}


// Data for persistence storage...
function create_asset_meta(info_obj) {
    let field_vars = {}
    field_vars['asset-id'] = false
    field_vars['rec-file-mtype'] = "audio/x-wav"
    field_vars['rec-title'] = info_obj.name
    field_vars['rec-subject'] = "New asset - " + Date.now()
    field_vars['rec-keys'] = ""
    field_vars['rec-abstract'] = ""
    field_vars['rec-full-text'] = ""
    //
    field_vars['paid-checkbox'] = false
    field_vars['WIP-checkbox'] = true
    field_vars['rec-contract'] = false
    //
    field_vars['rec-file-name'] = info_obj.name
    field_vars['rec-file-proper'] = info_obj
    field_vars['rec-poster-name'] = ""
    field_vars['rec-poster-proper'] = false
    //
    field_vars['rec-was-published'] = false
    field_vars['rec-was-uploaded'] = false
}

// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----
self.onmessage = async (e) => {
    let message = e.data
    switch ( message.type ) {
        case 'init' : {             // setup operation
            try {
                let user_info = message.user
                g_current_session_machine_name = user_info.machine_name ? user_info.machine_name : 'tester'
                g_user_info = user_info // ?? will the key come through OK?
                //
                if ( g_user_info.chunk_signer === undefined ) {
                    let sign_keys = await galactic_user_starter_keys('signer')
                    g_user_info.chunk_signer = sign_keys
                    g_chunk_signer = sign_keys
                    await wv_update_user(g_user_info)
                } else {
                    g_chunk_signer =  g_user_info.chunk_signer
                }
                //
                wv_init_database(gc_song_db_name)
                g_app_web_socket = await web_socket_initializer(user_info,g_chunk_signer.signer_pk_str)
                //
                g_ui_data.set_user_id(user_info.ccwid)
                //
                interaction_state('ready')
            } catch(error) {
                interaction_state('fail-init')
            }
            break; 
        }
        case 'session' : {
            //
            g_current_session_name = message.sess_name
            let session_object = await g_audio_db.get_session(g_current_session_name)
            if ( session_object.nonce === undefined ) {
                g_current_session_nonce = await gen_nonce()
                session_object.nonce = g_current_session_nonce
                await g_audio_db.update_session(g_current_session_nonce,"nonce",g_current_session_nonce)
            } else {
                g_current_session_nonce = session_object.nonce
            }
            
            let remote_session_op = {
                'transition' : 'recording-session',
                'message' : {
                    'ucwid' : g_user_info.ucwid,
                    'session' : g_current_session_name,
                    'verify_key' : g_chunk_signer.signer_pk_str,
                    'server_id' : g_identified_server,
                    'nonce' : g_current_session_nonce,
                    'geolocation' : g_current_geo_location_str
                }
            }
            //
            post_wss(remote_session_op)  // send updates to the server (short message)
            //
            break
        }
        case 'geolocation' : {
            g_current_geo_location = message.geo_location
            g_current_geo_location_str = JSON.stringify(g_current_geo_location)
            break;
        }
        case 'chunk' : {            // recording chunks
            // as chunks are gathered during recording save hashes of them
            g_current_session_name = message.sess_name
            // The chunk in raw form is in the client for sound playback.
            let section = message.section
            let new_chunk = message.chunk
            let chunk_time = figure_server_time_offset()
            let hx_chunk_time = chunk_time.toString(16);
            crypto.getRandomValues(g_nonce_buffer);         // sign the time and xor signature into secret
            //
            let time_array = await sign_hash(hx_chunk_time,g_current_session_name.signer_priv_key)
            let secret = xor_byte_arrays(g_nonce_buffer,time_array)
            // has the secret into the chunk
            // -- hash_of_chunk -- SHA-256 of xor with secret  = (time ^ data) ^ random = (time ^ random) ^ data
            let chunk_hash = await hash_of_chunk(new_chunk,secret)  // chunk has is a string in the hex alphabet
            // STORE HASH LOCALLY -- not yet in DB -- the chunk is in the DB
            g_current_chunks.push(chunk_hash)
            let nonce_hx_str = hex_fromTypedArray(g_nonce_buffer)  // a string
            g_current_nonces.push(nonce_hx_str)
            g_current_chunk_times.push(hx_chunk_time)
            // STORE HASH REMOTELY           // STORE HASH REMOTELY
            let remote_cache_op = {
                'transition' : 'chunk',
                'message' : {
                    'chunk' : chunk_hash,
                    'ucwid' : g_user_info.ucwid,
                    'session' : g_current_session_name,
                    'nonce' : g_current_session_nonce,
                    'section' : section,
                    'client_time' : chunk_time,
                    'server_id' : g_identified_server
                }       // there is no blob id yet...
            }
            post_chunk(remote_cache_op)  // send updates to the server (short message)
            break;
        }
        case 'benchmark' : {        // storage benchmark - hash identifying a whole session
            //
            let op = message.op
            //edit-update, end-recording
            switch ( op ) {
                case 'end-recording' : {        // recording stop button to db
                    // message.blob_id -- a uuid, made for the blob
                    // next get the session data for this blob from the DB
                    let hashes = await retrieve_hash_from_db(message.blob_id,g_current_session_name)
                    // message.blob -- the audio blob, made from the chunks gathered - real time.
                    let c_hash = await combined_hash_signed_and_store(hashes,message.blob_id,message.blob,null)
                        // STORE HASH REMOTELY  // STORE HASH REMOTELY
                    let remote_cache_op = {
                        'transition' : 'chunk-final',
                        'message' : {
                            'chunk_final' : c_hash,
                            'ucwid' : g_user_info.ucwid,
                            'session' : g_current_session_name,
                            'nonce' : g_current_session_nonce,
                            'verify_key' : g_chunk_signer.signer_pk_str,
                            'client_time' : Date.now(),
                            'server_id' : g_identified_server,    // identifies the user recording session
                            'section' : message.blob_id             // UUID from web page
                        }
                    }
                    post_chunk(remote_cache_op)
                    // discard data mapping to chunks gathhered while recording
                    g_current_chunks = []
                    g_current_nonces = []
                    g_current_chunk_times = []
                    break;
                }
                case 'edit-update' : {          // cut, undo, etc.
                    // message.blob_id -- a uuid, made for the blob - stays the same after edits, etc.
                    // next get the session data for this blob from the DB
                    let hashes = await retrieve_hash_from_db(message.blob_id,g_current_session_name)
                    // message.blob -- the audio blob, made from the chunks gathered - real time - and then edited
                    // make a new hash for the edit
                    let edit_ops = JSON.stringify(hashes.operations)
                    let c_hash = await combined_hash_signed_and_store(hashes,message.blob_id,message.blob,hashes.blob_hash)
                    let remote_cache_op = {
                        'transition' : 'chunk-change',
                        'message' : {
                            'chunk_change' : c_hash,
                            'ucwid' : g_user_info.ccwid,
                            'session' : g_current_session_name,
                            'verify_key' : g_chunk_signer.signer_pk_str,
                            'client_time' : Date.now(),
                            'server_id' : g_identified_server,
                            'section' : message.blob_id,
                            'nonce' : g_current_session_nonce,
                            'ops' : edit_ops
                        }
                    }
                    post_chunk(remote_cache_op)
                    break;
                }
                default: {      // error condition
                    break;
                }
            }
            break;
        }
        case 'storage' : {          // send a complete session
            let sess_name = message.sess_id
            try {
                // get the session made by the recorde (effectively use the DB as a means of communications)
                let sess_data = await fetch_compressed_session_from_db(sess_name) // complete sessions (complete session db)
                // The JSON (object) wrapper of the blob data should have fields required by persisitence storage
                let meta = create_asset_meta(sess_data)
                // Now, with meta data stored the data on the WIP persistence path === 'ownership'
                create_entry(meta)
            } catch (e) {
                // ----
            }
            break;
        }
        default : { // error condition
            break;
        }
    }

};


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- 

var g_com_url = ""

var g_identified_server = ""
//
async function web_socket_initializer(user_info,public_verify_key) {
    try {
        let chunk_com_req = {
            'user_key' : user_info.ucwid,
            'device_id' : get_client_device_name(),
            'verify_key' : public_verify_key     // send the verification key on intialization...
        }
        let json =  await postData(CHUNK_POST_COM_WSSURL_REQ,chunk_com_req,'omit',true)
        if ( json ) {
            let com_url = json.url
            g_com_url = com_url
            g_session_start_time = json.access_time
            g_local_session_start_time = Date.now()
            g_identified_server = json.server_id
            //
            let p = new Promise((resolve,reject) => {
                let socket = new WebSocket(`wss://${self.location.host}/${g_com_url}`);   // wss ... forcing this onto a secure channel
                let opened = false
                socket.onopen = (event) => {
                    opened = true
                    resolve(socket)                 /// RESOVE --- return this value 
                };
                //
                //
                socket.onmessage = (event) => {
                    if ( event.data !== undefined ) {       // handle connection maintenance events
                        try {
                            let msg = JSON.parse(event.data)
                            if ( msg.data && (msg.data.type === 'ws_id') ) {
                                let local_ws_id = msg.ws_id
                                if ( msg.data.status === "connected" ) {
                                    set_current_app_ws_id(local_ws_id)
                                }
                            } else if ( msg.data && (msg.data.type === 'ping') ) {
                                if ( g_app_web_socket ) {           // means this was set in the app after resolv
                                    let ponger = {
                                        "ping_id" : msg.data.ping_id,
                                        "time" : Date.now()
                                    }
                                    g_app_web_socket.send(JSON.stringify(ponger))
                                }
                            } else {
                                if ( g_expected_response ) {
                                    g_expected_response.resolve(msg)
                                } else {
                                    interaction_info(msg)
                                }    
                            }
                        } catch (e) {}
                    }
                };
                
                socket.onclose = async (event) => {
                    if (event.wasClean) {
                    interaction_state('closed')
                    } else {
                    // try to re-open
                    if ( !opened ) {
                        interaction_state('error-server')
                    } else {
                        try {           // try to reconnect
                            g_app_web_socket = await web_socket_initializer(g_user_info,public_verify_key)
                            interaction_state('restored')    
                        } catch(error) {
                            interaction_state('fail-ws-no-recover')
                        }
                    }
                    }
                    clearTimeout(socket._pingTimeout);
                };
                
                socket.onerror = (error)  => {
                    if ( !opened ) {
                        interaction_state('error-server')
                        reject(error)
                    } else {
                        if ( g_expected_response ) { g_expected_response.reject(error) }
                        interaction_state('error-ws',error)
                    }
                };
                                
            })
            return p
        }
    } catch (e) {
        throw e
    }
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----



/// ADDING IN APPLICATION HELPERS HERE

function some_def(val) {
    if ( val === undefined ) return ""
    return val
}

function some_def_bool(val) {
    if ( val === undefined ) return false
    if ( typeof val === 'boolean' ) return val
    return !!(val)
}




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


const MANAGER_PAGE_TO_FRAME = "from-manager-to-frame"
const ID_MANAGER_ACTION_TO_FRAME = "id-presence-manager"
const FRAME_ACTION_REMOVE = "id-manager-remove-id"
const FRAME_ACTION_UPLOAD = "id-manager-upload-id"
const FRAME_ACTION_DOWNLOAD = "id-manager-download-id"
const FRAME_ACTION_DOWNLOAD_PUBLIC = "id-manager-download-public-intro"
const FRAME_MANAGE_PICTURE_ASSET = "manager-picture-asset"
const FRAME_ACTION_ATTACH = "manager-asset-attach"

const HOST_APP_PERSONALIZATION = "personalization"
const HOST_APP_WANTS_SESSION = "session-to-app"


// categories
const FRAME_COMPONENT_SAY_ALIVE = "q-alive"
const FRAME_COMPONENT_MANAGE_ID = "m-igid"
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
//
const HOSTED_APP_FILE_OPERATION = "yep-file-creation-db"
const FRAME_TO_HOSTED_APP_DATA = "yep-data-from-db"
const FRAME_LIST_DATA = "frame-lists-data-part-ids"
const FRAME_RETURNS_DATA = "frame-provides-data-part"
const FRAME_RETURNS_SESSION_CHECK = "frame-provides-session-check"

// PUBLISHER PAGE
const HOSTED_PUBLISHER_TO_FRAME = "publisher_to_frame"
const PUBLISHER_RELATES_TO_FRAME = "publisher_ask_frame_op"


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

//
let g_user_current_session = false
let g_current_user_id = false
let g_current_user_name = false
let g_current_pub_identity = false


const g_message_template =  {
                                "category" : "",
                                "direction" : "",
                                "action" : "",
                                "relationship" : ""
                            }


/// END OF CONSTANTS  (ALPHA)




// HOSTED APP PAGE COM
//
if ( typeof g_message_template === undefined ) {
    window.g_message_template = g_message_template = {
        "category" : "",
        "direction" : "",
        "action" : "",
        "relationship" : ""
    }
}

// constants in shared constants

let g_frame_page = window.parent

let hosted_page_application_handlers = (category,action,relationship,params) => {}



function responding_alive() {
    let message = {
        "category": FRAME_COMPONENT_SAY_ALIVE,
        "action" : FRAME_COMPONENT_RESPOND,
        "data" : false
    }
    tell_frame_page(message)
}


function install_frame_page_response() {
    g_gratis_negotiator.onmessage( (event) => {
        // let opener = event.source --- the site page is assumed to be the top level of the interactions
        try {
            let mobj = JSON.parse(event.data)
            let category = mobj.category
            let relationship = mobj.relationship
            let action = mobj.action
            let direction = mobj.direction
            //
            if ( direction === FRAME_PAGE_TO_PUBLISHER ) {
                if ( category === FRAME_COMPONENT_SAY_ALIVE ) {
                    if ( action === FRAME_COMPONENT_RESPONDING ) {
                        console.log("functioning")
                    }
                } else {
                    let params = mobj.data
                    hosted_page_application_handlers(category,action,relationship,params)
                }
            }
        } catch (e) {
        }    
    })
}


let injest_personalization = false
let injest_session = false
let application_specific_handlers = (category,action,relationship,params) => {}

let personalization = (post_params) => {}


hosted_page_application_handlers = async (category,action,relationship,params) => {
    switch ( category ) {
        case HOST_APP_PERSONALIZATION : {
            if ( typeof injest_personalization === "function" ) {
                await injest_personalization(action,params)
            }
            break;
        }
        case FRAME_TO_HOSTED_APP_SESSIONS : {          /// a hosted page that does not start a session.
            if ( typeof injest_session === "function" ) {
                await injest_session(action,params)
            }
            break;
        }
        default: {                  /// any other actions ... could be a login page that fetches a session
            await application_specific_handlers(category,action,relationship,params)
            break;
        }
    }
}


function tell_frame_page(message) {
    if ( !g_gratis_negotiator ) return(false)
    let msg = Object.assign({},g_message_template)
    msg.direction = HOSTED_PUBLISHER_TO_FRAME
    msg.relationship = PUBLISHER_RELATES_TO_FRAME
    msg.action = message.action
    msg.category = message.category
    msg.data = message.data
    let message_str = JSON.stringify(msg)
    g_gratis_negotiator.postMessage(message_str,'*')
    return true
}


// END OF HOSTED APP PAGE COM  (ALPHA)








application_specific_handlers = async (category,action,relationship,params) => {
		try {
			if ( category === FRAME_TO_APP_PUBLIC_COMPONENT ) {
				switch ( action ) {
					case FRAME_POSTED_PRIMARY: {
						let response = params.response
						if ( response ) {
							g_responder_tables["post-response"].resolver(response)
						} else {
							g_responder_tables["post-response"].rejector()
						}
						break
					}
					case FRAME_LIST_DATA: {
						if ( params && params.file_names ) {
							g_responder_tables["data-requests"].resolver(params.file_names)
						} else {
							g_responder_tables["data-requests"].rejector()
						}
						break
					}
					case FRAME_RAN_PUB_OP: {
						if ( params.op ) {
							g_responder_tables["data-requests"].resolver(params.op)
						} else {
							g_responder_tables["data-requests"].rejector()
						}
						break
					}
					case FRAME_RETURNS_DATA: {
						if ( params ) {
							g_responder_tables["data-requests"].resolver(params)
						} else {
							g_responder_tables["data-requests"].rejector()
						}
						break
					}
					case FRAME_RETURNS_SESSION_CHECK: {
						if ( params.active ) {
							g_responder_tables["session-check"].resolver(true)
						} else {
							g_responder_tables["session-check"].resolver(false)
						}
						break;
					}
				}
			}
		} catch (e) {
			console.log(e)
		}
	}



// MODULE: ????


const AUDIO_STREAMING_SERVICE = "https://www.popsongnow.com/audio/"
const VIDEO_STREAMING_SERVICE = "https://www.popsongnow.com/video/"
const IMAGE_STORAGE_SERVICE = "https://www.popsongnow.com/images/"

// 
//
// All of these make a link that will server the stored object given its placement into a p2p service cloud.
// The link may be filtered through a service worker that translates it into the p2p pathway such as ipfs.
//
function make_audio_upload_link(obj) {
	let file_name = obj.file_name
	let stream_link = AUDIO_STREAMING_SERVICE + file_name
	prep_upload_for(obj,upload_audio)
	return(stream_link)
}

function make_video_upload_link(obj) {
	let file_name = obj.file_name
	let stream_link = VIDEO_STREAMING_SERVICE + file_name
	prep_upload_for(obj,upload_video)
	return(stream_link)
}

function make_image_upload_link(obj) {
	let file_name = obj.file_name
	let stream_link = IMAGE_STORAGE_SERVICE + file_name
	prep_upload_for(obj,upload_image)
	return(stream_link)	
}




// MODULE: UPLOAD MEDIA (windowized)


const DEFINED_CHUNK_SIZE = 5000000
const DEFINED_MAX_SIZE = 9000000




// prep_upload_data
// 	-- if needed prepare the blob...  in any case separate the blob from the com object to send it later.
// 	-- return the com object and blob as a pair
//
async function prep_upload_data(obj,blob_already,protocol) {
	//
	let blob_data = ""
	//
	if ( !(blob_already) )  {
		try {
			let res = await fetch(obj.blob)
			blob_data = await res.blob()
		} catch(e) {
			return
		}
	} else {
		blob_data = blob_already
	}
	//
	if ( obj.blob !== undefined )  {
		delete obj.blob
	}
	obj.protocol = protocol ? protocol : 'p2p-default'
	obj.preamble_size = blob_data.size

	return [obj,blob_data]
}



//$>>	finalize_small_media_storage
async function finalize_small_media_storage(url,primary_response) {
	if ( primary_response.transition && primary_response.transition.token ) {
		let transaction_token = primary_response.transition.token
		let protocol = primary_response.elements.protocol
		let media_id = primary_response.elements.media_id
		let body = {
			"token" : transaction_token,
			"match" : "handshake",
		}
		body.protocol = protocol
		body.media_id = media_id   // maybe a checksum
		let secondary_resp =  await postData(url,body)
		return [protocol,media_id]
	}
	return [false,false]
}


//$>>	finalize_media_storage
//                                                  <<depends>> postData
//	There are likely faster ways of sending the data. But, this way requires some permission and safe guarding by the server sid.
//	sending multi part form data . The blob list is actually file objects 
async function finalize_media_storage(url,primary_response,formdata,blob,obj) {
	//
	let secondary_resp = primary_response
	//
	if ( primary_response.transition && primary_response.transition.token ) {	// A token has to be associated with the transaction
		//
		if ( formdata === false ) {
			formdata = new FormData()
			for ( let ky in obj ) {
				formdata.append(ky, obj[ky])
			}
		}
		let transaction_token = secondary_resp.transition.token		// call the transition token the transaction_token
		let protocol = obj.protocol ? obj.protocol : 'p2p-default'				// These fields have no real value until the end, but are always checked in case they may be used for security.
		let media_id = ""
		//
		formdata.set("protocol",protocol)				// Most likely ipfs ... 
		formdata.set("media_id",media_id)				// not set until the storage system can identify 
		formdata.set("token",transaction_token)
		formdata.set("match","upload-next")				// tell the server that you are sending one chunk after another
		formdata.set("next",true)  // NEXT
		formdata.set("_t_match_field",obj.file_name)
		//
		let size_end = blob.size						// total length of the data in flight
		let start = 0;
		let span = DEFINED_CHUNK_SIZE					// application generation sets this (tuning upstream)
		let num_sends = Math.floor(size_end/span) + 1	// size/chunk_size
		//
		for ( let i = 0; i < num_sends; i++ ) {			// the number of times this is called is determined by the client
			//
			let start = i*span
			let end = Math.min((i+1)*span,size_end)
			let blob_part = blob.slice(start,end)  				// next part of the blob
			formdata.set('media_file', new Blob([blob_part]),obj.file_name)
			secondary_resp = await postData(url,formdata, 'omit',false,'multipart/form-data')  // send it as a separate file
			//
			if ( (secondary_resp.OK !== "true") && (secondary_resp.OK !== "true") ) {
				break;			// This last send failed. Bailout  (If failed, the server will shutdown the communication)
			}
		}
		//
		if ( (secondary_resp.OK === "true") || (secondary_resp.OK === "true") ) {						// The last send was good.
			let body = {
				"token" : transaction_token,
				"match" : "complete",
				"_t_match_field" : obj.file_name,
				"file" : { "name" : obj.file_name },
				"next"	: false		// NO NEXT
			}
			secondary_resp =  await postData(url,body)			// Tell the server that this transaction is done...
			if ( secondary_resp && secondary_resp.state ) {
				let elements = secondary_resp.state.elements			// The good stuff is returned in a state field 
				if ( elements ) {
					protocol = elements.protocol  // final hash and provider returned in state (same as for the shor but in the state field)
					media_id = elements.media_id
				}
			}
		}
		//
		return [protocol,media_id]
	}
	return [false,false]
}



//$>>	finalize_media_array_storage
//                                                  <<depends>> postData
//	There are likely faster ways of sending the data. But, this way requires some permission and safe guarding by the server sid.
//	sending multi part form data . The blob list is actually file objects 
async function finalize_media_array_storage(url,primary_response,formdata,blob_list,obj) {
	//
	let secondary_resp = primary_response
	//
	// TOKEN ->
	if ( primary_response.transition && primary_response.transition.token ) {	// A token has to be associated with the transaction
		//
		// include extra (not default) fields and elements
		if ( formdata === false ) {		// sending as a file form
			formdata = new FormData()
			for ( let ky in obj ) {
				formdata.append(ky, obj[ky])
			}
		}
		let transaction_token = secondary_resp.transition.token		// call the transition token the transaction_token
		let protocol = obj.protocol ? obj.protocol : 'p2p-default'				// These fields have no real value until the end, but are always checked in case they may be used for security.
		let media_id = ""
		//
		formdata.set("protocol",protocol)				// Most likely ipfs ... 
		formdata.set("media_id",media_id)				// not set until the storage system can identify 
		formdata.set("token",transaction_token)
		formdata.set("match","upload-next")				// tell the server that you are sending one chunk after another
		formdata.set("next",true)  // NEXT
		formdata.set("_t_match_field",obj.file_name)
		//

		let max_num_sends = 0
		let blob_pars = blob_list.map( blob => {
			let size_end = blob.size						// total length of the data in flight
			let start = 0;
			let span = DEFINED_CHUNK_SIZE					// application generation sets this (tuning upstream)
			let num_sends = Math.floor(size_end/span) + 1	// size/chunk_size
			max_num_sends = (num_sends > max_num_sends) ?  num_sends : max_num_sends
			return {
				blob, size_end, start, span, num_sends
			}
		})
		// 
		//
		for ( let i = 0; i < max_num_sends; i++ ) {			// the number of times this is called is determined by the client
			//
			for ( let blob_dscr of blob_pars ) {
				if ( blob_dscr.num_sends === 0 ) continue
				let blob = blob_dscr.blob
				let span = blob_dscr.span
				let start = span*i
				let size_end = blob_dscr.size_end
				let end = Math.min((i+1)*span,size_end)

				let blob_part = blob.slice(start,end)  				// next part of the blob
				formdata.set('media_file', new Blob([blob_part]), blob_dscr.file_name)
				blob_dscr.num_sends--
			}
			//
			// POST chunk wrapped in a Form descriptor
			secondary_resp = await postData(url,formdata, 'omit',false,'multipart/form-data')  // send it as a separate file
			//
			if ( (secondary_resp.OK !== "true") && (secondary_resp.OK !== true) ) {
				break;			// This last send failed. Bailout  (If failed, the server will shutdown the communication)
			}
		}
		//
		if ( (secondary_resp.OK === "true") || (secondary_resp.OK === true) ) {						// The last send was good.
			// SEND LAST CHUNK
			let body = {
				"token" : transaction_token,
				"match" : "complete",
				"_t_match_field" : obj.file_name,
				"file" : { "name" : obj.file_name },
				"next"	: false		// NO NEXT
			}
			// postData
			secondary_resp =  await postData(url,body)			// Tell the server that this transaction is done...
			let elements = secondary_resp.state		// The good stuff is returned in a state field 
			protocol = elements.protocol  // final hash and provider returned in state (same as for the shor but in the state field)
			media_id = elements.media_id
		}
		//
		return [protocol,media_id]   // this will be for tracking, etc.
	}
	return [false,false]
}



//$>>	finalize_media_array_storage_deep_json
//                                                  <<depends>> postData
// sending json with a layerd structure (includes meta field)
// this is distinguished from the other methods that expect a file object to be used as multipart form data...
// not sedning multi-part form data
//	There are likely faster ways of sending the data. But, this way requires some permission and safe guarding by the server sid.
async function finalize_media_array_storage_deep_json(url,token,primary_response,formdata,blob_list,postable) {
	//
	let secondary_resp = primary_response
	//
	// TOKEN ->
	if ( primary_response.transition && primary_response.transition.token ) {	// A token has to be associated with the transaction
		//
		// include extra (not default) fields and elements
		if ( formdata === false ) {		// sending as a file form
			formdata = {}
			for ( let ky in postable ) {
				if ( ky === 'meta' ) continue
				formdata[ky] = postable[ky]
			}
		}
		let transaction_token = token		// call the transition token the transaction_token
		let protocol = postable.protocol ? postable.protocol : 'p2p-default'				// These fields have no real value until the end, but are always checked in case they may be used for security.
		let media_id = ""
		formdata.json_chunks = true
		//
		formdata.protocol = protocol					// Most likely ipfs ... 
		formdata.media_id = media_id					// not set until the storage system can identify 
		formdata.token = transaction_token
		formdata.match = "upload-next"					// tell the server that you are sending one chunk after another
		formdata.next = true
		formdata._t_match_field = postable.file_name
		//
		let max_num_sends = 0
		let blob_pars = blob_list.map( blob_descr => {
			let blob = blob_descr.blob_url
			let name = blob_descr.name
			let size_end = blob.length						// total length of the data in flight
			let start = 0;
			let span = DEFINED_CHUNK_SIZE					// application generation sets this (tuning upstream)
			let num_sends = Math.floor(size_end/span) + 1	// size/chunk_size
			max_num_sends = (num_sends > max_num_sends) ? num_sends : max_num_sends
			return {
				blob, name, size_end, start, span, num_sends
			}
		})
		// 
		let media_meta = postable.meta
		//
		for ( let i = 0; i < max_num_sends; i++ ) {			// the number of times this is called is determined by the client
			//
			formdata.media_parts = {}
			for ( let blob_dscr of blob_pars ) {
				if ( blob_dscr.num_sends === 0 ) continue
				let blob = blob_dscr.blob
				let span = blob_dscr.span
				let start = span*i
				let size_end = blob_dscr.size_end
				let end = Math.min((i+1)*span,size_end)
				//
				let blob_part = blob.slice(start,end)  				// next part of the blob
				formdata.media_parts[blob_dscr.name] = blob_part
				blob_dscr.num_sends--
			}
			//
			// POST chunk wrapped in a Form descriptor
			secondary_resp = await postData(url,formdata,'omit')	//	the blob_url will be sent as part of the JSON object
			//
			if ( (secondary_resp.OK !== "true") && (secondary_resp.OK !== true) ) {
				break;			// This last send failed. Bailout  (If failed, the server will shutdown the communication)
			}
		}
		//
		if ( (secondary_resp.OK === "true") || (secondary_resp.OK === true) ) {						// The last send was good.
			// SEND LAST CHUNK
			let body = {
				"token" : transaction_token,
				"match" : "complete",
				"file_list" : blob_list,
				"_t_match_field" : postable.file_name,
				"file" : { "name" : postable.file_name },
				"next"	: false		// NO NEXT
			}
			// postData
			secondary_resp =  await postData(url,body)			// Tell the server that this transaction is done...
			let elements = secondary_resp.state		// The good stuff is returned in a state field 
			protocol = elements.protocol  // final hash and provider returned in state (same as for the shor but in the state field)
			media_id = elements.media_id
		}
		//
		return [protocol,media_id]   // this will be for tracking, etc.
	}
	return [false,false]
}




//$>>	upload_small
//                                                  <<depends>> postData,finalize_small_media_storage
async function upload_small(url,obj,blob_already) {			// 	obj.media_type  // data:[<MIME-type>][;charset=<encoding>][;base64],<data>
	//
	let [com_obj,blob_data] = await prep_upload_data(obj,blob_already,'p2p-default')
	//
	let formdata = new FormData()
	for ( let ky in com_obj ) {
		formdata.append(ky, com_obj[ky])
	}
	formdata.append('media_file', new Blob([blob_data]), obj.file_name)
	//
	// in the small versions, the file is sent immediately. No preamble
	//
	let primary_response =  await postData(url,formdata,'omit',false,'multipart/form-data')
	if ( primary_response.OK === "true" ) {
		let media_store_characteristics = await finalize_small_media_storage(primary_response)
		return media_store_characteristics
	} else {
		return [false, false]
	}
}

//$>>	upload_big
//                                                  <<depends>> postData,finalize_media_storage
async function upload_big(url,obj,blob_already) {
	//
	let [com_obj,blob_data] = await prep_upload_data(obj,blob_already,'p2p-default')
	//
	let formdata = new FormData()
	for ( let ky in com_obj ) {
		formdata.append(ky, com_obj[ky])
	}
	//
	// in the large versions, a preamble is sent with the size of the data. No data is sent in the first message
	//
	let primary_response = await postData(url,formdata,'omit',false,'multipart/form-data')
	//
	if ( primary_response.OK === "true" ) {		// If the system can handle the request, start a cycle of sends
		let media_store_characteristics = await finalize_media_storage(primary_response,formdata,blob_data,obj)
		return media_store_characteristics
	} else {
		return [false, false]
	}
}





	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----



	let g_responder_tables = {
		"post-response" : {
			"resolver" : false,
			"rejector" : false
		},
		"data-requests" : {
			"resolver" : false,
			"rejector" : false
		},
		"session-check" : {
			"resolver" : false,
			"rejector" : false
		}
	}

	function promise_handling(source_name) {
		if ( g_responder_tables[source_name] !== undefined ) {  // do we implement this entry?
			let p = new Promise((resolve,reject) => {
				g_responder_tables[source_name].resolver = (resp_obj) => {
					g_responder_tables[source_name] = {
						"resolver" : false,
						"rejector" : false            
					}
					resolve(resp_obj)
				}
				g_responder_tables[source_name].rejector = () => {
					g_responder_tables[source_name] = {
						"resolver" : false,
						"rejector" : false            
					}
					reject(false)
				}
			})
			return p    
		}
		return false
	}



	let g_app_path = "publisher"
	let g_uploader_path = "uploaders"

	// g_app_path important to nginx configuration

	function get_transition_endpoint(endpoint) {
		let url = `${location.protocol}//${location.host}/${g_app_path}/transition/${endpoint}`
		return url
	}

	function get_secondary_transition_endpoint(endpoint) {
		let url = `${location.protocol}//${location.host}/${g_app_path}/secondary/transition`
		return url
	}

	function get_secondary_transition_uploader_endpoint(endpoint) {
		let url = `${location.protocol}//${location.host}/${g_uploader_path}/secondary/transition`
		return url
	}





// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


//$>>	gen_nonce
/*
// gen_nonce
// Parameters: optional parameter
// 	--	no parameter case
// 	--	generate a random vaue -- return it as string
// 	--	parameter (optional) : A base64url string that is at least 16 bytes
//		-- returns the the first bytes as a base64url string (for deriving an IV from data) Not random
// 
// Returns a nonce as a base64url string representing 16 bytes = 128 bits
*/
function gen_nonce(input_bits) {
	if ( input_bits === undefined ) {
		let random = g_crypto.getRandomValues(new Uint8Array(16))
		return to_base64_from_uint8array(random)
	} else {
		let bytes = from_base64_to_uint8array(input_bits)
		bytes = bytes.subarray(0, 16)
		return to_base64_from_uint8array(bytes)
	}
}



//$>>	pc_keypair_promise
//>--
// pc_keypair_promise
// Parameters: no parameters
// Returns: a Promise that resolves to an elliptic curve key using P-384 with sign and verify privileges
//  -- 
function pc_keypair_promise() {  // return 
    // Generate a local public/private key pair
    let p =  g_crypto.generateKey({
            'name': "ECDSA",
            'namedCurve': "P-384"
        },
        true,
        ["sign", "verify"]
    )
    return p  // promise
}
//-


//$>>	axiom_keypair_promise
//>--
// axiom_keypair_promise
// Parameters: no parameters
// Returns: a Promise that resolve to an elliptic curve key using P-384 with cipher key derivation privileges. Allows for deriving AES 256 cipher key
//  -- 
function axiom_keypair_promise() {
    // Generate a local public/private key pair
    let p =  g_crypto.generateKey({
            'name': "ECDH",
            'namedCurve': "P-384"
        },
        true,
        ["deriveKey"]
    )
    return p  // promise
}


//$>>	pc_wrapper_keypair_promise
//>--
// pc_wrapper_keypair_promise
// Parameters: no parameters
// Returns: a Promise that resolves to an RSA-OAEP key modulus 4096 hash to SHA-256 with wrapKey and unwrapKey privileges
//  -- 
function pc_wrapper_keypair_promise() {  // return 
    // Generate a local public/private key pair
    let p =  g_crypto.generateKey({
            name: "RSA-OAEP",
            modulusLength: 4096, //can be 1024, 2048, or 4096
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        },
        true,
        ["wrapKey","unwrapKey"]
    )
    return p  // promise
}
//--<



async function galactic_user_starter_keys(selector) {
	//
	let pub_key_str = false
	let priv_key_str = false
	if ( (selector === undefined) || (selector === "wrapper") ) {
		// Generate a local public/private key pair WRAPPER
		let keypair = await pc_wrapper_keypair_promise()
		// ---- ---- ---- ----
		let pub_key = keypair.publicKey
		let priv_key = keypair.privateKey
		// ---- ---- ---- ----                                      // g_nonce_buffer - space to use
		let exported = await g_crypto.exportKey("jwk",pub_key);
		pub_key_str = JSON.stringify(exported)

		let priv_exported = await g_crypto.exportKey("jwk",priv_key);
		priv_key_str =  JSON.stringify(priv_exported);
	}

	let sign_pub_key_str = false
	let sign_priv_key_str = false
	if ( (selector === undefined) || (selector === "signer") ) {
		// Generate a local public/private key pair SIGNER
		let signer_pair = await pc_keypair_promise()

		let signer_pub_key = signer_pair.publicKey
		let signer_priv_key = signer_pair.privateKey

		let sign_exported = await g_crypto.exportKey("jwk",signer_pub_key);
		sign_pub_key_str = JSON.stringify(sign_exported)

		let sign_priv_exported = await g_crypto.exportKey("jwk",signer_priv_key);
		sign_priv_key_str =  JSON.stringify(sign_priv_exported);
	}


	let axiom_pub_key_str = false
	let axiom_priv_key_str = false
	if ( (selector === undefined) || (selector === "derive") ) {
		// Generate a local public/private key pair SIGNER
		let axiom_pair = await axiom_keypair_promise()

		let axiom_pub_key = axiom_pair.publicKey
		let axiom_priv_key = axiom_pair.privateKey

		let axiom_exported = await g_crypto.exportKey("jwk",axiom_pub_key);
		axiom_pub_key_str = JSON.stringify(axiom_exported)

		let axiom_priv_exported = await g_crypto.exportKey("jwk",axiom_priv_key);
		axiom_priv_key_str =  JSON.stringify(axiom_priv_exported);
	}
	
	//
	let key_info = {
		"pk_str" : pub_key_str,
		"priv_key" : priv_key_str,
		"signer_pk_str"  : sign_pub_key_str,
		"signer_priv_key" : sign_priv_key_str,
		"axiom_pk_str" : axiom_pub_key_str,
		"axiom_priv_key" : axiom_priv_key_str
	}

	if ( key_info.pk_str === false ) {
		delete key_info.pk_str
		delete key_info.priv_key
	}
	if ( key_info.signer_pk_str === false ) {
		delete key_info.signer_pk_str
		delete key_info.signer_priv_key
	}
	if ( key_info.axiom_pk_str === false ) {
		delete key_info.axiom_pk_str
		delete key_info.axiom_priv_key
	}

	return(key_info)
}





// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----



	// prep_send_new_entry
	async function prep_send_new_entry(data_hash,send_obj,link_meta) {
		// send the fields this knows about. Expect the human frame to handle a hash and security
		let postable = Object.assign(send_obj,{
			"topic" : "command-upload",
			"path" : "upload-media"			// dashboard is sending files... while others may send just JSON on the 'lite' path
		})
		//
		//
		let message = {
			"category": FRAME_ACTION_FROM_PUBLISHER,
			"action" : HOST_UP_REQ_UPLOAD,
			"data" : {
				"link" : get_transition_endpoint(link_meta.link),
				"hash" : data_hash,
				"postable" : postable
			}
		}
		tell_frame_page(message)  // ask for the primary transition to be handled by the human frame...
		//
		let primary_response = await promise_handling("post-response")
		return primary_response
	}



	async function send_new_entry(object_data_meta,link_meta,asset_type) {
		/*
		object_data_meta === { "meta" : good_data }  // search for>> "meta" : good_data
		*/
		if ( object_data_meta.meta.media && object_data_meta.meta.media.source ) {
			let blob_data = object_data_meta.meta.media.source.blob_url
			let blob_data_size = object_data_meta.meta.media.source.size
			if ( object_data_meta.meta.media.poster ) {
				blob_data_size += object_data_meta.meta.media.poster.size
			}
			//
			let com_obj = {
				protocol : 'p2p-default',
				preamble_size : blob_data_size  // send total size
			}
			com_obj = Object.assign(object_data_meta,com_obj)
			//
			// +  obj.protocol,  + obj.preamble_size    // { "meta" : good_data, "protocol" : - ,  "preamble_size" : - }
			let data_hash = await do_hash(blob_data)  // the file data of the main type of media (e.g. movie, sound, which might also upload an image)
			//   post data in here  (prep --- don't send the actual file... )

			let backup_media = {
				"source" : com_obj.meta.media.source ? com_obj.meta.media.source : undefined,
				"poster" : com_obj.meta.media.poster ? com_obj.meta.media.poster : undefined
			}

			// make copies of the media components
			com_obj.meta.media.source = Object.assign({},com_obj.meta.media.source)
			delete com_obj.meta.media.source.blob_url  // (prep --- don't send the actual file... )
			//
			if ( object_data_meta.meta.media.poster ) {
				com_obj.meta.media.poster = Object.assign({},com_obj.meta.media.poster)
				delete com_obj.meta.media.poster.blob_url   // (prep --- don't send the actual file... )
			}

			// TELL THE FRAME THAT YOU ARE ABOUT TO UPLOAD DATA (and need a ticket)
			let primary_response = await prep_send_new_entry(data_hash,com_obj,link_meta)
			//
			if ( primary_response.OK == "true" ) {
				let upload_keys = primary_response.elements  // should be produced by publication handling
				let postable = Object.assign(com_obj,{
					"token" : primary_response.token,		// primary action token (key to secondary)
					"asset_type" : asset_type,
					"sign" : upload_keys.sign,
					"hash" : data_hash
				})
				// --- backup_media -- the blobs should be loaded (later -- maybe sliceable)
				let blob_list = []
				if ( backup_media.source ) blob_list.push(backup_media.source)
				if ( backup_media.poster ) blob_list.push(backup_media.poster)
				//
				let link = get_secondary_transition_uploader_endpoint(link_meta.secondary_link)
				//
				let token = primary_response.elements.token
				//  , primary_response -> original respone, false -> will make FromData, blob_data -> one file, 
				let media_store_characteristics = await finalize_media_array_storage_deep_json(link,token,primary_response,false,blob_list,postable)
				
				return media_store_characteristics
			}
		}

		return [false,false]
		//
	}



	async function send_publication_command(command,object_data_meta,link_meta) {
		let data_hash = do_hash(object_data_meta)
		//
		let postable = Object.assign(object_data_meta,{
			"topic" : `command-${command}`,
			"path" : "upload-media",
			"file_name" : data_hash
		})
		//
		let message = {
			"category": FRAME_ACTION_FROM_PUBLISHER,
			"action" : HOST_UP_REQ_UPLOAD,
			"data" : {
				"link" : get_transition_endpoint(link_meta.link),
				"hash" : data_hash,
				"postable" : postable
			}
		}
		tell_frame_page(message)  // ask for the primary transition to be handled by the human frame...
		//
		let primary_response = await promise_handling("post-response")
		if ( primary_response.OK == "true" ) {
			return true
		} 
		return false
		//
	}



	async function app_run_file_op(file_obj,operation) {
		let message = {
			"category": FRAME_ACTION_FROM_PUBLISHER,
			"action" : HOSTED_APP_FILE_OPERATION,
			"data" : {
				"op" : operation,
				"file" : file_obj
			}
		}
		//
		tell_frame_page(message)  // ask for the primary transition to be handled by the human frame...
		//
		try {
			let file_info = await promise_handling("data-requests")
			return file_info
		} catch (e) {
			console.log(e)
		}
		return false
	}

let g_ui_data = new DataFromUi()
let g_proxy = new Proxy()

///

// field_data :: in the following, field_data is a map of fields ids to DOM element objects. 
// values will be read in from those fields
// calculation on values will be handled by gather_fields
// FILES: two fields will refer to the DOM element for file uploaders. 
//		-- rec-file-name	--- likely a media file e.g. mp3, mov, etc.
//		-- rec-poster-name   --- likely an image file that will be displayed

//
// ---- create_entry ---- ---- ---- ---- ---- ---- ----
async function create_entry(field_data) {
    if ( field_data ) {
        let good_data = await g_ui_data.gather_fields(field_data)  // puts the upload file into the structure
        if ( good_data ) {
            let t_num = await g_proxy.new_entry(good_data)
            return t_num /// for placement into display				
        }
        return false
    }
}




//
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
let g_punctuation = ".,;:\'\"~\~\`@#$%^&*()+=|\\][}{?/><"

function ispunct(c,add_dash) {
    let is = (g_punctuation.indexOf(c) >= 0 )
    if ( !(is) && add_dash ) {
        is = (c == '-' || c == '_')
    }
    return is
}

function trim_punct(key,add_dash) {
    while ( (key.length > 0) && ispunct(key[0],add_dash) ) {
        key = key.substr(1)
    }
    while ( (key.length > 0) && ispunct(key[key.length - 1],add_dash) ) {
        key = key.substr(0,(key.length - 1))
    }
    return(key)
}



class DataFromUi {

    constructor() {
        this._user_id = false
        this._current_asset_history = false
        this._current_asset_prev_text = ""
        this._current_asset_text_ucwid_info = false
    }

    get_file(name,file_record) {
        //
        if ( name.length ) {
            if ( file_record.blob ) {
                let basename = name.substring(0,name.lastIndexOf('.'))
                let ext = name.replace(basename + '.','')
                let loaded = {
                    "blob_url" : file_record.blob,
                    "name" : basename,
                    "ext" : ext,
                    "mtype" : file_record.type,
                    "size" : file_record.size,
                    "file" : {
                        "lastModified" : file_record.lastModified
                    }
                }
                return loaded
            }
        }
        //
        return false
    }

    set_user_id(uid) {
        this._user_id = uid
    }

    //  ----  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    async gather_fields(field_vars) {
        //
        if ( this._user_id === false ) {
            return false
        }
        //
        let upload_record = {}
        try {
            let asset_pair = field_vars['rec-file-mtype']
            let title = field_vars['rec-title']
            let subject = field_vars['rec-subject']
            let keys = field_vars['rec-keys']
            let abstract = field_vars['rec-abstract']
            let full_text = field_vars['rec-full-text']
            //
            let paid = field_vars['paid-checkbox']
            let WIP = field_vars['WIP-checkbox']
            let contract = field_vars['rec-contract']
            //
            let name = field_vars['rec-file-name']
            let file_proper = field_vars['rec-file-proper']
            let poster = field_vars['rec-poster-name']
            let poster_file_proper = field_vars['rec-poster-proper']
            //
            let been_published = field_vars['rec-was-published']
            let uploaded = field_vars['rec-was-uploaded']
            //
            if ( title.length === 0 ) return false
            if ( subject.length === 0 ) return false
            if ( asset_pair.length === 0 ) return false
            let [asset_type,media_type] = asset_pair.split('/')
            /*
                stream/audio
                stream/video
                stream/image
                blog/text
                music_buzz/text
            */
            let media_data = await this.get_file(name,file_proper)
            let poster_data = await this.get_file(poster,poster_file_proper)        // file names for stream type media

            if ( (media_type !== 'text') && (media_data === false) && (poster === false) ) {
                return false
            }
            if ( ( media_type === 'text' ) && ( full_text.length === 0 ) ) {
                return false
            } else if ( media_type !== 'text' ) {
                full_text = name
            }
            //
            let modDate = media_data ? media_data.file.lastModified : ( poster_data ? poster_data.file.lastModified : Date.now())
            //
            keys = keys.split(' ').filter( key => {
                let ok = (key !== undefined)
                if ( ok ) ok = (key.length > 2)
                return ok
            })
            keys = keys.map(key => {
                key = trim_punct(key)
                key = key.trim()
                return(key)
            })
            keys = keys.filter( key => {
                let ok = (key !== undefined)
                if ( ok ) ok = (key.length > 2)
                return ok
            })
            keys = keys.map(key => {
                key = encodeURIComponent(key)
                return(key)
            })
            //
            let tracking = field_vars["asset-id"]  // if it has been created
            this._author_tracking = ""

            //
            let exclusion_fields = [
                "_history","_prev_text",
                "_transition_path", "encode",
                "media.poster.ucwid_info", "media.source.ucwid_info",
                "media.poster.protocol", "media.source.protocol",
                "media.poster.ipfs", "media.source.ipfs"
            ]
            let repository_fields = [ "media.source", "media.poster" ]  // field that contain id's useful to pin object at the server
            //
            upload_record = {
                "_tracking" : tracking,             // tracking of the asset
                "_id" :  this._user_id,             // should be a UCWID
                "_author_tracking" :  this._author_tracking,
                "_paid" : paid,
                "_contract" : contract,
                "_work_in_progress" : WIP,
                "_transition_path" : "asset_path",
                "asset_path" : `${tracking}+${asset_type}+${this._user_id}`,
                "title" : encodeURIComponent(title),
                "subject" : encodeURIComponent(subject),
                "keys" : keys,
                "asset_type" : asset_type,        // blog, stream, link-package, contact, ownership, etc...
                "media_type" : media_type,        // text, audio, video, image
                "abstract" : encodeURIComponent(abstract),
                "published" :  been_published,
                "uploaded" : uploaded,
                "media" : {
                    "poster" : poster_data,
                    "source" : media_data
                },
                "encode" : true,
                "txt_full" : encodeURIComponent(full_text),
                "dates" : {
                    "created" : Date.now(),
                    "updated" : modDate
                },
                "_history" : this._current_asset_history ? this._current_asset_history : [],
                "_prev_text" : this._current_asset_prev_text,
                "text_ucwid_info" : this._current_asset_text_ucwid_info,
                "repository_fields" : repository_fields,
                "exclusion_fields" : exclusion_fields
            }
            this._current_asset_history = false   // reset it when it is retrieved
            //    
        } catch (e) {
            return false
        }

        return(upload_record)
    }

    //  ----  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    async gather_identifying_fields(field_vars) {
        //
        if ( this._user_id === false ) {
            return false
        }
        //
        let upload_record = {}
        try {
            let tracker = field_vars['asset-id']
            let asset_pair = field_vars['rec-file-mtype']
            if ( asset_pair.length === 0 ) return false
            //
            let [asset_type,media_type] = asset_pair.split('/')
            /*
                stream/audio
                stream/video
                stream/image
                blog/text
                music_buzz/text
            */
            //
            //
            let tracking = ""       // if it has been created
            if ( tracker ) {
                let t = tracker.value
                if ( t.length ) tracking = t
                else return false
            }

            let paid = field_vars['paid-checkbox']
            let WIP = field_vars['WIP-checkbox']
            let contract = field_vars['rec-contract']

            //
            let exclusion_fields = [  // fields excluded from searching services.
                "_history","_prev_text",
                "_transition_path", "encode",
                "media.poster.ucwid_info", "media.source.ucwid_info",
                "media.poster.protocol", "media.source.protocol",
                "media.poster.ipfs", "media.source.ipfs"
            ]

            //
            upload_record = {
                "_tracking" : tracking,
                "_id" :  this._user_id,
                "_paid" : paid,
                "_contract" : contract,
                "_work_in_progress" : WIP,
                "_transition_path" : "asset_path",
                "asset_path" : `${tracking}+${asset_type}+${this._user_id}`,
                "asset_type" : asset_type,        // blog, stream, link-package, contact, ownership, etc...
                "media_type" : media_type,
                "exclusion_fields" : exclusion_fields
            }
            //
        } catch (e) {
            return false
        }

        return(upload_record)
    }

    async gather_asset_fields(field_vars) {
        //
        let upload_record = {}
        try {
            let asset_id = field_vars['asset-id']
            upload_record._id = asset_id
        } catch (e) {
            return false
        }
        return upload_record
    }

}




class Proxy {


    constructor() {

        //
        this.new_entry_link = {
            "link" : "",
            "secondary_link" : ""
        }
        this.get_entry_link = {
            "link" : "",
            "secondary_link" : ""
        }
        this.update_entry_link = {
            "link" : "",
            "secondary_link" : ""
        }

        this.delete_entry_link = {
            "link" : "",
            "secondary_link" : ""
        }
        this.publish_entry_link = {
            "link" : "",
            "secondary_link" : ""
        }
        this.unpublish_entry_link = {
            "link" : "",
            "secondary_link" : ""
        }
        this.get_user_ready_link = {
            "link" : "",
            "secondary_link" : ""
        }

    }

    set_links(link_conf) {
        this.new_entry_link = {
            "link" : some_def(link_conf.new_entry.link),
            "secondary_link" : some_def(link_conf.new_entry.secondary_link)
        }
        this.get_entry_link = {
            "link" : some_def(link_conf.get_entry.link),
            "secondary_link" : some_def(link_conf.get_entry.secondary_link),
        }
        this.update_entry_link = {
            "link" : some_def(link_conf.update_entry.link),
            "secondary_link" : some_def(link_conf.update_entry.secondary_link),
        }

        this.delete_entry_link = {
            "link" : some_def(link_conf.delete_entry.link),
            "secondary_link" : some_def(link_conf.delete_entry.secondary_link),
        }
        this.publish_entry_link = {
            "link" : some_def(link_conf.publish_entry.link),
            "secondary_link" : some_def(link_conf.publish_entry.secondary_link),
        }
        this.unpublish_entry_link = {
            "link" : some_def(link_conf.unpublish_entry.link),
            "secondary_link" : some_def(link_conf.unpublish_entry.secondary_link),
        }
        this.get_user_ready_link = {
            "link" : some_def(link_conf.get_user.link),
            "secondary_link" : some_def(link_conf.get_user.secondary_link),
        }
    }

    async new_entry(good_data) {
        // to transitions 
        let uploadable = {
            "meta" : good_data		// good data already has urls for BLOBs representing the media to upload
            // file entries, etc/	
        }
        let [result,pid] = await send_new_entry(uploadable,this.new_entry_link,good_data.asset_type)
        if ( result.status === "OK" ) {
            return result.tracker
        }
    }


    async get_entry(good_data) {
        let uploadable = {
            "meta" : good_data
            // file entries, etc/	
        }
        let result = await send_publication_command("get",uploadable,this.get_entry_link)
        if ( result.status === "OK" ) {
            return result.tracker
        }
    }

    async update_entry(good_data) {
        good_data.update = true   // something better?
        let uploadable = {
            "meta" : good_data
            // file entries, etc/	
        }
        let [result,pid] = await send_new_entry(uploadable,this.update_entry_link,good_data.asset_type)
        if ( result.status === "OK" ) {
            return result.tracker
        }
    }

    async delete_entry(good_data) {
        let uploadable = {
            "meta" : good_data
            // file entries, etc/	
        }
        let result = await send_publication_command("get",uploadable,this.delete_entry_link)
        if ( result.status === "OK" ) {
            return result.tracker
        }
    }

    async publish_entry(good_data) {
        let uploadable = {
            "meta" : good_data
            // file entries, etc/	
        }
        let result = await send_publication_command("publish",uploadable,this.publish_entry_link)
        if ( result.status === "OK" ) {
            return result.tracker
        }
    }

    async unpublish_entry(good_data) {
        let uploadable = {
            "meta" : good_data
            // file entries, etc/	
        }
        let result = await send_publication_command("unpublish",uploadable,this.unpublish_entry_link)
        if ( result.status === "OK" ) {
            return result.tracker
        }
    }

}



