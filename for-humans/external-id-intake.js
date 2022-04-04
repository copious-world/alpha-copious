// --------- CHAT BLOG DEMOS FUNCTION //   --- open in a human frame or else
// links on this page...

// // // ----------------- // // // ----------------- // // // -----------------

// EXTENSION INTERFACE
var human_extension_id = false    /// if a URL to a web resource will be required
var human_extension_url = ""
window.addEventListener("message", (event) => {
	if ( event.data === undefined )  return;
	// ...
	let ext_data =  event.data
	if ( ext_data.category === "extension-present" ) {
		if ( ext_data.direction === "from-content-script" ) {
			let message = ext_data.message
			let [browser_type,dat_type,dat] = message.split("::",3)
			if ( dat_type === 'EXTID' ) {
				human_extension_id = dat_type
				human_extension_url = `${browser_type}-${dat_type}://${human_extension_id}/`
			}
		}
	}
}, false);


// ID UPLOAD .. depends on user_db.js
async function public_intergalactic_id_upload() {
	try {
		let json = await get_file_from_file_element("galactic-upload-id")
		let public_id = JSON.parse(json)
		await injest_identity_to_current_id(public_id)
	} catch(e) {

	}
}


// ID UPLOAD .. depends on user_db.js
async function remove_intergalactic_id_upload(public_id) {
	try {
		g_user_db.remove(public_id.name)
	} catch(e) {
	}
}
