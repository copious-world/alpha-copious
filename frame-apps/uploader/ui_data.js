


/**
 * Specically file data from the user interface... (one that follows web standards)
 */
class DataFromUi {

	constructor() {
		this._user_id = false
		this._current_asset_history = false
		this._current_asset_prev_text = ""
		this._current_asset_text_ucwid_info = false
	}

    /**
     * Gets information from the file object, created by web page standard UI methods.
     * @param {string} name 
     * @param {object} file_record -- from a file upload 
     * @returns {boolean} - after a promise resolution
     */
	get_file(name,file_record) {
		//
		if ( name.length ) {
			if ( file_record.blob ) {
				let basename = name.substring(0,name.lastIndexOf('.'))
				let ext = name.replace(basename + '.','')
				let loaded = {
					"blob_url" : file_record.blob,
					"name" : basename,
					"ext" : ext,
					"mtype" : file_record.type,
					"size" : file_record.size,
					"file" : {
						"lastModified" : file_record.lastModified
					}
				}
				return loaded
			} else {
				return new Promise((resolve,reject) => {
					let file = file_el.files[0]
					let fname =  file.name
					let mtype = file.type
					let reader = new FileReader();
					let file_copy = Object.assign({},file)
					for ( let ky in file ) { 
						if ( ky === 'arrayBuffer' ) continue
						if ( ky === 'slice' ) continue
						if ( ky == 'stream' ) continue
						if ( ky == 'text' ) continue
						if ( ky == 'webkitRelativePath' ) continue
						file_copy[ky] = file[ky]
					}
					reader.onload = (e) => {
						let basename = fname.substring(0,fname.lastIndexOf('.') + 1)
						let ext = fname.replace(basename + '.','')
						let loaded = {
							"blob_url" : e.target.result,
							"name" : basename,
							"ext" : ext,
							"mtype" : mtype,
							"size" : file_copy.size,
							"file" : file_copy
						}
						resolve(loaded)
					};
					reader.readAsDataURL(file)
				})
			}
		}
		//
		return false
	}


   /**
    * Set the user id (the one with a session)
    * The object will manage data for that one user
    * @param {string} uid 
    */ 

	set_user_id(uid) {
		this._user_id = uid
	}

	//  ----  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    /**
     * Creates a complete meta descriptor for upload to the asset management pathways of the server
     * This is the full authorized description of the meta data.
     * 
     * @param {object} field_vars 
     * @returns {object}
     */
	async gather_fields(field_vars) {
		//
		if ( this._user_id === false ) {
			return false
		}
		//
		let upload_record = {}
		try {
			let asset_pair = field_vars['rec-file-mtype']
			let title = field_vars['rec-title']
			let subject = field_vars['rec-subject']
			let keys = field_vars['rec-keys']
			let abstract = field_vars['rec-abstract']
			let full_text = field_vars['rec-full-text']
			//
			let paid = field_vars['paid-checkbox']
			let WIP = field_vars['WIP-checkbox']
			let contract = field_vars['rec-contract']
			//
			let name = field_vars['rec-file-name']
			let file_proper = field_vars['rec-file-proper']
			let poster = field_vars['rec-poster-name']
			let poster_file_proper = field_vars['rec-poster-proper']
			//
			let been_published = field_vars['rec-was-published']
			let uploaded = field_vars['rec-was-uploaded']

			let protocol = field_vars['rec-default-protocol']  
			if ( !protocol ) {
				protocol = "p2p-default"
			}
			//
			if ( title.length === 0 ) return false
			if ( subject.length === 0 ) return false
			if ( asset_pair.length === 0 ) return false
			let [asset_type,media_type] = asset_pair.split('/')
			/*
				stream/audio
				stream/video
				stream/image
				blog/text
				music_buzz/text
			*/
			let media_data = await this.get_file(name,file_proper)
			let poster_data = await this.get_file(poster,poster_file_proper)        // file names for stream type media

			if ( (media_type !== 'text') && (media_data === false) && (poster === false) ) {
				return false
			}
			if ( ( media_type === 'text' ) && ( full_text.length === 0 ) ) {
				return false
			} else if ( media_type !== 'text' ) {
				full_text = name
			}
			//
			let modDate = media_data ? media_data.file.lastModified : ( poster_data ? poster_data.file.lastModified : Date.now())
			//
			keys = keys.split(' ').filter( key => {
				let ok = (key !== undefined)
				if ( ok ) ok = (key.length > 2)
				return ok
			})
			keys = keys.map(key => {
				key = trim_punct(key)
				key = key.trim()
				return(key)
			})
			keys = keys.filter( key => {
				let ok = (key !== undefined)
				if ( ok ) ok = (key.length > 2)
				return ok
			})
			keys = keys.map(key => {
				key = encodeURIComponent(key)
				return(key)
			})
			//
			let tracking = ""       // if it has been created
			let tracker = field_vars["asset-id"]
			if ( tracker ) {
				let t = tracker.value
				if ( t.length ) tracking = t
			}
			//
			let exclusion_fields = [
				"_history","_prev_text",
				"_transition_path", "encode",
				"media.poster.ucwid_info", "media.source.ucwid_info",
				"media.poster.protocol", "media.source.protocol",
				`media.poster.${protocol}`, `media.source.${protocol}`
			]
			let repository_fields = [ "media.source", "media.poster" ]  // field that contain id's useful to pin object at the server
			//
			upload_record = {
				"_tracking" : tracking,             // tracking of the asset
				"_id" :  this._user_id,             // should be a UCWID
				"_author_tracking" :  this._author_tracking,
				"_paid" : paid,
				"_contract" : contract,
				"_work_in_progress" : WIP,
				"_transition_path" : "asset_path",
				"asset_path" : `${tracking}+${asset_type}+${this._user_id}`,
				"title" : encodeURIComponent(title),
				"subject" : encodeURIComponent(subject),
				"keys" : keys,
				"asset_type" : asset_type,        // blog, stream, link-package, contact, ownership, etc...
				"media_type" : media_type,        // text, audio, video, image
				"abstract" : encodeURIComponent(abstract),
				"media" : {
					"poster" : poster_data,
					"source" : media_data
				},
				"encode" : true,
				"txt_full" : encodeURIComponent(full_text),
				"dates" : {
					"created" : Date.now(),
					"updated" : modDate
				},
				"_history" : this._current_asset_history ? this._current_asset_history : [],
				"_prev_text" : this._current_asset_prev_text,
				"text_ucwid_info" : this._current_asset_text_ucwid_info,
				"repository_fields" : repository_fields,
				"exclusion_fields" : exclusion_fields
			}
			this._current_asset_history = false   // reset it when it is retrieved
			//    
		} catch (e) {
			return false
		}

		return(upload_record)
	}


	//  ----  ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    /**
     * Creates a partial meta descriptor for upload to the asset management pathways of the server
     * This is enough data to carry out an operation on an asset already stored on the server.
     * 
     * @param {object} field_vars 
     * @returns {object}
     */
	async gather_identifying_fields(field_vars) {
		//
		if ( this._user_id === false ) {
			return false
		}
		//
		let upload_record = {}
		try {
			let tracker = field_vars["asset-id"]
			let asset_pair = field_vars['rec-file-mtype']
			if ( asset_pair.length === 0 ) return false
			//
			let [asset_type,media_type] = asset_pair.split('/')
			/*
				stream/audio
				stream/video
				stream/image
				blog/text
				music_buzz/text
			*/
			//
			//
			let tracking = ""       // if it has been created
			if ( tracker ) {
				let t = tracker.value
				if ( t.length ) tracking = t
				else return false
			}

			let paid = field_vars['paid-checkbox']
			let WIP = field_vars['WIP-checkbox']
			let contract = field_vars['rec-contract']

			//
			let exclusion_fields = [  // fields excluded from searching services.
				"_history","_prev_text",
				"_transition_path", "encode",
				"media.poster.ucwid_info", "media.source.ucwid_info",
				"media.poster.protocol", "media.source.protocol",
				"media.poster.ipfs", "media.source.ipfs"
			]

			//
			upload_record = {
				"_tracking" : tracking,
				"_id" :  this._user_id,
				"_paid" : paid,
				"_contract" : contract,
				"_work_in_progress" : WIP,
				"_transition_path" : "asset_path",
				"asset_path" : `${tracking}+${asset_type}+${this._user_id}`,
				"asset_type" : asset_type,        // blog, stream, link-package, contact, ownership, etc...
				"media_type" : media_type,
				"exclusion_fields" : exclusion_fields
			}
			//
		} catch (e) {
			return false
		}

		return(upload_record)
	}


	// put_fields ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    /**
     * 
     * @param {object} obj - existing document meta descriptor
     * @param {object} field_vars - values for a meta descriptor from a UI form as a map
     * @returns {boolean}
     */
	put_fields(obj,field_vars) {
		let opt_fld = field_vars['rec-file-mtype']
		let title_fld = field_vars['rec-title']
		let subject_fld = field_vars['rec-subject']
		let keys_fld = field_vars['rec-keys']
		let abstract_fld = field_vars['rec-abstract']
		let full_text_fld = field_vars['rec-full-text']
		let file_name_fld = field_vars['rec-file-name']
		let poster_name_fld = field_vars['rec-poster-name']
		let paid_fld = field_vars['paid-checkbox']
		let WIP_fld = field_vars['WIP-checkbox']
		let contact_fld = field_vars['rec-contract']

		if ( !(opt_fld && title_fld && keys_fld && abstract_fld && full_text_fld && file_name_fld  && poster_name_fld) ) return false
		
		title_fld.value = decodeURIComponent(obj.title)
		subject_fld.value = decodeURIComponent(obj.subject)
		keys_fld.value = decodeURIComponent(obj.keys)
		opt_fld.value = [obj.asset_type,obj.media_type].join('/')
		abstract_fld.value = decodeURIComponent(obj.abstract)
		full_text_fld.value = decodeURIComponent(obj.txt_full)

		if ( paid_fld )  {
			paid_fld.setAttribute("checked",obj._paid)
		}
		if ( paid_fld )  {
			paid_fld.setAttribute("checked",obj._work_in_progress)
		}

		this._current_asset_history = obj._history
		this._current_asset_prev_text = obj.txt_full
		this._current_asset_text_ucwid_info = obj.text_ucwid_info ? obj.text_ucwid_info : false

        return true
	}


    /**
     * 
     * @param {object} field_vars 
     * @returns {object}
     */
	async gather_asset_fields(field_vars) {
		//
		let upload_record = {}
		try {
			let asset_id = field_vars['asset-id']
			upload_record._id = asset_id
		} catch (e) {
			return false
		}
		return upload_record
	}

}


