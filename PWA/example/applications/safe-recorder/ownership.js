
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




// ---->>>
// MODULE: ONE TABLE(windowized)

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

//>>  AppDBWrapper


// In the following line, you should include the prefixes of implementations you want to test.
self.indexedDB = self.indexedDB || self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB;
// DON'T use "var indexedDB = ..." if you're not in a function.
// Moreover, you may need references to some self.IDB* objects:
self.IDBTransaction = self.IDBTransaction || self.webkitIDBTransaction || self.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
self.IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange || self.msIDBKeyRange;
// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)


/*

// autoIncrement set to true  (for this special case DB use )

DB_VERSION
DATA_STORE
describe_data

*/


function warn(str) {
    //
}


// a session is a project...
// a session object (sessionObject) is stored in the DB and may contain parts of data
// part_id identifies a part of the data (e.g. a layer or a component)

class AppDBWrapper {

    constructor(name,conf) {
        this._can_process_db = true
        if ( !(window.indexedDB) ) {
            this._can_process_db = false
            console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
        }
        //
        let self = this
        // DATA_STORE
        // DB_VERSION
        // describe_data
        if ( conf ) {
            for ( let ky in conf ) {
                self[ky] = conf[ky]
            }    
        }
        //
        this.db = false
        this.current_session_name = 'none'
        this._session_name_list = []
        this.name = name
        //
    }


    set session_name(name) {
        this.current_session_name = name
    }

    get session_name() {
        return this.current_session_name
    }

    get name_list() {
        return this._session_name_list
    }

    // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

    init_database() {
        //
        if ( !(this._can_process_db) ) return false
        let self = this
        let db_name = this.name
        //
        let p = new Promise((resolve,reject) => {

            let request = window.indexedDB.open(db_name, this.DB_VERSION);
            //
            // <-- onerror
            request.onerror = (event) => {
                alert(`This web app will not store ${this.describe_data} without the use of computer storage.`)
            };
            
            // <-- onsuccess
            request.onsuccess = (event) => {
                //
                let db = event.target.result;
                db.onerror = (event) => {
                    console.log("Database error: " + event.target.error);
                    reject(event.target.error)
                };
                //
                self.db = db;
                resolve(db)
            }

            // <-- onupgradeneeded
            request.onupgradeneeded = (event) => {
                //
                let db = event.target.result;
                //
                if ( this.DATA_STORE !== undefined ) {
                    try {
                        let sessionObjectStore = db.createObjectStore(this.DATA_STORE, { autoIncrement : true });
                        sessionObjectStore.createIndex("name", "name", { unique: true });
                        sessionObjectStore.createIndex("sess_date_time", "sess_date_time", { unique: true });
                    } catch (e) {
                    }
                }
                if ( this.COMPLETION_STORE !== undefined ) {
                    try {
                        let completeStore = db.createObjectStore(this.COMPLETION_STORE, { autoIncrement : false, keyPath: 'name' });
                        completeStore.createIndex("name", "name", { unique: true });
                    } catch (e) {
                    }
                }

            //
            };
        })  // end of promise
        //
        return p
    }


    // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

    //      load_name_list
    // -- 
    load_name_list() {
        if ( !(this.db) ) return
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readonly");
        let dataStore = transaction ? transaction.objectStore(this.DATA_STORE) : false
        //
        if ( !(dataStore) ) return false
        let p = new Promise((resolve,reject) => {
            this._session_name_list = []
            let myIndex = dataStore.index('name');
            myIndex.openCursor().onsuccess = (event) => {
                let cursor = event.target.result;
                if ( cursor ) {
                    this._session_name_list.push(cursor.value.name)
                    this.application_total_entry(cursor.value)
                    cursor.continue();
                } else {
                    this.application_update_session_name_selections(this.current_session_name,this._session_name_list)
                    resolve(true)
                }
            }
        })
        //
        return p
    }

    // _apply_find_by_name
    //  -- a generic that calls success_callback when an element matches the index, or not_found_callback otherwise.
    //
    _apply_find_by_name(sess_name, store, success_callback, not_found_callback) {
        let nameIndex = store.index('name');
        nameIndex.get(sess_name).onsuccess = (evt) => {
            let value = evt.target.result;
            if ( value ) {
                if ( success_callback ) success_callback(value,nameIndex);
            } else {
                if ( not_found_callback ) not_found_callback();
            }
        };
    }

    // _add_session_to_db
    //  -- adds the session object to the db, sets up the basic fields... 
    //
    _add_session_to_db(dataStore,application_op,part_id) {
        //
        let sessionObj = {
            'name' : this.current_session_name,
            'sess_date_time' : '' + Date.now(),
            'data' : { },
            'hashes' : { },
            'edit_order' : []
        }
        //
        if ( part_id ) sessionObj.edit_order.push(part_id)
        //
        if ( (application_op !== undefined) && (typeof application_op === 'function') ) {
            application_op(sessionObj)
        }
        let request = dataStore.add(sessionObj);  // returning an async object to which handlers may be added
        return request
    }

    add_empty_session(name,application_op) {
        //
        if ( !(this._can_process_db) ) return false
        //
        if ( this.db === null ) {
          console.log("db not initialized :: remove_audio_data")
          return false;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.DATA_STORE);
        if ( !(dataStore) ) return false
        //
        this.current_session_name = name
        if ( application_op !== undefined ) {
            this._add_session_to_db(dataStore,application_op)
        } else {
            this._add_session_to_db(dataStore)
        }
    }

    //  update_session: 
    //      Parameters: sess_name -- A session or separate project or publication...
    //                  field --- the field to change (top level)
    //                  value --- set the field to this value
    //  returns: true if the session is available for update
    update_session(sess_name,field,value) {
        //
        if ( !(this._can_process_db) ) return false
        //
        if ( this.db === null ) {
          console.log("db not initialized :: get_data")
          return false;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.DATA_STORE);
        if ( !(dataStore) ) return false
        //
        let p = new Promise((resolve,reject) => {
          //
          // get_elem_callback
          let update_elem_callback = (value,dbIndex) => {          // element.name == sess_name exists
            //
            let keyRangeValue = IDBKeyRange.only(value.name);
            //
            dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
              let cursor = event.target.result;
              if ( cursor ) {
                //
                let sessionObj = cursor.value
                sessionObj[field] = value
                const request = cursor.update(sessionObj);
                request.onsuccess = async () => {
                    resolve(true)
                };

                request.onerror = (event) => {
                    resolve(false)
                }
              } else {
                resolve(false)
              }
            }
          }
          //
          // not_found_callback
          let not_found_callback = () => {                       // element.name == sess_name  NOT FOUND
            resolve(false)
          }
          //
          this._apply_find_by_name(sess_name, dataStore, update_elem_callback, not_found_callback)
        })
        //
        return p
    }


    // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

    // add_data -- 
    //  Parameters: blob_data -- data stored as part of the session
    //              session id could be a layer....
    add_data(blob_data,part_id) {
        if ( !(this._can_process_db) ) return false
        if ( !(this.db) ) {
          console.log(`db not initialized :: AppDBWrapper.add_data`)
          return;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.DATA_STORE);
        if ( !(dataStore) ) return false

        let p = new Promise((resolve,reject) => {
            let self = this
            // update_list_callback
            let update_list_callback = (value,dbIndex) => {     // if found update
                if ( !dbIndex || (typeof value === "undefined") ) {
                    resolve(false)
                    return;
                }
                let keyRangeValue = IDBKeyRange.only(value.name);
                dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                    let cursor = event.target.result;
                    if ( cursor ) {
                        // existing session 
                        let sessionObj = cursor.value
                        //
                        let blob_url = (typeof blob_data === 'string') ? blob_data : URL.createObjectURL(blob_data);
                        // map_id = part_id
                        // store revised data
                        sessionObj.data[part_id] = blob_data
                        // make sure the structure has been set up if not already
                        if ( sessionObj.hashes[part_id] === undefined ) {
                            sessionObj.hashes[part_id] = {}
                        }
                        if ( sessionObj.hashes[part_id].op_history === undefined ) {
                            sessionObj.hashes[part_id].op_history = []
                        }
                        // record the order in which sessions (layers) have been edited
                        sessionObj.edit_order.push(part_id)
                        //
                        // update IndexedDB
                        const request = cursor.update(sessionObj);
                        request.onsuccess = async () => {
                            try {
                                self.application_data_update(blob_url,part_id,blob_data,part_id)  // application handling of data e.g visual rep
                            } catch (e) {
                                console.log(e)
                            } finally {
                                resolve(true)
                            }
                        };

                        request.onerror = (event) => {
                            resolve(false)
                        }
                        //
                    } else {
                        resolve(false)
                    }
                }
            }
            // add_new_callback
            let add_new_callback = () => {          // if not found add a new one
                //
                let blob_url = (typeof blob_data === 'string') ? blob_data : URL.createObjectURL(blob_data);
                //
                let application_op = (sessionObj) => {
                    //
                    sessionObj.data[part_id] = blob_data
                    if ( sessionObj.hashes[part_id] === undefined ) {
                        sessionObj.hashes[part_id] = {}
                    }
                    sessionObj.hashes[part_id].op_history = []
                    //
                } 
                //
                let request = self._add_session_to_db(dataStore,application_op,part_id)
                if ( request ) {
                    request.onsuccess = (event) => {
                        self.application_data_update(blob_url,part_id,blob_data)  // application handling of data e.g visual rep
                        resolve(true)
                    };
                    request.onerror = (event) => {
                        resolve(false)
                    }
                }
                //
            }
            //
            this._apply_find_by_name(this.current_session_name, dataStore, update_list_callback, add_new_callback)    
        })
        //
        return p
    }


    // update_data

    update_data(blob_data,part_id,op_parameters) {
        //
        if ( !(this._can_process_db) ) return false
        //
        if ( this.db === null ) {
            console.log("db not initialized :: remove_audio_data")
            return false;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.DATA_STORE);
        if ( !(dataStore) ) return false

        let update_list_elem_callback = (value,dbIndex) => {
            let keyRangeValue = IDBKeyRange.only(value.name);
            dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                var cursor = event.target.result;
                if ( cursor ) {
                    let sessionObj = cursor.value
                    if ( sessionObj.data[part_id] != null ) {
                        let blob_url = URL.createObjectURL(blob_data);
                        sessionObj.data[part_id] = blob_data
                        // handle a case which should not happen
                        if ( sessionObj.hashes[part_id] === undefined ) {
                            sessionObj.hashes[part_id] = { 'op_history' : [] }
                        }
                        // update hash ops
                        let operation = this.app_pre_update_action(blob_data,part_id,op_parameters)
                        if ( !operation ) {
                            operation = {'op' : 'backup'}
                        }
                        sessionObj.hashes[part_id].op_history.push(operation)
                        //
                        const request = cursor.update(sessionObj);
                        request.onsuccess = async () => {
                            this.app_post_update_action(blob_data,part_id,blob_url)
                        };
                    }
                    //
                }
            }
        }

        let not_found_callback = () => {
            warn(`The session ${sess_name} is not in the database`)
        }

        //
        this._apply_find_by_name(this.current_session_name, dataStore, update_list_elem_callback, not_found_callback)    
    }


    // update_data_ops

    update_data_ops(part_id,pre_update,post_update) {
        //
        if ( !(this._can_process_db) ) return false
        //
        if ( this.db === null ) {
            console.log("db not initialized :: remove_audio_data")
            return false;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.DATA_STORE);
        if ( !(dataStore) ) return false
        //
        let p = new Promise((resolve,reject) => {
            let self = this

            let add_elem_original_chunks_callback = (value,dbIndex) => {
                let keyRangeValue = IDBKeyRange.only(value.name);
                    dbIndex.openCursor(keyRangeValue).onsuccess = async (event) => {
                    var cursor = event.target.result;
                    if ( cursor ) {
                        let sessionObj = cursor.value
                        await pre_update(part_id,sessionObj)
                        const request = cursor.update(sessionObj);
                        request.onsuccess = async () => {
                            await post_update(part_id,this.current_session_name,sessionObj)
                            resolve(true)
                        };
                    }
                    resolve(false)
                }
            }
            //
            let not_found_callback = () => {
                warn(`The session ${sess_name} is not in the database`)
                resolve(false)
            }
            //
            this._apply_find_by_name(this.current_session_name, dataStore, update_list_elem_callback, not_found_callback)    

        })

        return p
    }



    //  remove_data: 
    //      Parameters: part_id -- remove a sections of the data kept by the session named sess_name
    //                  sess_name -- A session or separate project or publication...
    //
    remove_data(part_id,sess_name) {
        //
        if ( !(this._can_process_db) ) return false
        //
        if ( this.db === null ) {
          console.log("db not initialized :: remove_audio_data")
          return false;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.DATA_STORE);
        if ( !(dataStore) ) return false
        //

        let p = new Promise((resolve,reject) => {
            // remove_from_list_callback
            let remove_from_list_callback = async (value,dbIndex) => {
                let keyRangeValue = IDBKeyRange.only(value.name);
                dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                    let cursor = event.target.result;
                    if ( cursor ) {
                        let sessionObj = cursor.value
                        delete sessionObj.data[part_id]
                        //
                        const request = cursor.update(sessionObj);
                        request.onsuccess = async () => {
                            //  item has been removed
                            console.log(`deleted ${part_id}`)
                            await this.app_secure_total_session(sess_name)
                            resolve(true)
                        };
                        //
                        request.onerror = (e) => {
                            resolve(false)
                        }
                    }
                    resolve(false)
                }
            }

            // not_found_callback 
            let not_found_callback = () => {
                warn(`The session ${sess_name} is not in the database`)
                resolve(false)
            }

            this._apply_find_by_name(sess_name, dataStore, remove_from_list_callback, not_found_callback)
        })

        return p
    }
      
    //  remove_data: 
    //      Parameters: part_id -- remove a sections of the data kept by the session named sess_name
    //                  sess_name -- A session or separate project or publication...
    //
    get_data(part_id,sess_name) {
        //
        if ( !(this._can_process_db) ) return false
        //
        if ( this.db === null ) {
          console.log("db not initialized :: remove_audio_data")
          return false;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.DATA_STORE);
        if ( !(dataStore) ) return false
        //

        let p = new Promise((resolve,reject) => {
            // remove_from_list_callback
            let get_from_list_callback = async (value,dbIndex) => {
                let keyRangeValue = IDBKeyRange.only(value.name);
                dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                    let cursor = event.target.result;
                    if ( cursor ) {
                        let sessionObj = cursor.value
                        let value =  sessionObj.data[part_id]
                        if ( value === undefined ) {
                            resolve(false)
                        } else {
                            resolve(value)
                        }
                    }
                    resolve(false)
                }
            }
        
            // not_found_callback 
            let not_found_callback = () => {
                warn(`The session ${sess_name} is not in the database`)
                resolve(false)
            }
        
            this._apply_find_by_name(sess_name, dataStore, get_from_list_callback, not_found_callback)
        })

        return p
    }
      
 
    // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

    //  get_session: 
    //      Parameters: sess_name -- A session or separate project or publication...
    //  Returns the object controlling all the data within the session.
    get_session(sess_name) {
        //
        if ( !(this._can_process_db) ) return false
        //
        if ( this.db === null ) {
          console.log("db not initialized :: get_data")
          return false;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.DATA_STORE);
        if ( !(dataStore) ) return false
        //
        let p = new Promise((resolve,reject) => {
          //
          // get_elem_callback
          let get_elem_callback = (value,dbIndex) => {          // element.name == sess_name exists
            //
            let keyRangeValue = IDBKeyRange.only(value.name);
            //
            dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
              let cursor = event.target.result;
              if ( cursor ) {
                let sessionObj = cursor.value
                resolve(sessionObj)
              } else {
                reject(null)
              }
            }
          }
          //
          // not_found_callback
          let not_found_callback = () => {                       // element.name == sess_name  NOT FOUND
            reject(null)
          }
          //
          this._apply_find_by_name(sess_name, dataStore, get_elem_callback, not_found_callback)
        })
        //
        return p
    }

     
    //  delete_session: 
    //      Parameters: sess_name -- A session or separate project or publication...
    //
    delete_session(sess_name) {
        //
        if ( !(this._can_process_db) ) return false

        if ( sess_name !== 'none ') {
            if ( this.db === null ) {
                console.log("db not initialized :: delete_session")
                return false;
            }
            //
            let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
            if ( !(transaction) ) return false
            let dataStore = transaction.objectStore(this.DATA_STORE);
            if ( !(dataStore) ) return false
        
            let p = new Promise((resolve,reject) => {
                // delete_from_list_callback
                let delete_from_list_callback = (value,dbIndex) => {
                    //
                    let keyRangeValue = IDBKeyRange.only(value.name);
                    //
                    dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                        let cursor = event.target.result;
                        if ( cursor ) {
                            let request = cursor.delete();
                            request.onsuccess = () => {
                                this.current_session_name = 'none'   /// here last
                                this.load_name_list()
                                this.application_revise_current_session(this.current_session_name)
                                resolve(true)
                            };
                        }
                        resolve(false)
                    }
                }
                //
                let not_found_callback = () => {
                    warn(`The session ${sess_name} is not in the database`)
                    resolve(false)
                }
                //
                this._apply_find_by_name(sess_name, dataStore, delete_from_list_callback, not_found_callback)    
            })
            //
            return p
        }
        return false
    }



    async install_session(session_object) {
        if ( typeof session_object !== 'object')
        if ( !(this._can_process_db) ) return false
        if ( this.db === null ) {
            console.log("db not initialized :: delete_session")
            return false;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.DATA_STORE);
        if ( !(dataStore) ) return false

        //
        let request = dataStore.put(session_object)
        request.onsuccess = (ev) => {
            let rsult = event.target.result
            //
            this.current_session_name = session_object.name
        }
        //
    }


    store_completion(storeObj) {
        if ( typeof storeObj !== 'object')
        if ( !(this._can_process_db) ) return false
        if ( this.db === null ) {
            console.log("db not initialized :: delete_session")
            return false;
        }
        //
        let transaction = this.db.transaction(this.COMPLETION_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.COMPLETION_STORE);
        if ( !(dataStore) ) return false

        if ( this.COMPLETION_STORE !== undefined ) {
            let p = new Promise((resolve,reject) => {
                //
                transaction.oncomplete = (ev) => {
                    console.log("store_complete: transaction done")
                }
                transaction.onerror = (ev) => {
                    console.log(ev)
                }
                let result = dataStore.put(storeObj)
                result.onsuccess = (event) => {
                    resolve(event.target.result)
                }
                result.error = (error) => {
                    reject(error)
                }
            })
            return p
        }
        return false
    }


    get_completion(c_key) {
        //
        if ( !(this._can_process_db) ) return false
        if ( this.db === null ) {
            console.log("db not initialized :: delete_session")
            return false;
        }
        //
        let transaction = this.db.transaction(this.COMPLETION_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.COMPLETION_STORE);
        if ( !(dataStore) ) return false
        //
        let p = new Promise((resolve,reject) => {            
            let nameIndex = dataStore.index('name');
            nameIndex.get(c_key).onsuccess = (evt) => {     // KEY
                let value = evt.target.result;
                if ( value ) {
                    let keyRangeValue = IDBKeyRange.only(value.name);
                    nameIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                        let cursor = event.target.result;
                        if ( cursor ) {
                            resolve(cursor.value)
                        } else {
                            resolve(false)
                        }
                    }
                } else resolve(false)
            }
        })
        //
        return p
    }


    remove_completion(c_key) {
        if ( !(this._can_process_db) ) return false
        if ( this.db === null ) {
            console.log("db not initialized :: delete_session")
            return false;
        }
        //
        let transaction = this.db.transaction(this.COMPLETION_STORE, "readwrite");
        if ( !(transaction) ) return false
        let dataStore = transaction.objectStore(this.COMPLETION_STORE);
        if ( !(dataStore) ) return false
        //
        let p = new Promise((resolve,reject) => {
            //
            let p_t = new Promise((resolve,reject) => {
                transaction.oncomplete = (ev) => {
                    resolve(true)
                    console.log("remove_completion: transaction done")
                }
                transaction.onerror = (ev) => {
                    console.log(ev)
                    reject(false)
                }}
            )
            //
            let nameIndex = dataStore.index('name');
            nameIndex.get(c_key).onsuccess = async (evt) => {     // KEY
                let value = evt.target.result;
                if ( value ) {
                    let keyRangeValue = IDBKeyRange.only(value.name);
                    nameIndex.openCursor(keyRangeValue).onsuccess = async (event) => {
                        let cursor = event.target.result;
                        if ( cursor ) {
                            let request = cursor.delete();
                            request.onsuccess = async () => {
                                await p_t
                                resolve(true)
                            };
                        } else {
                            await p_t
                            resolve(false)
                        }
                    }
                } else {
                    await p_t
                    resolve(false)
                }
            }
        })
        //
        return p
    }

    // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

    application_data_update(blob_url,part_id,blob_data) {
        // implemented by derived method (override)
    }

    async app_secure_total_session(sess_name) {
         // implemented by derived method (override)
    }

    application_revise_current_session(sess_name) {
        // implemented by derived method (override)
    }

    application_update_session_name_selections(sess_name,name_list) {
        // implemented by derived method (override)
    }

    app_pre_update_action(blob_data,part_id,op_parameters) {
        // implemented by derived method (override)
    }

    app_post_update_action(blob_data,part_id,blob_url) {
        // implemented by derived method (override)
    }

    application_total_entry(sess_obj) {
        // implemented by derived method (override)
    }

}




//$EXPORTABLE::
/*
AppDBWrapper
*/

// This key will be written each time a new virtual identity is made for the guest interactor (a virtual identity)
//
//let g_gratis_negotiator = new Worker('./guest_presence_$$key')


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

async function wv_update_user(user_object,current_session_name) {
    // may send this to the client page....  
    self.postMessage({
        "type" : "keys-up",
        "signer" : user_object.chunk_signer,
        "session" : current_session_name
    })
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
        let description = JSON.stringify(chunk_data.message)
        g_app_web_socket.send(chunk_message)
        self.postMessage({
            "type" : "op-complete",
            "transition" : chunk_data.transition,
            "message" : chunk_data.message,
            "description" : description,
            "session" : g_current_session_name
        })
    
    }
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
                    await wv_update_user(g_user_info,g_current_session_name)
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
            await wv_update_user(g_user_info,g_current_session_name)
            
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
            let chunk_hash = await hash_of_chunk(new_chunk,secret)  // chunk hash is a string in the hex alphabet
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
            post_chunk(remote_cache_op)  // web socket send updates to the server (short message)
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
                    //
                    // message.blob -- the audio blob, made from the chunks gathered - real time.
                    let c_hash = await combined_hash_signed_and_store(hashes,message.blob_id,message.blob,null)
                        // STORE HASH REMOTELY  // STORE HASH REMOTELY
                    let remote_cache_op = {
                        'transition' : 'chunk-final',   // no blob in message
                        'message' : {
                            'chunk_final' : c_hash,
                            'ucwid' : g_user_info.ucwid,
                            'session' : g_current_session_name,
                            'verify_key' : g_chunk_signer.signer_pk_str,
                            'client_time' : Date.now(),
                            'server_id' : g_identified_server,    // identifies the user recording session
                            'nonce' : g_current_session_nonce,
                            'section' : message.blob_id             // UUID from web page
                        }
                    }
                    post_chunk(remote_cache_op) // web socket send updates to the server (short message)
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
                    //
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
                            'nonce' : g_current_session_nonce,
                            'section' : message.blob_id,
                            'ops' : edit_ops
                        }
                    }
                    post_chunk(remote_cache_op) // web socket send updates to the server (short message)
                    break;
                }
                default: {      // error condition
                    break;
                }
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
    self.g_message_template = g_message_template = {
        "category" : "",
        "direction" : "",
        "action" : "",
        "relationship" : ""
    }
}

// constants in shared constants

let g_frame_page = self.parent


let injest_personalization = false
let injest_session = false

let personalization = (post_params) => {}


// END OF HOSTED APP PAGE COM  (ALPHA)



// MODULE: UPLOAD MEDIA (windowized)


const DEFINED_CHUNK_SIZE = 5000000
const DEFINED_MAX_SIZE = 9000000



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


