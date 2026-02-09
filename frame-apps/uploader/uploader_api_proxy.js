


// FUNTIONS REQUIRED :: dependency
/*
    some_def
*/


/**
 * 
 */
class Proxy {

	constructor(app_instance) {

        this._app = app_instance

		//
		this.new_entry_link = {
			"link" : "",
			"secondary_link" : ""
		}
		this.get_entry_link = {
			"link" : "",
			"secondary_link" : ""
		}
		this.update_entry_link = {
			"link" : "",
			"secondary_link" : ""
		}

		this.delete_entry_link = {
			"link" : "",
			"secondary_link" : ""
		}
		this.publish_entry_link = {
			"link" : "",
			"secondary_link" : ""
		}
		this.unpublish_entry_link = {
			"link" : "",
			"secondary_link" : ""
		}
		this.get_user_ready_link = {
			"link" : "",
			"secondary_link" : ""
		}

	}

	set_links(link_conf) {
		this.new_entry_link = {
			"link" : some_def(link_conf.new_entry.link),
			"secondary_link" : some_def(link_conf.new_entry.secondary_link)
		}
		this.get_entry_link = {
			"link" : some_def(link_conf.get_entry.link),
			"secondary_link" : some_def(link_conf.get_entry.secondary_link),
		}
		this.update_entry_link = {
			"link" : some_def(link_conf.update_entry.link),
			"secondary_link" : some_def(link_conf.update_entry.secondary_link),
		}

		this.delete_entry_link = {
			"link" : some_def(link_conf.delete_entry.link),
			"secondary_link" : some_def(link_conf.delete_entry.secondary_link),
		}
		this.publish_entry_link = {
			"link" : some_def(link_conf.publish_entry.link),
			"secondary_link" : some_def(link_conf.publish_entry.secondary_link),
		}
		this.unpublish_entry_link = {
			"link" : some_def(link_conf.unpublish_entry.link),
			"secondary_link" : some_def(link_conf.unpublish_entry.secondary_link),
		}
		this.get_user_ready_link = {
			"link" : some_def(link_conf.get_user.link),
			"secondary_link" : some_def(link_conf.get_user.secondary_link),
		}
	}

	async new_entry(good_data) {
		// to transitions 
		let uploadable = {
			"meta" : good_data		// good data already has urls for BLOBs representing the media to upload
			// file entries, etc/	
		}
		let [result,pid] = await this._app.send_new_entry(uploadable,this.new_entry_link,good_data.asset_type)
		if ( result.status === "OK" ) {
			return result.tracker
		}
	}


	async get_entry(good_data) {
		let uploadable = {
			"meta" : good_data
			// file entries, etc/	
		}
		let result = await this._app.send_publication_command("get",uploadable,this.get_entry_link)
		if ( result.status === "OK" ) {
			return result.tracker
		}
	}

	async update_entry(good_data) {
		good_data.update = true   // something better?
		let uploadable = {
			"meta" : good_data
			// file entries, etc/	
		}
		let [result,pid] = await this._app.send_new_entry(uploadable,this.update_entry_link,good_data.asset_type)
		if ( result.status === "OK" ) {
			return result.tracker
		}
	}

	async delete_entry(good_data) {
		let uploadable = {
			"meta" : good_data
			// file entries, etc/	
		}
		let result = await this._app.send_publication_command("get",uploadable,this.delete_entry_link)
		if ( result.status === "OK" ) {
			return result.tracker
		}
	}

	async publish_entry(good_data) {
		let uploadable = {
			"meta" : good_data
			// file entries, etc/	
		}
		let result = await this._app.send_publication_command("publish",uploadable,this.publish_entry_link)
		if ( result.status === "OK" ) {
			return result.tracker
		}
	}

	async unpublish_entry(good_data) {
		let uploadable = {
			"meta" : good_data
			// file entries, etc/	
		}
		let result = await this._app.send_publication_command("unpublish",uploadable,this.unpublish_entry_link)
		if ( result.status === "OK" ) {
			return result.tracker
		}
	}

}
