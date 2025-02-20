// MODULE: ONE TABLE(windowized)

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

//>>  AppDBWrapper


// In the following line, you should include the prefixes of implementations you want to test.
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// DON'T use "var indexedDB = ..." if you're not in a function.
// Moreover, you may need references to some window.IDB* objects:
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
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

            let update_list_elem_callback = (value,dbIndex) => {
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
            let rsult = ev.target.result
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




//$$EXPORTABLE::
/*
AppDBWrapper
*/
