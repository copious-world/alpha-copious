// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// MODULE: USER DB   (windowized)
//


/*
    // stored packet
    id_packet = {
        "name": name,
        "DOB" : DOB,
        "place_of_origin" : place_of_origin,
        "public_information" : public_information, 
        "business" : (business === undefined) ? false : business, 
        "public_key" : public_key,
        "signer_public_key" : signer_public_key,
        "axiom_public_key" : axiom_public_key,
        "ccwid" : "aksbsdkufhsiufkesh",
        "public_component" : {
            "name" : "Mr. Jones",
            "place_of_origin" : place_of_origin, 
            "ccwid" : "aksbsdkufhsiufkesh",
            "business" : (business === undefined) ? false : business,
            "public_key" : public_key,
            "signer_public_key" : signer_public_key,
            "axiom_public_key" : axiom_public_key
            "human_frame_url" : human_frame_url
        },
        "private" : {
            "ccwid" : "aksbsdkufhsiufkesh",
            "ucwid" : ucwid,
            "private_key" : "soifw09ruwkrw9i",
            "biometric" : biometric_blob
        },
        "assets" : {
            "localhost:5010" : {
                "images" : {
                    "picture.jpg" : {}
                },
                "audio" : {
                    "song.mp3" : {}
                },
                "video" : {
                    "movie1.mov" : {}
                },
                "text" : {
                    "absract1.txt" : {}
                },
                "code" : {
                    "file1.c" : {}
                }
            }
        }
    }
*/


function identity_fn(data) {
    return data
}

let g_contacts = {}
function set_contact_map(contacts_map) {
    g_contacts = contacts_map
}

function contact_from_ucwid(user_ucwid) {
    let c = g_contacts[user_ucwid]
    return c
}

function name_key_of(user_info) {
    if ( (user_info.name === undefined) || (user_info.DOB === undefined) ) {
        return false
    }
    let name_key = `${user_info.name}-${user_info.DOB}`
    return name_key
}

function value_fallback(value) {
    let vv = value ? value : ""
    return vv
}


class HumanUserDB extends AppDBWrapper {

    constructor(conf) {
        super("human-user-records",conf)
        this.current_user_name = ""
        this.current_description = ""
        this.current_file_list = []
        //
        this.current_user_object = false
        this.current_user_data = false
        //
        this.clear_identity_list_data()
    }

    async add_user(user_object) {
        this.current_session_name = (user_object.name !== undefined) ? user_object.name : user_object.human_name
        if ( user_object.name === undefined ) {
            user_object.name = this.current_session_name
        }
        let part_id = "user-meta"
        //
        let blob_data = user_object
        //
        blob_data = JSON.stringify(blob_data)
        await this.add_data(blob_data,part_id)
    }

    async update_user(user_object) {
        await this.add_user(user_object)
    }

    async get_user(sel_user) {
        try {
            let user_Obj = await this.get_session(sel_user)
            if ( user_Obj ) {
                //
                this.current_user_object = user_Obj
                //
                this.current_user_name = user_Obj.name
                //
                this.current_session_name = user_Obj.name
                //
                this.current_user_info = user_Obj.user_info
                //
                this.current_user_data = user_Obj.data
                //
                this.current_file_list = []
                let data_map = user_Obj.data
                for ( let part_id in data_map ) {
                    if ( part_id !== "user-meta" ) {
                        this.current_file_list.push(JSON.parse(data_map[part_id]))
                    }
                }
                //
                return user_Obj
            }
        } catch (e) {
            console.log("get_user")
        }
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
    async add_file(file_name,description,svg,to_layer,file_data) {
        if ( file_data === undefined ) file_data = ""
        if ( svg === undefined ) svg = ""
        if ( to_layer == undefined ) to_layer = 0
        let file_record = {
            "name" : file_name, 
            "description" : description,
            "data" : file_data, "ouput" : "", "svg" : svg, "layer" : to_layer
        }
        //
        let data = JSON.stringify(file_record)
        await this.add_data(data,file_name)
    }

    //
    async remove_file(file_name) {
        this.current_session_name = this.current_user_name
        await this.remove_data(file_name,this.current_user_name)
    }

    //
    async remove_user() {
        this.current_session_name = this.current_user_name
        await this.delete_session(this.current_user_name)
    }

    // 
    async get_file_names() {
        let sess_name = this.current_session_name
        try {
            let sess_data = await this.get_session(sess_name)
            if ( sess_data ) {
                let f_names = Object.keys(sess_data.data)
                f_names = f_names.filter(ky => { return (ky !== 'user-meta') })
                return f_names
            }    
        } catch (e) {
            console.log("get_file_names")
        }
        return []
    }

    async get_file_entries() {
        let sess_name = this.current_session_name
        try {
            let sess_data = await this.get_session(sess_name)
            if ( sess_data ) {
                let f_names = Object.keys(sess_data.data)
                f_names = f_names.filter(ky => { return (ky !== 'user-meta') })
                let f_objs = []
                for ( let ky of f_names ) {
                    let f_data = sess_data.data[ky]
                    let fobj = JSON.parse(f_data)
                    f_objs.push(fobj)
                }
                return f_objs
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

    }


    clear_identity_list_data() {
        this.identity_list = []
        this.user_list = []
    }

    application_total_entry(identity) {
        this.identity_list.push(identity)
        this.user_list.push(identity.user_info)
    }

    // get_known_users -- there should be just one user of this page...    

    async get_known_users() {
        this.clear_identity_list_data()
        await g_human_user_storage.load_name_list()
        return [this.user_list,this.identity_list]
    }

}
