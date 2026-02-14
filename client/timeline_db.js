
class TimeLineDB extends AppDBWrapper {
	//
	constructor(conf) {
		super("human-timeslot-records",conf)
		this.current_session_name = conf.time_slot_sessions
		this.current_time_slot_name = ""
		this.current_description = ""
		this.current_file_list = []
		//
		this.current_time_slot = false
		this.current_time_slot_data = false
		//
		this.clear_identity_list_data()
	}

	async add_time_slot(time_slot_object) {
		let part_id = time_slot_object.name
		let blob_data = time_slot_object
		blob_data = JSON.stringify(blob_data)
		return await this.add_data(blob_data,part_id)
	}

	async update_time_slot(time_slot_object) {  // db will update the found object or add it new
		await this.add_time_slot(time_slot_object)
	}

	async get_time_slot(a_time_slot_name) {
		try {
			let time_slot_Obj_str = await this.get_data(a_time_slot_name,this.current_session_name)
			let time_slot_Obj = JSON.parse(time_slot_Obj_str)
			if ( time_slot_Obj ) {
				//
				this.current_time_slot = time_slot_Obj
				//
				this.current_time_slot_name = time_slot_Obj.name
				//
				return time_slot_Obj
			}
		} catch (e) {
			console.log("get_time_slot")
		}
		return false
	}



	//
	async remove_time_slot() {
		return await this.remove_data(this.current_time_slot_name,this.current_session_name)
	}

	// 
	async get_time_slot_names() {
		let sess_name = this.current_session_name
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

	async get_slot_entries() {
		let sess_name = this.current_session_name
		try {
			let sess_data = await this.get_session(sess_name)
			if ( sess_data ) {
				let t_slots = []
				for ( let ky in sess_data.data ) {
					let f_data = sess_data.data[ky]
					t_slots.push(JSON.parse(f_data))
				}
				return t_slots
			}
		} catch (e) {
			console.log("get_file_entries")
		}
		return []    
	}

	// // // // // // // // // // // // // // // // // // // // // // // // // // // // 

	app_add_fields(sessionObj) {
		//sessionObj.project_name = this.current_time_slot_name
		//sessionObj.author = this.current_author
		//sessionObj.description = this.current_description
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

	application_update_session_name_selections(sess_name,name_list) {}

	clear_identity_list_data() {
		this.identity_list = []
		this.time_line_list = []
	}

	application_total_entry(session_object) {
		///this.identity_list.push(identity)
		this.time_line_list.push(session_object.data)
	}

	async get_known_time_lines() {
		this.clear_identity_list_data()
		await g_human_time_slot_storage.load_name_list()
		return [this.time_line_list,this.identity_list]
	}

}

