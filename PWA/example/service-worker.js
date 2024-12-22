

// Song catcher Services Worker

const CACHE_NAME = 'song-cache-v2'
const FOLDER_NAME = 'post_requests'

var g_form_data = null;
var g_song_db = null;
//
// https://blog.formpl.us/how-to-handle-post-put-requests-in-offline-applications-using-service-workers-indexedb-and-da7d0798a9ab
//



function getObjectStore (storeName, mode) {
    if ( g_song_db ) {
        return g_song_db.transaction(storeName, mode).objectStore(storeName)
    } else {
        return false
    }
}

function savePostRequests (url, payload) {
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
        }
    }
    //
 }


function openDatabase () {
  // if `flask-form` does not already exist in our browser (under our site), it is created
  var indexedDBOpenRequest = indexedDB.open('mysongs-db', 1)

  indexedDBOpenRequest.onerror = function (error) {
    // error creatimg db
    console.error('IndexedDB error:', error)
  }


  indexedDBOpenRequest.onupgradeneeded = function () {
    // This should only execute if there's a need to create/update db.
    this.result.createObjectStore(FOLDER_NAME, { autoIncrement: true, keyPath: 'id' })
  }

  // This will execute each time the database is opened.
  indexedDBOpenRequest.onsuccess = function () {
      g_song_db = this.result
      if ( !g_song_db.objectStoreNames.contains(FOLDER_NAME) ) {
          let objectstore = g_song_db.createObjectStore(FOLDER_NAME, { keyPath: 'id' })
      }
  }
}


openDatabase()


///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ---- ///// ----

function sendPostToServer () {
    //
    var savedRequests = []
    var req = getObjectStore(FOLDER_NAME).openCursor() // FOLDERNAME = 'post_requests'

    req.onsuccess = async  (event) => {
        var cursor = event.target.result
        //
        if ( cursor) {
            // Keep moving the cursor forward and collecting saved requests.
            savedRequests.push(cursor.value)
            cursor.continue()
            //
        } else {
            //
            // At this point, we have collected all the post requests in indexedb.
            for ( let savedRequest of savedRequests ) {
                //
                // send them to the server one after the other
                console.log('saved request', savedRequest)
                //
                var requestUrl = savedRequest.url
                var uploadInfo = savedRequest.payload;
                //
                var payload = JSON.stringify(uploadInfo.form_data)
                var method = savedRequest.method
                var headers = {
                  'Accept': 'application/json'
                } // if you have any other headers put them here

                headersp['Content-Type'] = uploadInfo['Content-Type'];

                fetch(requestUrl, {
                    headers: headers,
                    method: method,
                    body: payload
                }).then( (response) => {
                    //
                    console.log('server response', response)
                    //
                    if (response.status < 400) {
                        // If sending the POST request was successful, then remove it from the IndexedDB.
                        getObjectStore(FOLDER_NAME, 'readwrite').delete(savedRequest.id)
                    }
                    //
                }).catch( (error) => {
                             // This will be triggered if the network is still down. The request will be replayed again
                             // the next time the service worker starts up.
                             console.error('Send to Server failed:', error)
                             // since we are in a catch, it is important an error is thrown,
                             // so the background sync knows to keep retrying sendto server
                             throw error
                })
              }
        }
      }
}


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
            './third_party/Roboto/Roboto-400.woff',
            './third_party/Roboto/Roboto-500.woff',
            'https://fonts.gstatic.com/s/roboto/v19/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            'https://fonts.googleapis.com/css?family=Roboto',
            'https://cdn.jsdelivr.net/npm/vue@2.6.7/dist/vue.js',
            'https://cdn.jsdelivr.net/npm/vue-resource@1.5.1',
            'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.all.js',
            './static/appFrame.js',
            './manifest.json'
]


// event 'install'
// also ...  self.oninstall = (event) => {};

/*
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("v1")
      .then((cache) =>
        cache.addAll([
          "/",
          "/index.html",
          "/style.css",
          "/app.js",
          "/image-list.js",
          "/star-wars-logo.jpg",
          "/gallery/",
          "/gallery/bountyHunters.jpg",
          "/gallery/myLittleVader.jpg",
          "/gallery/snowTroopers.jpg",
        ]),
      ),
  );
});

 */

self.addEventListener('install', (event) => {
                          //
                          self.skipWaiting();    // gets the version waiting to be installed.

                          //
                          event.waitUntil(caches.open(CACHE_NAME).then (cache => cache.addAll(urlsToCache)));
                      })






/*

self.onactivate = (event) => {}; 


self.addEventListener("activate", (event) => {
  const cacheAllowlist = ["v2"];

  event.waitUntil(
    caches.forEach((cache, cacheName) => {
      if (!cacheAllowlist.includes(cacheName)) {
        return caches.delete(cacheName);
      }
    }),
  );
});

The primary use of activate is to clean up resources used in previous versions of the service worker.
This is called after other pages let go of the old one or 'skipWaiting' preempts current page usage
*/

self.addEventListener('activate', (event) => {
                            //  clients opened before the registration will be comandeered
                          event.waitUntil(self.clients.claim());    /// clients.claim causes the controllerchange event to fire
                          //
                          let cacheWhitelist = [CACHE_NAME] // products-v2 is the name of the new cache
                          event.waitUntil(
                              caches.keys().then(cacheNames => {
                                      return Promise.all(
                                          cacheNames.map(cacheName => {
                                                             // Deleting all the caches except the ones that are in cacheWhitelist array
                                                             if (cacheWhitelist.indexOf(cacheName) === -1) {
                                                                 return caches.delete(cacheName)
                                                             }
                                                         })
                                          )
                                  }))
                      })



/*
self.addEventListener("fetch", (event) => {
  // Let the browser do its default thing
  // for non-GET requests.
  if (event.request.method !== "GET") return;

  // Prevent the default, and handle the request ourselves.
  event.respondWith(
    (async () => {
      // Try to get the response from a cache.
      const cache = await caches.open("dynamic-v1");
      const cachedResponse = await cache.match(event.request);    /// request from fetch

      if (cachedResponse) {
        // If we found a match in the cache, return it, but also
        // update the entry in the cache in the background.
        event.waitUntil(cache.add(event.request));   // adds this request to the cache for future on-line updating
        return cachedResponse;
      }

      // If we didn't find a match in the cache, use the network.
      return fetch(event.request);      // global scope fetch
    })(),
  );
});



// PRELOAD

addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        // Enable navigation preloads!
        await self.registration.navigationPreload.enable();    // ENABLE
      }
    })(),
  );
});


addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      // Respond from the cache if we can
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;

      // Else, use the preloaded response, if it's there
      const response = await event.preloadResponse;      // PRELOAD MUST BE ENABLED
      if (response) return response;

      // Else try the network.
      return fetch(event.request);
    })(),
  );
});




// PRELOAD when needed https://web.dev/blog/navigation-preload

self.onfetch = async (event) => {
	console.dir(event) //... the nodejs .dir
	let clientId = event.clientId
	let handled = event.handled
	let isRelaod = event.isRelaod
	let preloadResponse = await event.preloadResponse
	let replacesClientId = event.replacesClientId  // e.g. <a href="" target="CLIENT-ID" />
    let resultingClientId = event.resultingClientId
};



addEventListener("install", (event) => {
  const preCache = async () => {
    const cache = await caches.open("static-v1");
    return cache.addAll(["/", "/about/", "/static/styles.css"]);
  };
  event.waitUntil(preCache());
});


*/
// Fetch event handler for responding to GET requests with the cached assets and POST offline
self.addEventListener('fetch', (event) => {
                          var creq = event.request.clone();
                          console.log('I am a request with url: ', creq.url)
                          if ( creq.method === 'GET' ) {
                              event.respondWith(
                                  caches.open(CACHE_NAME)
                                  .then (cache => {
                                             /* Checking if the request is already present in the cache.
                                                If it is present, sending it directly to the client */
                                             return cache.match(event.request)
                                                         .then (response => {
                                                                    if ( !response ) {
                                                                        fetch(event.request).then (response => {
                                                                                                       let responseClone = response.clone();
                                                                                                       cache.put(event.request, responseClone)
                                                                                                       return response
                                                                                                   })
                                                                    }
                                                                    return response
                                                                })
                                         }))
                          } else if ( creq.method === 'POST' ) {
                              // attempt to send request normally
                              if ( g_form_data ) {
                                  if ( g_form_data.loggedin ) {
                                      event.respondWith(fetch(creq).catch(function (error) {
                                        // only save post requests in browser, if an error occurs
                                        savePostRequests(creq.url, g_form_data)
                                      }))
                                  } else {
                                      savePostRequests(creq.url, g_form_data)
                                  }
                              }
                            }
                      })




self.addEventListener('message', (event) => {
                          console.log('form data', event.data)
                          if ( event.data.hasOwnProperty('form_data') ) {
                              g_form_data = event.data   // receives form data from script.js upon submission
                          } else if ( event.data.hasOwnProperty('sendSongs') ) {
                              event.waitUntil(sendPostToServer())
                          }
})



self.addEventListener('sync', (event) => {
                          console.log('now online')
                          if ( event.tag === 'sendSongs' ) { // event.tag name checked here must be the same as the one used while registering sync
                              event.waitUntil(sendPostToServer())
                          }
                      })



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






/*
 Copyright 2014 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

// This polyfill provides Cache.add(), Cache.addAll(), and CacheStorage.match(),
// which are not implemented in Chrome 40.
importScripts('../serviceworker-cache-polyfill.js');

// While overkill for this specific sample in which there is only one cache,
// this is one best practice that can be followed in general to keep track of
// multiple caches used by a given service worker, and keep them all versioned.
// It maps a shorthand identifier for a cache to a specific, versioned cache name.

// Note that since global state is discarded in between service worker restarts, these
// variables will be reinitialized each time the service worker handles an event, and you
// should not attempt to change their values inside an event handler. (Treat them as constants.)

// If at any point you want to force pages that use this service worker to start using a fresh
// cache, then increment the CACHE_VERSION value. It will kick off the service worker update
// flow and the old cache(s) will be purged as part of the activate event handler when the
// updated service worker is activated.
var CACHE_VERSION = 1;
var CURRENT_CACHES = {
  prefetch: 'prefetch-cache-v' + CACHE_VERSION
};

self.addEventListener('install', function(event) {
  var now = Date.now();

  var urlsToPrefetch = [
    'static/pre_fetched.txt',
    'static/pre_fetched.html',
    // This is an image that will be used in pre_fetched.html
    'https://www.chromium.org/_/rsrc/1302286216006/config/customLogo.gif'
  ];

  // All of these logging statements should be visible via the "Inspect" interface
  // for the relevant SW accessed via chrome://serviceworker-internals
  console.log('Handling install event. Resources to prefetch:', urlsToPrefetch);

  event.waitUntil(
    caches.open(CURRENT_CACHES.prefetch).then(function(cache) {
      var cachePromises = urlsToPrefetch.map(function(urlToPrefetch) {
        // This constructs a new URL object using the service worker's script location as the base
        // for relative URLs.
        var url = new URL(urlToPrefetch, location.href);
        // Append a cache-bust=TIMESTAMP URL parameter to each URL's query string.
        // This is particularly important when precaching resources that are later used in the
        // fetch handler as responses directly, without consulting the network (i.e. cache-first).
        // If we were to get back a response from the HTTP browser cache for this precaching request
        // then that stale response would be used indefinitely, or at least until the next time
        // the service worker script changes triggering the install flow.
        url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;

        // It's very important to use {mode: 'no-cors'} if there is any chance that
        // the resources being fetched are served off of a server that doesn't support
        // CORS (http://en.wikipedia.org/wiki/Cross-origin_resource_sharing).
        // In this example, www.chromium.org doesn't support CORS, and the fetch()
        // would fail if the default mode of 'cors' was used for the fetch() request.
        // The drawback of hardcoding {mode: 'no-cors'} is that the response from all
        // cross-origin hosts will always be opaque
        // (https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cross-origin-resources)
        // and it is not possible to determine whether an opaque response represents a success or failure
        // (https://github.com/whatwg/fetch/issues/14).
        var request = new Request(url, {mode: 'no-cors'});
        return fetch(request).then(function(response) {
          if (response.status >= 400) {
            throw new Error('request for ' + urlToPrefetch +
              ' failed with status ' + response.statusText);
          }

          // Use the original URL without the cache-busting parameter as the key for cache.put().
          return cache.put(urlToPrefetch, response);
        }).catch(function(error) {
          console.error('Not caching ' + urlToPrefetch + ' due to ' + error);
        });
      });

      return Promise.all(cachePromises).then(function() {
        console.log('Pre-fetching complete.');
      });
    }).catch(function(error) {
      console.error('Pre-fetching failed:', error);
    })
  );
});

self.addEventListener('activate', function(event) {
  // Delete all caches that aren't named in CURRENT_CACHES.
  // While there is only one cache in this example, the same logic will handle the case where
  // there are multiple versioned caches.
  var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
    return CURRENT_CACHES[key];
  });

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (expectedCacheNames.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            console.log('Deleting out of date cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  console.log('Handling fetch event for', event.request.url);

  event.respondWith(
    // caches.match() will look for a cache entry in all of the caches available to the service worker.
    // It's an alternative to first opening a specific named cache and then matching on that.
    caches.match(event.request).then(function(response) {
      if (response) {
        console.log('Found response in cache:', response);

        return response;
      }

      console.log('No response found in cache. About to fetch from network...');

      // event.request will always have the proper mode set ('cors, 'no-cors', etc.) so we don't
      // have to hardcode 'no-cors' like we do when fetch()ing in the install handler.
      return fetch(event.request).then(function(response) {
        console.log('Response from network is:', response);

        return response;
      }).catch(function(error) {
        // This catch() will handle exceptions thrown from the fetch() operation.
        // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
        // It will return a normal response object that has the appropriate error code set.
        console.error('Fetching failed:', error);

        throw error;
      });
    })
  );
});

*/




// ADD ROUTES
/*

NO SUPPORT FIREFOX AND SAFARI
CHROME AND OPERA 


addEventListener("install", (event) => {
  event.addRoutes({
    condition: {
      urlPattern: "/articles/*",
      runningStatus: "not-running",
    },
    source: "network",
  });
});




// CACHE Bypass
addEventListener("install", (event) => {
  event.addRoutes({
    condition: {
      urlPattern: "/form/*",
      requestMethod: "post",
    },
    source: "network",
  });
});



// GET and PUT
addEventListener("install", (event) => {
  event.addRoutes({
    condition: {
      or: [{ urlPattern: "*.png" }, { urlPattern: "*.jpg" }],
    },
    source: {
      cacheName: "pictures",
    },
  });
});



addEventListener("install", (event) => {   // only when get
  event.addRoutes(
    {
      condition: {
        urlPattern: "*.png",
        requestMethod: "get",
      },
      source: {
        cacheName: "pictures",
      },
    },
    {
      condition: {
        urlPattern: "*.jpg",
        requestMethod: "get",
      },
      source: {
        cacheName: "pictures",
      },
    },
  );
});





ROUTES IN IFRAMES

history.replace(path);

*/


