




class Messages {

    constructor() {
        this.requester_map = {}
        this.direction_map = {}
        this.relationship_map = {}
        //
        this.accepted_receivers = {}
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

    tell_concerned_app_loaded(data) {
        if ( typeof data === "string" ) {

        }
    }

}




class PageResponse extends Messages {
    //
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
        this.self.addEventListener("message", (event) => {
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
                                    let status = this.reponding_alive(mobj.requester)  // collection or singleton
                                    if ( !status ) {
                                        this.alert_failed_delivery("reponding_alive",mobj.requester)
                                    } else {
                                        this.tell_concerned_app_loaded(mobj.data)
                                    }
                                }
                            } else if ( (this.match_category ? (category === this.match_category) : false) ) {
                                this.default_category_message_handlers(action,relationship,params,mobj)
                            } else {
                                this.message_handlers(category,action,relationship,params,mobj)
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
    message_handlers(category,action,relationship,params,mobj) {}
    default_category_message_handlers(category,action,relationship,params) {}

    reponding_alive(requester) {
        let message = {
            "category": this.match_alive,
            "action" : this.match_responding,
            "data" : false
        }
        this.tell_requesting_page(message,requester)
    }


    set_globals(gs) {
        this._g = gs
    }

}
