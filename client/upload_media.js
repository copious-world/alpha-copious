// MODULE: UPLOAD MEDIA (windowized)


const DEFINED_CHUNK_SIZE = 5000000
const DEFINED_MAX_SIZE = 9000000




// prep_upload_data
// 	-- if needed prepare the blob...  in any case separate the blob from the com object to send it later.
// 	-- return the com object and blob as a pair
//
async function prep_upload_data(obj,blob_already,protocol) {
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
	if ( obj.blob !== undefined )  {
		delete obj.blob
	}
	obj.protocol = protocol ? protocol : 'p2p-default'
	obj.preamble_size = blob_data.size

	return [obj,blob_data]
}



//$>>	finalize_small_media_storage
async function finalize_small_media_storage(url,primary_response) {
	if ( primary_response.transition && primary_response.transition.token ) {
		let transaction_token = primary_response.transition.token
		let protocol = primary_response.elements.protocol
		let media_id = primary_response.elements.media_id
		let body = {
			"token" : transaction_token,
			"match" : "handshake",
		}
		body.protocol = protocol
		body.media_id = media_id   // maybe a checksum
		let secondary_resp =  await postData(url,body)
		if ( secondary_resp.status = "OK" ) {
			return [protocol,media_id]
		}
	}
	return [false,false]
}


//$>>	finalize_media_storage
//                                                  <<depends>> postData
//	There are likely faster ways of sending the data. But, this way requires some permission and safe guarding by the server sid.
//	sending multi part form data . The blob list is actually file objects 
async function finalize_media_storage(url,primary_response,formdata,blob,obj) {
	//
	let secondary_resp = primary_response
	//
	if ( primary_response.transition && primary_response.transition.token ) {	// A token has to be associated with the transaction
		//
		if ( formdata === false ) {
			formdata = new FormData()
			for ( let ky in obj ) {
				formdata.append(ky, obj[ky])
			}
		}
		let transaction_token = secondary_resp.transition.token		// call the transition token the transaction_token
		let protocol = obj.protocol ? obj.protocol : 'p2p-default'				// These fields have no real value until the end, but are always checked in case they may be used for security.
		let media_id = ""
		//
		formdata.set("protocol",protocol)				// Most likely ipfs ... 
		formdata.set("media_id",media_id)				// not set until the storage system can identify 
		formdata.set("token",transaction_token)
		formdata.set("match","upload-next")				// tell the server that you are sending one chunk after another
		formdata.set("next",true)  // NEXT
		formdata.set("_t_match_field",obj.file_name)
		//
		let size_end = blob.size						// total length of the data in flight
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
			if ( secondary_resp && secondary_resp.state ) {
				let elements = secondary_resp.state.elements			// The good stuff is returned in a state field 
				if ( elements ) {
					protocol = elements.protocol  // final hash and provider returned in state (same as for the shor but in the state field)
					media_id = elements.media_id
				}
			}
		}
		//
		return [protocol,media_id]
	}
	return [false,false]
}

//$>>	finalize_media_array_storage
//                                                  <<depends>> postData
//	There are likely faster ways of sending the data. But, this way requires some permission and safe guarding by the server sid.
//	sending multi part form data . The blob list is actually file objects 
async function finalize_media_array_storage(url,primary_response,formdata,blob_list,obj) {
	//
	let secondary_resp = primary_response
	//
	// TOKEN ->
	if ( primary_response.transition && primary_response.transition.token ) {	// A token has to be associated with the transaction
		//
		// include extra (not default) fields and elements
		if ( formdata === false ) {		// sending as a file form
			formdata = new FormData()
			for ( let ky in obj ) {
				formdata.append(ky, obj[ky])
			}
		}
		let transaction_token = secondary_resp.transition.token		// call the transition token the transaction_token
		let protocol = obj.protocol ? obj.protocol : 'p2p-default'				// These fields have no real value until the end, but are always checked in case they may be used for security.
		let media_id = ""
		//
		formdata.set("protocol",protocol)				// Most likely ipfs ... 
		formdata.set("media_id",media_id)				// not set until the storage system can identify 
		formdata.set("token",transaction_token)
		formdata.set("match","upload-next")				// tell the server that you are sending one chunk after another
		formdata.set("next",true)  // NEXT
		formdata.set("_t_match_field",obj.file_name)
		//

		let max_num_sends = 0
		let blob_pars = blob_list.map( blob => {
			let size_end = blob.size						// total length of the data in flight
			let start = 0;
			let span = DEFINED_CHUNK_SIZE					// application generation sets this (tuning upstream)
			let num_sends = Math.floor(size_end/span) + 1	// size/chunk_size
			max_num_sends = (num_sends > max_num_sends) ?  num_sends : max_num_sends
			return {
				blob, size_end, start, span, num_sends
			}
		})
		// 
		//
		for ( let i = 0; i < max_num_sends; i++ ) {			// the number of times this is called is determined by the client
			//
			for ( let blob_dscr of blob_pars ) {
				if ( blob_dscr.num_sends === 0 ) continue
				let blob = blob_dscr.blob
				let span = blob_dscr.span
				let start = span*i
				let size_end = blob_dscr.size_end
				let end = Math.min((i+1)*span,size_end)

				let blob_part = blob.slice(start,end)  				// next part of the blob
				formdata.set('media_file', new Blob([blob_part]), blob_dscr.file_name)
				blob_dscr.num_sends--
			}
			//
			// POST chunk wrapped in a Form descriptor
			secondary_resp = await postData(url,formdata, 'omit',false,'multipart/form-data')  // send it as a separate file
			//
			if ( (secondary_resp.OK !== "true") && (secondary_resp.OK !== true) ) {
				break;			// This last send failed. Bailout  (If failed, the server will shutdown the communication)
			}
		}
		//
		if ( (secondary_resp.OK === "true") || (secondary_resp.OK === true) ) {						// The last send was good.
			// SEND LAST CHUNK
			let body = {
				"token" : transaction_token,
				"match" : "complete",
				"_t_match_field" : obj.file_name,
				"file" : { "name" : obj.file_name },
				"next"	: false		// NO NEXT
			}
			// postData
			secondary_resp =  await postData(url,body)			// Tell the server that this transaction is done...
			let elements = secondary_resp.state		// The good stuff is returned in a state field 
			protocol = elements.protocol  // final hash and provider returned in state (same as for the shor but in the state field)
			media_id = elements.media_id
		}
		//
		return [protocol,media_id]   // this will be for tracking, etc.
	}
	return [false,false]
}



//$>>	finalize_media_array_storage_deep_json
//                                                  <<depends>> postData
// sending json with a layerd structure (includes meta field)
// this is distinguished from the other methods that expect a file object to be used as multipart form data...
// not sedning multi-part form data
//	There are likely faster ways of sending the data. But, this way requires some permission and safe guarding by the server sid.
/**
 * 
 * @param {string} url - the API url that will take in the uploaded data
 * @param {string} token - a transaction token
 * @param {object} primary_response - the response received from making the upload request
 * @param {object|boolean} formdata - if not false, field/value pairs for use by the server beyond data description in postable
 * @param {Array} blob_list - a list of blobs one or more. One usually, two if a potser is include, more for special apps
 * @param {object} postable - file and protocol (for message)
 * @returns {pair}
 */
async function finalize_media_array_storage_deep_json(url,token,primary_response,formdata,blob_list,postable) {
	//
	let secondary_resp = primary_response
	//
	// TOKEN ->
	if ( primary_response.transition && primary_response.transition.token ) {	// A token has to be associated with the transaction
		//
		// include extra (not default) fields and elements
		if ( formdata === false ) {		// sending as a file form
			formdata = {}
			for ( let ky in postable ) {
				if ( ky === 'meta' ) continue
				formdata[ky] = postable[ky]
			}
		}
		let transaction_token = token		// call the transition token the transaction_token
		let protocol = postable.protocol ? postable.protocol : 'p2p-default'				// These fields have no real value until the end, but are always checked in case they may be used for security.
		let media_id = ""
		formdata.json_chunks = true
		//
		formdata.protocol = protocol					// Most likely ipfs ... 
		formdata.media_id = media_id					// not set until the storage system can identify 
		formdata.token = transaction_token
		formdata.match = "upload-next"					// tell the server that you are sending one chunk after another
		formdata.next = true
		formdata._t_match_field = postable.file_name
		//
		// parameters for each blob account for shorter and longer data
		let max_num_sends = 0
		let blob_pars = blob_list.map( blob_descr => {
			let blob = blob_descr.blob_url
			let name = blob_descr.name
			let size_end = blob.length						// total length of the data in flight
			let start = 0;
			let span = DEFINED_CHUNK_SIZE					// application generation sets this (tuning upstream)
			let num_sends = Math.floor(size_end/span) + 1	// size/chunk_size
			max_num_sends = (num_sends > max_num_sends) ? num_sends : max_num_sends
			return {
				blob, name, size_end, start, span, num_sends
			}
		})
		// 
		//
		// SEND CHUNKS
		for ( let i = 0; i < max_num_sends; i++ ) {			// the number of times this is called is determined by the client
			//
			formdata.media_parts = {}  // prepare a POSTable form with a part from each blob
			for ( let blob_dscr of blob_pars ) {	// may send some number of blobs
				if ( blob_dscr.num_sends === 0 ) continue  // shorter ones go out first
				let blob = blob_dscr.blob
				let span = blob_dscr.span
				let start = span*i
				let size_end = blob_dscr.size_end
				let end = Math.min((i+1)*span,size_end)
				//
				let blob_part = blob.slice(start,end)  				// next part of the blob
				formdata.media_parts[blob_dscr.name] = blob_part
				blob_dscr.num_sends--
			}
			//
			// POST chunk wrapped in a Form descriptor  (one chunk from each blob)
			secondary_resp = await postData(url,formdata,'omit')	//	the blob_url will be sent as part of the JSON object
			//
			if ( (secondary_resp.OK !== "true") && (secondary_resp.OK !== true) ) {
				break;			// This last send failed. Bailout  (If failed, the server will shutdown the communication)
			}
			// otherwise keep going until the last chunk of the longest blob has been sent.
		}
		//
		// Having sent them all, close of 
		if ( (secondary_resp.OK === "true") || (secondary_resp.OK === true) ) {						// The last send was good.
			// SEND LAST CHUNK
			let body = {
				"token" : transaction_token,  // the token returned during the setup 
				"match" : "complete",
				"file_list" : blob_list,
				"_t_match_field" : postable.file_name,
				"file" : { "name" : postable.file_name },
				"next"	: false		// NO NEXT
			}
			// postData
			secondary_resp =  await postData(url,body)			// Tell the server that this transaction is done...
			let elements = secondary_resp.state		// The good stuff is returned in a state field 
			protocol = elements.protocol  // final hash and provider returned in state (same as for the shor but in the state field)
			media_id = elements.media_id
		}
		//
		return [protocol,media_id]   // this will be for tracking, etc.
	}
	return [false,false]
}





//$>>	upload_small
//                                                  <<depends>> postData,finalize_small_media_storage
async function upload_small(url,obj,blob_already) {			// 	obj.media_type  // data:[<MIME-type>][;charset=<encoding>][;base64],<data>
	//
	let [com_obj,blob_data] = await prep_upload_data(obj,blob_already,'p2p-default')
	//
	let formdata = new FormData()
	for ( let ky in com_obj ) {
		formdata.append(ky, com_obj[ky])
	}

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
async function upload_big(url,obj,blob_already) {
	//
	let [com_obj,blob_data] = await prep_upload_data(obj,blob_already,'p2p-default')
		let span = DEFINED_CHUNK_SIZE					// application generation sets this (tuning upstream)
	//
	let formdata = new FormData()
	for ( let ky in com_obj ) {
		formdata.append(ky, com_obj[ky])
	}
	//
	// in the large versions, a preamble is sent with the size of the data. No data is sent in the first message
	//
	let primary_response = await postData(url,formdata,'omit',false,'multipart/form-data')
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
