
// SERVICE WORKER

function postDataFromThePage() {}  // TBD


const LOGIN_URL = `https://cloud.copious.world/login`
const APPLICATION_URL = `https://cloud.copious.world/pwa/market-place/`

if ( !('serviceWorker' in navigator) ) {
    let main_contaier = document.getElementById("app-sourcing")
    main_contaier.innerHTML = "Sorry... this browser does not support progressive web applications"
} else {

    const HUMAN_PAGE_UPDATE = 'human-page-update'

    async function service_worker_message_handler(msg_event) {
        let data = msg_event.data
        let origin = msg_event.origin
        let id = msg_event.lastEventId
        let sourceObj = msg_event.source // ... the actual object to which a message may be sent...
        let ports = msg_event.ports  // list of MessagePort objects
        // what to do
    }


    async function service_worker_error_handler(msg_event) {
        let data = msg_event.data
        let origin = msg_event.origin
        let id = msg_event.lastEventId
        let sourceObj = msg_event.source // ... the actual object to which a message may be sent...
        let ports = msg_event.ports  // list of MessagePort objects
        // what to do
        console.error("Receive message from service worker failed!");
    }

    // ---- ---- ---- ---- ---- ---- ----
    //
    function logState(state) {
        console.log(state)
    }

    //
    navigator.serviceWorker.onmessage = (m_evnt) => {
        service_worker_message_handler(m_evnt)
    }

    navigator.serviceWorker.onmessageerror = (em_evnt) => {
        service_worker_error_handler(em_evnt)
    };

    // navigator.serviceWorker.startMessages();  done when setting up the handler


    // Events from the serive worker
    navigator.serviceWorker.oncontrollerchange = () => {
        console.log('This page is now controlled by:', navigator.serviceWorker.controller);
        var msg = {
            'human-page-update': true
        }
        navigator.serviceWorker.controller.postMessage(msg)
    };


    // ---- ---- ---- ---- ---- ---- ----
    //
    async function init_service_worker() {
        try {
            //
            //
            let options = {
                scope : "./",
                type : "classic",
                updateViaCache : "all"
            }
            // The service worker gets fetched from the HTTPS server
            let registration = await navigator.serviceWorker.register('./service-worker.js',options)
            console.log('Service Worker is registered!')
            // now the lifecycle begins ver a new version
            registration.onupdatefound = (ev) => {    // what to do if the server has a new version
                //
                let serviceWorker;
                if ( registration.installing ) {
                    // the service worker has been fetched from the server during registration
                    // now get stuff that goes into cache... this tell the client about it
                    serviceWorker = registration.installing;
                    //document.getElementById("lifecycle-report").textContent = "installing";
                } else if ( registration.waiting ) {
                    // waiting for clients to quit using the old version (installed and activating)
                    // clear out the old caches any final setup processes
                    document.querySelector("#kind").textContent = "waiting";
                    //document.getElementById("lifecycle-report").textContent = "waiting";
                } else if ( registration.active ) {
                    // finally active -- new clients can interact with the service worker (messages and events)
                    serviceWorker = registration.active;
                    //document.getElementById("lifecycle-report").textContent = "active";
                }
                //
                logState(serviceWorker.state);
                serviceWorker.onstatechange = (evn) => {
                    logState(evn.target.state); 
                    // one of 
                    // "parsed",
                    // "installing"
                    // "installed"
                    // "activating"
                    // "activated"
                    // "redundant"
                }
                //
            }
        } catch (e) {
            console.log("failed to register service sworker")
            console.log(e)
        }
        //
    }

    async function ready_service_worker() {
        //
        try {
            let registration = await navigator.serviceWorker.ready
            if ( registration.sync ) {
                let tags = await registration.sync.getTags()
                const contained_page = HUMAN_PAGE_UPDATE
                if ( !(tags.includes(contained_page)) ) {
                    await registration.sync.register(contained_page)
                }
            } else {
                postDataFromThePage();
            }
        } catch (e) {
            postDataFromThePage(e);
        }
        //
    }


    window.onload = async (evn) => {
        await init_service_worker()
        await ready_service_worker()
    }

}


//
window.addEventListener('online', () => {
                        if ( navigator.serviceWorker.controller ) {
                            var msg = {
                                'sendSongs': true
                            }
                            navigator.serviceWorker.controller.postMessage(msg)  // <--- This line right here sends our data to sw.js
                        }
                    });
//
window.addEventListener('offline', () => {
                        //alert('You have lost internet access!');
                    });


// END OF SERVICE WORKER
