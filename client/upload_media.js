// MODULE: UPLOAD MEDIA (windowized)


const DEFINED_CHUNK_SIZE = 5000000
const DEFINED_MAX_SIZE = 9000000


//$>>	finalize_small_media_storage
async function finalize_small_media_storage(primary_response) {
	if ( primary_response.transition && primary_response.transition.token ) {
		let transaction_token = primary_response.transition.token
		let protocol = primary_response.elements.protocol
		let media_id = primary_response.elements.media_id
		let url = `http://${g_siteURL}/uploaders/secondary/transition`
		let body = {
			"token" : transaction_token,
			"match" : "handshake",
		}
		body.protocol = protocol
		body.media_id = media_id   // maybe a checksum
		let secondary_resp =  await postData(url,body)
		return [protocol,media_id]
	}
	return [false,false]
}


//$>>	finalize_media_storage
//                                                  <<depends>> postData
//	There are likely faster ways of sending the data. But, this way requires some permission and safe guarding by the server sid.
async function finalize_media_storage(primary_response,formdata,blob,obj) {

	let secondary_resp = primary_response

	if ( primary_response.transition && primary_response.transition.token ) {	// A token has to be associated with the transaction
		//
		let transaction_token = secondary_resp.transition.token		// call the transition token the transaction_token
		let protocol = 'p2p-default'				// These fields have no real value until the end, but are always checked in case they may be used for security.
		let media_id = ""
		//
		formdata.set("protocol",protocol)				// Most likely ipfs ... 
		formdata.set("media_id",media_id)				// not set until the storage system can identify 
		formdata.set("token",transaction_token)
		formdata.set("match","upload-next")				// tell the server that you are sending one chunk after another
		formdata.set("next",true)  // NEXT
		formdata.set("_t_match_field",obj.file_name)
		let url = `http://${g_siteURL}/uploaders/secondary/transition`		// generic seconday keyed by the token
		//
		let size_end = blob.size						// total length of the data in flight
		let start = 0;
		let span = DEFINED_CHUNK_SIZE					// application generation sets this (tuning upstream)
		let num_sends = Math.floor(size_end/span) + 1	// size/chunk_size
		//
		for ( let i = 0; i < num_sends; i++ ) {			// the number of times this is called is determined by the client
			//
			let start = i*span
			let end = Math.min((i+1)*span,size_end)
			let blob_part = blob.slice(start,end)  				// next part of the blob
			formdata.set('media_file', new Blob([blob_part]),obj.file_name)
			secondary_resp = await postData(url,formdata, 'omit',false,'multipart/form-data')  // send it as a separate file
			//
			if ( (secondary_resp.OK !== "true") && (secondary_resp.OK !== true) ) {
				break;			// This last send failed. Bailout  (If failed, the server will shutdown the communication)
			}
		}
		//
		if ( (secondary_resp.OK === "true") || (secondary_resp.OK === true) ) {						// The last send was good.
			let body = {
				"token" : transaction_token,
				"match" : "complete",
				"_t_match_field" : obj.file_name,
				"file" : { "name" : obj.file_name },
				"next"	: false		// NO NEXT
			}
			secondary_resp =  await postData(url,body)			// Tell the server that this transaction is done...
			let elements = secondary_resp.state.elements			// The good stuff is returned in a state field 
			protocol = elements.protocol  // final hash and provider returned in state (same as for the shor but in the state field)
			media_id = elements.media_id
		}
		//
		return [protocol,media_id]
	}
	return [false,false]
}



//$>>	upload_small
//                                                  <<depends>> postData,finalize_small_media_storage
async function upload_small(obj,blob_already) {			// 	obj.media_type  // data:[<MIME-type>][;charset=<encoding>][;base64],<data>
	obj.email = g_dashboard_info.email
	let url = `http://${g_siteURL}/uploaders/transition/do_param_upload`
	const mime = obj.mime
	//
	let blob_data = ""
	//
	if ( !(blob_already) )  {
		try {
			let res = await fetch(obj.blob)
			blob_data = await res.blob()
		} catch(e) {
			return
		}
	} else {
		blob_data = blob_already
	}
	//
	let formdata = new FormData()
	for ( let ky in obj ) {
		if ( ky === 'blob' ) continue
		formdata.append(ky, obj[ky])
	}
	formdata.append('protocol', 'p2p-default')
	formdata.append('media_file', new Blob([blob_data]), obj.file_name)
	//
	// in the small versions, the file is sent immediately. No preamble
	//
	let primary_response =  await postData(url,formdata,'omit',false,'multipart/form-data')
	if ( primary_response.OK === "true" ) {
		let media_store_characteristics = await finalize_small_media_storage(primary_response)
		return media_store_characteristics
	} else {
		return [false, false]
	}
}

//$>>	upload_big
//                                                  <<depends>> postData,finalize_media_storage
async function upload_big(obj,blob_already) {
	obj.email = g_dashboard_info.email
	let url = `http://${g_siteURL}/uploaders/transition/do_param_upload`
	const mime = obj.mime
	let blob_data = ""
	//
	if ( !(blob_already) )  {
		try {
			let res = await fetch(obj.blob)
			blob_data = await res.blob()
		} catch(e) {
			return
		}
	} else {
		blob_data = blob_already
	}
	//
	let formdata = new FormData()
	for ( let ky in obj ) {
		if ( ky === 'blob' ) continue
		formdata.append(ky, obj[ky])
	}
	formdata.append('protocol', 'p2p-default')
	formdata.append('preamble',blob_data.size)	// tell the size of data to come
	//
	// in the large versions, a preamble is sent with the size of the data. No data is sent in the first message
	//
	let primary_response =  await postData(url,formdata,'omit',false,'multipart/form-data')
	//
	if ( primary_response.OK === "true" ) {		// If the system can handle the request, start a cycle of sends
		let media_store_characteristics = await finalize_media_storage(primary_response,formdata,blob_data,obj)
		return media_store_characteristics
	} else {
		return [false, false]
	}
}

//$>>	upload_audio
//                                                  <<depends>> upload_big,upload_small
// ---- ---- ---- ---- ---- ---- ----
async function upload_audio(obj) {
	let blob_data
	try {
		let res = await fetch(obj.blob)
		blob_data = await res.blob()
	} catch(e) {
		return
	}
	if ( blob_data.size > DEFINED_MAX_SIZE ) {
		return await upload_big(obj,blob_data)
	} else {
		return await upload_small(obj,blob_data)
	}
}

//$>>	upload_image
// ---- ---- ---- ---- ---- ---- ----
async function upload_image(obj) {
	if ( !(blob_already) )  {
		try {
			let res = await fetch(obj.blob)
			blob_data = await res.blob()
		} catch(e) {
			return
		}
	} else {
		blob_data = blob_already
	}
}

//$>>	upload_video
//                                                  <<depends>> upload_big
// ---- ---- ---- ---- ---- ---- ----
async function upload_video(obj) {
	return await upload_big(obj)
}

//$>>	prep_upload_for
//                                                  <<depends>> uploader_fun
// ---- ---- ---- ---- ---- ---- ----
var g_uploader_cache = {}
function prep_upload_for(obj,uploader_fun) {
	//
	g_uploader_cache[obj._dash_entry_id] = async () => {
		return await uploader_fun(obj)
	}
	//
}

//$>>	do_media_upload
//                                                  <<depends>> prep_upload_for
//                                                  <<var-depends>> g_uploader_cache
async function do_media_upload(obj) {		// earlier a link was made for the media, which will be uploaded if ever the user "save"s it.
	let id = obj._dash_entry_id
	let _uploader = g_uploader_cache[id]	// _uploader from map
	if ( _uploader ) {
		let [protocol,asset_id] = await _uploader()
		return [protocol,asset_id]
	}
}


//$$EXPORTABLE::
/*
finalize_small_media_storage
finalize_media_storage
upload_small
upload_big
upload_audio
upload_image
upload_video
prep_upload_for
do_media_upload
*/
