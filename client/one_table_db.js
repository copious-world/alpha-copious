


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

var g_window_can_process = true
// In the following line, you should include the prefixes of implementations you want to test.
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// DON'T use "var indexedDB = ..." if you're not in a function.
// Moreover, you may need references to some window.IDB* objects:
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)



if (!window.indexedDB) {
    g_window_can_process = false
    console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}


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
// section_id identifies a part of the data (e.g. a layer or a component)

class AppDBWrapper {

    constructor(conf) {

        let self = this
        for ( let ky in conf ) {
            self[ky] = conf[ky]
        }
        
        this.db = false
        this.current_session_name = 'none'
        this.session_name_list = []
    }


    get session_name_list() {
        return this.session_name_list
    }


    init_database(db_name) {
        this.name = db_name

        let p = new Promise((resolve,reject) => {

            let request = window.indexedDB.open(db_name, this.DB_VERSION);
            //
            request.onerror = (event) => {
                alert(`This web app will not store ${this.describe_data} without the use of computer storage.`)
            };
            
            request.onsuccess = (event) => {
                //
                let db = event.target.result;
                db.onerror = (event) => {
                    console.log("Database error: " + event.target.error);
                    reject(event.target.error)
                };
                //
                this.db = db;
                resolve(db)
            }

            request.onupgradeneeded = (event) => {
                //
                let db = event.target.result;
                //
                try {
                    let sessionObjectStore = db.createObjectStore(this.DATA_STORE, { autoIncrement : true });
                    sessionObjectStore.createIndex("name", "name", { unique: true });
                    sessionObjectStore.createIndex("sess_date_time", "sess_date_time", { unique: true });
                } catch (e) {
                }
            //
            };
        })  // end of promise
        return p
    }



    // apply_find_by_name
    //  -- a generic that calls success_callback when an element matches the index, or not_found_callback otherwise.
    //
    apply_find_by_name(sess_name, store, success_callback, not_found_callback) {
        var nameIndex = store.index('name');
        nameIndex.get(sess_name).onsuccess = (evt) => {
            var value = evt.target.result;
            if ( value ) {
                if ( success_callback ) success_callback(value,nameIndex);
            } else {
                if ( not_found_callback ) not_found_callback();
            }
        };
    }
    
    add_session_to_db(dataStore,application_op) {
        let sessionObj = {
            'name' : this.current_session_name,
            'sess_date_time' : '' + Date.now(),
            'data' : { },
            'hashes' : { },
            'edit_order' : []
        }
        //
        if ( (application_op !== undefined) && (typeof application_op === 'function') ) {
            application_op(sessionObj)
        }
        let request = dataStore.add(sessionObj);
        return request
    }
  

    // add_data -- make this fairly generic
    // section id could be a layer....
    add_data(blob_data,section_id) {
        if ( !(this.db) ) {
          console.log(`db not initialized :: AppDBWrapper.add_data`)
          return;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        let dataStore = transaction.objectStore(this.DATA_STORE);
      
        let update_list_callback = (value,dbIndex) => {     // if found update
            if ( !dbIndex || (typeof value === "undefined") ) return;
            let keyRangeValue = IDBKeyRange.only(value.name);
            dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                var cursor = event.target.result;
                if ( cursor ) {

                    // existing session 
                    let sessionObj = cursor.value
                    //
                    let blob_url = URL.createObjectURL(blob_data);
                    // map_id = section_id
                    // store revised data
                    sessionObj.data[section_id] = blob_data
                    // make sure the structure has been set up if not already
                    if ( sessionObj.hashes[section_id] === undefined ) {
                        sessionObj.hashes[section_id] = {}
                    }
                    if ( sessionObj.hashes[section_id].op_history === undefined ) {
                        sessionObj.hashes[section_id].op_history = []
                    }
                    // record the order in which sections (layers) have been edited
                    sessionObj.edit_order.push(section_id)
                    //
                    // update IndexedDB
                    const request = cursor.update(sessionObj);
                    request.onsuccess = async () => {
                        this.application_data_update(blob_url,section_id,blob_data)  // application handling of data e.g visual rep
                    };
                    //
                }
            }
        }
      
        let add_new_callback = () => {          // if not found add a new one
            //
            let blob_url = URL.createObjectURL(blob_data);
            //
            let application_op = (sessionObj) => {
                //
                sessionObj.data[section_id] = blob_data
                if ( sessionObj.hashes[section_id] === undefined ) {
                    sessionObj.hashes[section_id] = {}
                }
                sessionObj.hashes[section_id].op_history = []
                //
            } 
            //
            let request = this.add_session_to_db(dataStore,application_op)
            if ( request ) {
                request.onsuccess = function(event) {
                    sessionObj.edit_order.push(section_id)
                    this.application_data_update(blob_url,section_id,blob_data)  // application handling of data e.g visual rep
                };
            }
            //
        }
        //
        this.apply_find_by_name(this.current_session_name, dataStore, update_list_callback, add_new_callback)
    }




    get_data(sess_name) {
        if ( this.db === null ) {
          console.log("db not initialized :: get_data")
          return;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        let dataStore = transaction.objectStore(this.DATA_STORE);
        //
        let p = new Promise((resolve,reject) => {
          //
          let get_elem_callback = (value,dbIndex) => {          // element.name == sess_name exists
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
          let not_found_callback = () => {                       // element.name == sess_name  NOT FOUND
            reject(null)
          }
          //
          this.apply_find_by_name(sess_name, dataStore, get_elem_callback, not_found_callback)
        })
        //
        return p
    }
      
      
    remove_data(data_key,sess_name) {
        //
        if ( this.db === null ) {
          console.log("db not initialized :: remove_audio_data")
          return;
        }
        //
        let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
        let dataStore = transaction.objectStore(this.DATA_STORE);
      
        let remove_from_list_callback = async (value,dbIndex) => {
          let keyRangeValue = IDBKeyRange.only(value.name);
          dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
            var cursor = event.target.result;
            if ( cursor ) {
              let sessionObj = cursor.value
              delete sessionObj.data[data_key]
              //
              const request = cursor.update(sessionObj);
              request.onsuccess = async () => {
                //  item has been removed
                console.log(`deleted ${data_key}`)
                await this.app_secure_total_session(sess_name)
              };
              //
            }
          }
        }
      
        let not_found_callback = () => {
          warn(`The session ${sess_name} is not in the database`)
        }
      
        this.apply_find_by_name(sess_name, dataStore, remove_from_list_callback, not_found_callback)
    }
      
      

    delete_session(sess_name) {
        if ( sess_name !== 'none ') {
            if ( this.db === null ) {
                console.log("db not initialized :: delete_session")
                return;
            }
            //
            let transaction = this.db.transaction(this.DATA_STORE, "readwrite");
            let dataStore = transaction.objectStore(this.DATA_STORE);
        
            let delete_from_list_callback = (value,dbIndex) => {
                let keyRangeValue = IDBKeyRange.only(value.name);
                dbIndex.openCursor(keyRangeValue).onsuccess = (event) => {
                    var cursor = event.target.result;
                    if ( cursor ) {
                        var request = cursor.delete();
                        request.onsuccess = () => {
                            this.current_session_name = 'none'   /// here last
                            this.load_name_list()
                            this.application_revise_current_session(this.current_session_name)
                        };
                    }
                }
            }
        
            let not_found_callback = () => {
                warn(`The session ${sess_name} is not in the database`)
            }
        
            this.apply_find_by_name(sess_name, dataStore, delete_from_list_callback, not_found_callback)    
        }
    }


    load_name_list() {
        let transaction = this.db.transaction(this.DATA_STORE, "readonly");
        let dataStore = transaction.objectStore(this.DATA_STORE);
        //
        this.session_name_list = []
        var myIndex = dataStore.index('name');
        myIndex.openCursor().onsuccess = (event) => {
          var cursor = event.target.result;
          if(cursor) {
            this.session_name_list.push(cursor.value.name)
            cursor.continue();
          } else {
            this.application_update_session_name_selections(this.current_session_name,this.session_name_list)
          }
        };
        //
    }


    application_data_update(blob_url,section_id,blob_data) {
        // implemented by derived method (override)
    }

    async app_secure_total_session(sess_name) {
         // implemented by derived method (override)
    }

    application_revise_current_session(this.current_session_name) {
        // implemented by derived method (override)
    }

    application_update_session_name_selections(sess_name,name_list) {
        // implemented by derived method (override)
    }

}


