
// Human page container progressive web application

const CACHE_NAME = 'human-page-cache-v1'
const FOLDER_NAME = 'post_requests'
const CONTAINED_PAGE = 'human_page_pdate'
const SW_DB = 'human-page-db'
const DB_VERSION = 1

var g_form_data = null;



// CACHE
///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ----
//
let urlsToCache = [
    '/',
    './images/side-nav-bg.png',
    './images/chrome-touch-icon-192x192.png',
    './images/chrome-touch-icon-384x384.png',
    './images/ic_menu_24px.svg',
    './images/ic_mode_edit_24px.png',
    './images/ic_info_outline_24px.svg',
    './images/chrome-touch-icon-30x30.png',
    'https://fonts.gstatic.com/s/roboto/v19/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
    'https://fonts.googleapis.com/css?family=Roboto',
    './recorder.html',
    './ownership.js',
    './manifest.json'
]



self.oninstall = async (event) => {
    //
    self.skipWaiting();    // gets the version waiting to be installed.
    try {
        event.waitUntil(
            (async () => {
                let cache = await caches.open(CACHE_NAME)
                if ( cache ) {
                    return cache.addAll(urlsToCache)
                }
            })())
    } catch (e) {
        // send to client
    }
    //
}




//  DATABASE
///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ----

var g_contained_app_db = null;
//
//
// In the following line, you should include the prefixes of implementations you want to test.
self.indexedDB = self.indexedDB || self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB;
// DON'T use "var indexedDB = ..." if you're not in a function.
// Moreover, you may need references to some window.IDB* objects:
self.IDBTransaction = self.IDBTransaction || self.webkitIDBTransaction || self.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
self.IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange || self.msIDBKeyRange;
// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)


// TYPE
let saveReqType = {
    "url" : true,
    "payload" : "form_data object",
    "method" : "POST",
    "id" : "string"
}

// openDatabase
async function openDatabase() {
    //
    if ( !(this._can_process_db) ) return false
    let self = this
    let db_name = this.name
    //
    let p = new Promise((resolve,reject) => {

        let request = self.indexedDB.open(db_name, DB_VERSION);
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
            resolve(db)
        }

        // <-- onupgradeneeded
        request.onupgradeneeded = (event) => {
            //
            let db = event.target.result;
            //
            if ( FOLDER_NAME !== undefined ) {
                try {
                    db.createObjectStore(FOLDER_NAME, { keyPath: 'id' })
                    //sessionObjectStore.createIndex("name", "name", { unique: true });
                } catch (e) {
                     // send to client
                }
            }
        //
        }
    })  // end of promise
    //
    g_contained_app_db = await p
}



// getObjectStore

function getObjectStore (storeName, mode) {
    if ( g_contained_app_db ) {
        return g_contained_app_db.transaction(storeName, mode).objectStore(storeName)
    } else {
        return false
    }
}

//  savePostRequests

function savePostRequests(url, payload) {
    //
    var store = getObjectStore(FOLDER_NAME, 'readwrite');
    if ( store ) {
        var request = store.add({
          url: url,
          payload: payload,
          method: 'POST'
        })
        //
        request.onsuccess = function (event) {
          console.log('a new pos_ request has been added to indexedb')
        }
        //
        request.onerror = function (error) {
          console.error(error)
           // send to client
        }
    }
    //
 }


// data base operations start
openDatabase()



// POST 
///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ----


function sendPostToServer () {
    //
    let savedRequests = []
    let store = getObjectStore(FOLDER_NAME).openCursor() // FOLDERNAME = 'post_requests'
    if ( store ) {
        store.onsuccess = async  (event) => {
            let cursor = event.target.result
            //
            if ( cursor) {
                // Keep moving the cursor forward and collecting saved requests.
                savedRequests.push(cursor.value)
                cursor.continue()
                //
            } else {
                //
                // At this point, we have collected all the post requests in indexedb.
                for ( let savedRequest of savedRequests ) {         // -- saveReqType
                    //
                    // send them to the server one after the other
                    console.log('saved request', savedRequest)
                    //
                    let requestUrl = savedRequest.url
                    let uploadInfo = savedRequest.payload;
                    //
                    let payload = JSON.stringify(uploadInfo.form_data)
                    let method = savedRequest.method
                    let headers = {
                      'Accept': 'application/json'
                    } // if you have any other headers put them here
    
                    headersp['Content-Type'] = uploadInfo['Content-Type'];
    
                    try {
                        //
                        let response = await fetch(requestUrl, {
                            headers: headers,
                            method: method,
                            body: payload
                        })
                        if (response.status < 400) {  // successful, so don't leave it to be sent again...
                            // If sending the POST request was successful, then remove it from the IndexedDB.
                            getObjectStore(FOLDER_NAME, 'readwrite').delete(savedRequest.id)
                        }
                        //
                    } catch (e) {
                        throw error
                    }
                }
            }
        }
    }
}




// ACTIVATE 
///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ----

/*
The primary use of activate is to clean up resources used in previous versions of the service worker.
This is called after other pages let go of the old one or 'skipWaiting' preempts current page usage
*/

self.onactivate = (event) => {
    //
    //  clients opened before the registration will be comandeered
    event.waitUntil(self.clients.claim());    /// clients.claim causes the controllerchange event to fire
    //
    let cacheWhitelist = [CACHE_NAME] // products-v2 is the name of the new cache
    event.waitUntil(
        (async () => {
            //
            let cacheNames = await caches.keys();
            let promises = cacheNames.map( cacheName => {
                if ( cacheWhitelist.indexOf(cacheName) === -1 ) {   // delete all but our prefered cache
                    return caches.delete(cacheName)
                }
            })
            //
            if ( self.registration.navigationPreload ) {
                // Enable navigation preloads!
                await self.registration.navigationPreload.enable();    // ENABLE
            }
            //
            return  Promise.all(promises)
        })());
}



// FETCH
///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ----


self.onfetch = async (event) => {
	let clientId = event.clientId
	let handled = event.handled
	let isReload = event.isReload
	let preloadResponse = await event.preloadResponse
	let replacesClientId = event.replacesClientId  // e.g. <a href="" target="CLIENT-ID" />
    let resultingClientId = event.resultingClientId
    // 
    try {
        let creq = event.request.clone();
        if ( creq.method === 'GET' ) {
            let cache = await caches.open(CACHE_NAME)
            // Respond from the cache if we can
            if ( cache ) {
                const response = await cache.match(creq);   // this request has been cached
                if ( response ) {
                    event.respondWith(response);
                    return
                }
            }
            // The request was preloaded 
            if ( preloadResponse ) {
                // Else, use the preloaded response, if it's there
                const response = await preloadResponse;      // PRELOAD MUST BE ENABLED
                if ( response ) {
                    event.respondWith(response);
                    return
                }
            }
            //
            let response = fetch(creq)
            if ( response ) {
                if ( cache ) {
                    let responseClone = response.clone();
                    await cache.put(event.request, responseClone)
                }
                event.respondWith(response);
            }
        } else if ( creq.method === 'POST' ) {
            // prior to a post, there is a special application burden of requiring a message to be sent to the service worker
            // with data to be posted
            if ( g_form_data ) {
                if ( g_form_data.loggedin ) {  // form data must be a JSON object, and must have a field `loggedin`
                    let response = await fetch(creq)
                    if ( response ) {
                        event.respondWith(response);
                        return
                    }
                }
                savePostRequests(creq.url, g_form_data)  // save if failed 
            }
        }
    } catch (e) {

    }
};






// MESSAGES AND SYNC 
///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ----

self.onmessage = (event) => {
    console.log('form data', event.data)
    //
    if ( event.data.hasOwnProperty('form_data') ) {
        g_form_data = event.data   // receives form data from script.js upon submission
    } else if ( event.data.hasOwnProperty(CONTAINED_PAGE) ) {
        event.waitUntil(sendPostToServer())
    }
}



self.addEventListener('sync', async (event) => {
            if ( event.tag === CONTAINED_PAGE ) { // event.tag name checked here must be the same as the one used while registering sync
                event.waitUntil(sendPostToServer())
                let clients = await self.clients.matchAll({ includeUncontrolled: true });
                for ( let client of clients ) {
                    client.postMessage('outbox-processed')
                }
            }
        })



// PUSH
///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ----



self.addEventListener('push', (event) => {
    let options = {
        body: event.data.body,
        icon: 'images/example.png',
    }
    event.waitUntil(
        /* The showNotification method is available on the registration object of the service worker.
        The first parameter to showNotification method is the title of notification, and the second parameter is an object */
        self.registration.showNotification(event.data.title, options)
    )
})



/*
{
     "endpoint": "https://fcm.googleapis.com/fcm/send/c7Veb8VpyM0:APA91bGnMFx8GIxf__UVy6vJ-n9i728CUJSR1UHBPAKOCE_SrwgyP2N8jL4MBXf8NxIqW6NCCBg01u8c5fcY0kIZvxpDjSBA75sVz64OocQ-DisAWoW7PpTge3SwvQAx5zl_45aAXuvS",
     "expirationTime": null,
     "keys": {
          "p256dh": "BJsj63kz8RPZe8Lv1uu-6VSzT12RjxtWyWCzfa18RZ0-8sc5j80pmSF1YXAj0HnnrkyIimRgLo8ohhkzNA7lX4w",
          "auth": "TJXqKozSJxcWvtQasEUZpQ"
     }
}


/// server side  -- node.js


const webpush = require('web-push')
const vapidKeys = webpush.generateVAPIDKeys()

const options = {
    TTL: 24*60*60, //TTL is the time to live, the time that the notification will be queued in the push service
    vapidDetails: {
        subject: 'email@example.com',
        publicKey: '',
        privateKey: ''
    }
}
const data = {
    title: 'Update',
    body: 'Notification sent by the server'
}
webpush.sendNotification(subscription, data, options)
*/

