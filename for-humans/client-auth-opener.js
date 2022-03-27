
function human_app_window_initializer_message(target_window,human_public_identity,display_page,service_tandems) {
	let the_message = {
		"relationship" : 'of-this-world-opener',
		"revise_source" : `https://${g_siteURL}/${display_page}`,		/// don't forget resource is translated by nginx or other
		"tandems" : service_tandems,
		"human_check" : human_public_identity
	}
	let the_message_str = JSON.stringify(the_message)
	target_window.postMessage(the_message_str)
	target_window.focus()
}

function launch_app_window_for_human(target_window,human_public_identity,service_tandems,display_page,window_name) {
	if ( target_window && !(target_window.closed) ) {
		target_window.onload = (ev) => {
			human_app_window_initializer_message(target_window,human_public_identity,display_page,service_tandems)
		}
		return target_window
	} else {
		let launched = window.open(`https://${human_public_identity}/index.html`,window_name)
		if ( launched ) {
			human_app_window_initializer_message(launched,human_public_identity,display_page,service_tandems)
			return launched
		}
		return false
	}
}
// --------- CHAT BLOG DEMOS FUNCTION //   --- open in a human frame or else
// links on this page...

// // // ----------------- // // // ----------------- // // // -----------------

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



async function public_intergalactic_id_upload() {
	try {
		let json = await get_file_from_file_element("galactic-upload-id")
		let public_id = JSON.parse(json)
		await injest_identity_to_current_id(public_id)
	} catch(e) {

	}
}
