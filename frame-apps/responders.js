

/**
 * 
 */
class Messages {

    /**
     * 
     */
    constructor() {
        this.requester_map = {}
        this.direction_map = {}
        this.relationship_map = {}
        //
        this.accepted_receivers = {}
        //
        this._messages_queues = {}
        //
        this._message_template = {
            "category" : "",
            "direction" : "",
            "action" : "",
            "relationship" : ""
        }
        //
        this.filter_matching = '*'
        this._g = {}

        // The responder table with some defaults
        this.responder_tables = {
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
        this.default_removal_timeout = 50
        //
    }
    

    /**
     * 
     * @param {object} message_receiver 
     * @param {string} receiver_id 
     * @param {string} direction 
     * @param {string} relationship 
     */
    add_receiver(message_receiver,receiver_id,direction,relationship) {
        this.requester_map[receiver_id] = message_receiver
        this.direction_map[receiver_id] = direction
        this.relationship_map[receiver_id] = relationship
    }

    /**
     * 
     * @param {string} receiver_id 
     */
    add_accepted_receiver(receiver_id) {
        let p = this.accepted_receivers[receiver_id]
        this.accepted_receivers[receiver_id] = p ? (p + 1) : 1
    }


    /**
     * 
     * @param {*} receiver_id 
     */ 
    add_message_queue(receiver_id) {
        this._messages_queues[receiver_id] = []
    }


    /**
     * 
     * @param {string} message 
     * @param {string} requester 
     * @returns {boolean}
     */
    tell_requesting_page(message,requester) {
        //
        let receiver = this.requester_map[requester]
        if ( receiver === undefined ) return(false)
        let direction = this.direction_map[requester]
        if ( direction === undefined  ) return(false)
        let relationship = this.relationship_map[requester]
        if ( relationship === undefined ) return(false)
        //
        msg.direction = direction
        let msg = Object.assign({},this._message_template)
        msg.relationship = relationship
        msg.action = message.action
        msg.category = message.category
        msg.data = message.data
        let message_str = JSON.stringify(msg)
        receiver.postMessage(message_str,this.filter_matching)
        //
        return true
    }

    // ---- ---- ---- ---- ---- ---- ---- ----

    alert_failed_delivery(where,who) {}


    // ---- ---- ---- ---- ---- ---- ---- ----

    /**
     * (OVERRIDE)
     * @param {string} data 
     * @param {string} sender_id 
     */
    tell_concerned_app_loaded(data,sender_id) {
        if ( typeof data === "string" ) {
            let message = {
                "category": FRAME_COMPONENT_SAY_ALIVE,
                "action" : FRAME_COMPONENT_RESPONDING,
                "data" : false
            }
            this.tell_requesting_page(message,sender_id)
        }
    }



    /**
     * 
     * This method is used by message handlers in order to stop and wait for 
     * a message receiver to send something back. 
     * 
     * The resolution is the object that the handler sends back on a response pathway.
     * 
     * The resolve and reject calls for the promise are handled fairly simply by setting aside these functions
     * in a table as an entry keyed on the messenger's readable identifier. The respondder functions remove themselves
     * from the table when they are finally called. 
     * 
     * @param {string} source_name 
     * @returns {boolean} -- after resolution
     */
    promise_handling(source_name) {
        if ( this.responder_tables[source_name] !== undefined ) {  // do we implement this entry?
            let p = new Promise((resolve,reject) => {
                this.responder_tables[source_name].resolver = (resp_obj) => {
                    this.responder_tables[source_name] = {
                        "resolver" : false,
                        "rejector" : false            
                    }
                    resolve(resp_obj)
                }
                this.responder_tables[source_name].rejector = () => {
                    this.responder_tables[source_name] = {
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


    /**
     * Applications can manage their own list of responders for use in their code.
     * They can added responders to the table.
     * 
     * @param {string} source_name -- the name of a message receiver that will send this identifier in response messages
     */
    add_promise_handler(source_name) {
        this.responder_tables[source_name] = {
            "resolver" : false,
            "rejector" : false            
        }
    }


    /**
     * Applications can manage their own list of responders for use in their code.
     * They can remove responders from the table.
     * 
     * *force*, is optional and, if set to true, and a promise is outstanding, this method will attempt to reject the promise
     * before removing the hanlder from the table
     * 
     * If the timeout is passed and is negative and the table is busy, the method will not attempt the operation, 
     * and the application may call upon it at a later time.
     * 
     * If the time out is not passed and the table is busy, then an abitrary timeout value (50msec) is used to wait for 
     * the next attempt
     * 
     * @param {string} source_name -- the name of a message receiver that will send this identifier in response messages
     * @param {boolean} force -- (optional) 
     * @param {number} timeout -- (optional) how long to wait until the table entry is not busy
     * @returns {number} -- -1 if the promise is first rejected, 0 if the operation is abandoned, 1 otherwise
     */
    remove_promise_handler(source_name,force,timeout) {
        if ( this.responder_tables[source_name].resolver === false ) {
            delete this.responder_tables[source_name]
        } else {
            if ( force ) {
                try {
                    this.responder_tables[source_name].rejector()
                    return(1)
                } catch(e) {
                    return(-1)
                }
            } else {
                let tout = timeout ? timeout : this.default_removal_timeout /// abitraty 50msec
                if ( tout < 0 ) {
                    return 0
                }
                let self = this
                setTimeout(() => { self.remove_promise_handler(source_name,force,timeout) },tout)
            }
        }
        return(1)
    }


}


/**
 * 
 */
class PageResponse extends Messages {
    //
    /**
     * 
     * @param {object} conf 
     */
    constructor(conf) {
        super()
        //
        this.match_direction = conf.direction
        this.match_category = conf.category
        this.match_relationship = conf.relationship
        //
        this.match_alive = conf.alive_category
        this.match_alive_requires_response = conf.alive_requires_response
        this.match_responding = conf.signal_responding
        //
        //
        this.self = false           // the context self (which may be self in a worker or window in the main) 
        if ( conf.self ) {
            this.self = conf.self
        } else {
            if ( typeof window !== undefined ) {
                 this.self = window
            }
            if ( typeof self !== undefined ) {
                 this.self = self
            }
        }
        //
        this.page_source_match = "*"        // This is a match directive, show which messages a page will respond to
        if ( conf.page_source ) {
            this.page_source_match = conf.page_source  // it will look at all messages if left as *, but will accept a formula from the conf
        }
    }
    //
    //
    /**
     * Main pages, frames, workers, etc. respond to the message event. 
     * But it must be initialized.
     * 
     */
    install_response() {
        this.self.addEventListener("message", async (event) => {
            let page_source = event.origin

            if ( page_source !== this.page_source_match ) {
                try {
                    let mobj = JSON.parse(event.data)
                    let category = mobj.category
                    let relationship = mobj.relationship
                    let action = mobj.action
                    let direction = mobj.direction
                    let sender_id = mobj.sender_id
                    let params = mobj.data
                    //
                    if ( sender_id in this.accepted_receivers ) {
                        this.add_receiver(event.source,sender_id,direction,relationship)
                    }
                    //
                    if ( (this.match_direction ? (direction === this.match_direction) : true) ) {
                        if ( (this.match_relationship ? (relationship === this.match_relationship) : true) ) {
                                    //
                            if ( category === this.match_alive ) {
                                if ( action === this.match_alive_requires_response ) {
                                    let status = this.responding_alive(mobj.requester)  // collection or singleton
                                    if ( !status ) {
                                        this.alert_failed_delivery("responding_alive",mobj.requester)
                                    } else {
                                        this.tell_concerned_app_loaded(mobj.data,sender_id)
                                    }
                                }
                            } else if ( (this.match_category ? (category === this.match_category) : false) ) {
                                await this.default_category_message_handlers(action,relationship,params,mobj)
                            } else {
                                await this.message_handlers(category,action,relationship,params,mobj)
                            }
                        }
                    }
                } catch (e) {
                }    
            }
        })
    }

    /**
     * 
     * @param {string} category 
     * @param {string} action 
     * @param {string} relationship 
     * @param {object} params 
     * @param {object} mobj -- The original event.data object, which is sometimed edited and sent back or forwarded
     */
    async message_handlers(category,action,relationship,params,mobj) {}
    async default_category_message_handlers(category,action,relationship,params,mobj) {}

    /**
     * 
     * @param {string} requester 
     */
    responding_alive(requester) {
        let message = {
            "category": this.match_alive,
            "action" : this.match_responding,
            "data" : false
        }
        this.tell_requesting_page(message,requester)
        let q = this._messages_queues[requester]
        if ( q && Array.isArray(q) ) {
            while ( q.length > 0 ) {
                let msg = q.shift()
                this.tell_requesting_page(message,requester)
            }
        }
    }

    /**
     * 
     * @param {object} gs - reference to the global variable application object
     */
    set_globals(gs) {
        this._g = gs
    }

}
