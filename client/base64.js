// MODULE: base64 (windowized)


//$>>	base64ToBytes
function base64ToBytes(str,url_no) {
	let apha = url_no ? "base64" : "base64url"
	// Use the native Uint8Array.fromBase64() method with 'base64url' alphabet
	const utf8Bytes = Uint8Array.fromBase64(str, {
		alphabet: apha
	});

	return utf8Bytes
}


//$>>	bytesToBase64
function bytesToBase64(utf8Bytes,url_no) {
	let apha = url_no ? "base64" : "base64url"

	// Use the native toBase64() method with 'base64url' alphabet and no padding
	const base64_type_String = utf8Bytes.toBase64({
		alphabet: apha,
		padding: false
	});

	return base64_type_String
}



//$>>	base64encode
function base64encode(str, encoder = new TextEncoder()) {
	return bytesToBase64(encoder.encode(str));
}

//$>>	base64decode
function base64decode(str, decoder = new TextDecoder()) {
	return decoder.decode(base64ToBytes(str));
}



//$$EXPORTABLE::
/*
//
bytesToBase64
base64ToBytes
base64encode
base64decode
*/