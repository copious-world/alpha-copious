// sometimes code doesn't want to be a module. But, there is a module version of this in npm crypto-wraps
//

//$>>	gen_public_key
async function gen_public_key(user_info,store_info) {
	let keys = await galactic_user_starter_keys()
	//
	user_info.public_key = keys.pk_str		// user info is the basis for creating a user cid the public key is part of it
	user_info.signer_public_key = keys.signer_pk_str
	//
	let aes_key = await gen_cipher_key()
	let storable_key = await aes_to_str(aes_key) 
	let nonce = gen_nonce()
	//
	let privates = {		// private keys will be stored locally, and may offloadded from the browser at the user's discretion.
		'priv_key' : keys.priv_key,
		'signer_priv_key' : keys.signer_priv_key,
		'signature_protect' : {
			"key" : storable_key,
			"nonce" : nonce
		}
	}
	user_info.biometric = await protect_hash(privates,aes_key,nonce,user_info.biometric)
	store_info(user_info,privates)
}



//$>>	get_user_public_wrapper_key
async function get_user_public_wrapper_key(name_key) {
	//
	let transaction = g_galactic_db.transaction(PROMAIL_USERID_STORE, "readwrite");
	let userStore = transaction.objectStore(PROMAIL_USERID_STORE);

	let p = new Promise((resolve,reject) => {
		let nameIndex = userStore.index('name_key');
		nameIndex.openCursor().onsuccess = (event) => {
			let keyRangeValue = IDBKeyRange.only(name_key);
			nameIndex.openCursor(keyRangeValue).onsuccess = (event) => {
				var cursor = event.target.result;
				if ( cursor ) {
					let idObj = cursor.value
					let pkey = idObj.user_info.public_key;
				}
			}
		}
	})
	//
	return p
}



//$>>	get_user_public_signer_key
async function get_user_public_signer_key(name_key) {
	//
	let transaction = g_galactic_db.transaction(PROMAIL_USERID_STORE, "readwrite");
	let userStore = transaction.objectStore(PROMAIL_USERID_STORE);

	let p = new Promise((resolve,reject) => {
		let nameIndex = userStore.index('name_key');
		nameIndex.openCursor().onsuccess = (event) => {
			let keyRangeValue = IDBKeyRange.only(name_key);
			nameIndex.openCursor(keyRangeValue).onsuccess = (event) => {
				var cursor = event.target.result;
				if ( cursor ) {
					let idObj = cursor.value
					let pkey = idObj.user_info.signer_public_key;
				}
			}
		}
	})
	//
	return p
}


// ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ----

//$>>	user_decryption
// user_decryption
async function user_decryption(identity,asset) {
	//
	if ( identity.asset_keys === undefined ) {
		identity.asset_keys = {}
		for ( let asset of ['contacts','manifest','topics'] ) {
			identity.asset_keys[asset] = {}
			identity.asset_keys[asset].key = false
			identity.asset_keys[asset].nonce = false
		}
	}
	//
	switch ( asset ) {
		case 'contacts': {
			let {key,nonce} = identity.asset_keys[asset]
			if ( key ) {
				key = await aes_from_str(key)
				// decryptor fn
				let decryptor = async (decodable) => {
					let buffer = buffer_from_cvs_array(decodable)
					try {
						let aes_key = key 
						let iv_nonce = buffer_from_b64_csv(nonce)
						return await aes_decipher_message(buffer,aes_key,iv_nonce)
					} catch(e) {
						return false
					}
				}
				return decryptor
			} else {
				return identity_fn
			}
			break;
		}
		case 'manifest': {
			let {key,nonce} = identity.asset_keys[asset]
			if ( key ) {
				key = await aes_from_str(key)
				// decryptor fn
				let decryptor = async (decodable) => {
					let buffer = buffer_from_cvs_array(decodable)
					try {
						let aes_key = key 
						let iv_nonce = buffer_from_b64_csv(nonce)
						return await aes_decipher_message(buffer,aes_key,iv_nonce)
					} catch(e) {
						return false
					}
				}
				return decryptor
			} else {
				return identity_fn
			}
			break;
		}
		case 'topics': {
			let {key,nonce} = identity.asset_keys[asset]
			if ( key ) {
				key = await aes_from_str(key)
				// decryptor fn
				let decryptor = async (decodable) => {
					let buffer = buffer_from_cvs_array(decodable)
					try {
						let aes_key = key
						let iv_nonce = buffer_from_b64_csv(nonce)
						return await aes_decipher_message(buffer,aes_key,iv_nonce)
					} catch(e) {
						return false
					}
				}
				return decryptor
			} else {
				return identity_fn
			}
			break;
		}
		default: {
			break;
		}
	}
	//
	return identity_fn
}



//$>>	user_encryption
async function user_encryption(identity,asset) {
	if ( identity.asset_keys === undefined ) {
		identity.asset_keys = {}
	}
	switch ( asset ) {
		case 'message': {	// key stays in messages
			let encryptor = async (encodable,aes_key,nonce) => {
				let iv_nonce = buffer_from_b64_csv(nonce)
				let encoded = await aes_encryptor(encodable,aes_key,iv_nonce)
				let int_rep_enc = new Uint8Array(encoded)
				return int_rep_enc.toString()
			}
			return encryptor
			break;
		}
		case 'contacts': {
			let aes_key = await gen_cipher_key()
			let nonce = gen_nonce()
			let storable_key = await aes_to_str(aes_key) // sometimes it's tricky getting indexedDB to take types, likely not this one, but then...
			identity.asset_keys['contacts'] = {
				"key" : storable_key,
				"nonce" : nonce
			}
			// encryptor fn
			let encryptor = async (encodable) => {
				let iv_nonce = buffer_from_b64_csv(nonce)
				let encoded = await aes_encryptor(encodable,aes_key,iv_nonce)
				let int_rep_enc = new Uint8Array(encoded)
				return int_rep_enc.toString()
			}
			return encryptor
		}
		case 'manifest': {
			let aes_key = await gen_cipher_key()
			let nonce = gen_nonce()
			let storable_key = await aes_to_str(aes_key) // sometimes it's tricky getting indexedDB to take types, likely not this one, but then...
			identity.asset_keys['contacts'] = {
				"key" : storable_key,
				"nonce" : nonce
			}
			// encryptor fn
			let encryptor = async (encodable) => {
				let iv_nonce = buffer_from_b64_csv(nonce)
				let encoded = await aes_encryptor(encodable,aes_key,iv_nonce)
				let int_rep_enc = new Uint8Array(encoded)
				return int_rep_enc.toString()
			}
			return encryptor
		}
		case 'topics': {
			let aes_key = await gen_cipher_key()
			let nonce = gen_nonce()
			let storable_key = await aes_to_str(aes_key) // sometimes it's tricky getting indexedDB to take types, likely not this one, but then...
			identity.asset_keys['contacts'] = {
				"key" : storable_key,
				"nonce" : nonce
			}
			// encryptor fn
			let encryptor = async (encodable) => {
				let iv_nonce = buffer_from_b64_csv(nonce)
				let encoded = await aes_encryptor(encodable,aes_key,iv_nonce)
				let int_rep_enc = new Uint8Array(encoded)
				return int_rep_enc.toString()
			}
			return encryptor
		}
		default: {
			break;
		}
	}
	return identity_fn
}

// ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ----



//$>>	aes_encryptor
async function aes_encryptor(encodable,aes_key,nonce) {

	let enc = new TextEncoder();
    let clear_buf =  enc.encode(encodable);
	let iv = nonce

    let ciphertext = await g_crypto.encrypt({
												name: "AES-CBC",
												iv
											},
											aes_key,
											clear_buf
										);
	return ciphertext
}

//$>>	aes_decipher_message
async function aes_decipher_message(message,aes_key,nonce) {
	let iv = nonce
    let decrypted = await g_crypto.decrypt({
												name: "AES-CBC",
												iv
											},
											aes_key,
											message
										);
	//
	let dec = new TextDecoder()
	let clear = dec.decode(decrypted)
	return clear
}
// 


//$>>	gen_cipher_key
async function gen_cipher_key() {
	//
	try {
		let aes_key = g_crypto.generateKey({
												name: "AES-CBC",
												length: 256
											},
											true,
											["encrypt", "decrypt"]
										)	

		return aes_key
	} catch(e){}
	//
	return false
}


//$>>	pc_keypair_promise
//>--
function pc_keypair_promise() {  // return 
    // Generate a local public/private key pair
    let p =  g_crypto.generateKey({
            'name': "ECDSA",
            'namedCurve': "P-384"
        },
        true,
        ["sign", "verify"]
    )
    return p  // promise
}
//-


//$>>	pc_wrapper_keypair_promise
//  -- 
function pc_wrapper_keypair_promise() {  // return 
    // Generate a local public/private key pair
    let p =  g_crypto.generateKey({
            name: "RSA-OAEP",
            modulusLength: 4096, //can be 1024, 2048, or 4096
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        },
        true,
        ["wrapKey","unwrapKey"]
    )
    return p  // promise
}
//--<


//$>>	aes_to_str
/*
Import an AES secret key from an ArrayBuffer containing the raw bytes.
Takes an ArrayBuffer string containing the bytes, and returns a Promise
that will resolve to a CryptoKey representing the secret key.
*/
async function aes_to_str(aes_key,transport_type) {
	switch ( transport_type ) {
		case "jwk" : {
			const exported = await g_crypto.exportKey("jwk", aes_key);
			let key_str = JSON.stringify(exported)
			return key_str
		}
		case "raw" :
		default: {
			const exported = await g_crypto.exportKey("raw", aes_key);
			const exportedKeyBuffer = new Uint8Array(exported);
			let key_str = exportedKeyBuffer.toString()
			return key_str
		}
	}
}


//$>>	importAESKey
/*
Import an AES secret key from an ArrayBuffer containing the raw bytes.
Takes an ArrayBuffer string containing the bytes, and returns a Promise
that will resolve to a CryptoKey representing the secret key.
*/
function importAESKey(rawKey,transport_type) {
  return g_crypto.importKey(
		transport_type,
		rawKey,
		{
			name: "AES-CBC",
			length: 256
		},
		true,
		["encrypt", "decrypt"]
  );
}


//$>>	aes_from_str
async function aes_from_str(aes_key_str,transport_type) {
	switch ( transport_type ) {
		case "jwk" : {
			try {
				let key_obj = JSON.parse(aes_key_str)
				let key = await importAESKey(key_obj,"jwk")
				return key
			} catch (e) {}
			break;
		}
		case "raw" :
		default: {
			let els = aes_key_str.split(',').map(el => parseInt(el))
			let buf = new Uint8Array(els)
			let key = await importAESKey(buf,"raw")
			return key
		}
	}
}

//$>>	key_wrapper
async function key_wrapper(key_to_wrap,pub_wrapper_key) {
	try {
		let wrapper_jwk = JSON.parse(pub_wrapper_key)
		let wrapper = await g_crypto.importKey(
				"jwk",
				wrapper_jwk,
				{   //these are the wrapping key's algorithm options
					name: "RSA-OAEP",
					modulusLength: 4096, //can be 1024, 2048, or 4096
					publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
					hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
				},
				true,
				["wrapKey"]
		);

		let wrapped_key = await g_crypto.wrapKey(
											"jwk",
											key_to_wrap,
											wrapper,
											{   //these are the wrapping key's algorithm options
												name: "RSA-OAEP"
											}
										);
		let type8 = new Uint8Array(wrapped_key)
		let tranportable = hex_fromTypedArray(type8)
		return tranportable
	} catch(e) {
		console.log(e)
	}
	return false
}

//$>>	key_unwrapper
async function key_unwrapper(wrapped_key,piv_wrapper_key) {
	let wrapper_jwk = JSON.parse(piv_wrapper_key)
	let unwrapper = await g_crypto.importKey(
			"jwk",
			wrapper_jwk,
			{   //these are the wrapping key's algorithm options
				name: "RSA-OAEP",
				modulusLength: 4096, //can be 1024, 2048, or 4096
				publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
				hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
			},
			true,
			["unwrapKey"]
	);
	
	// wrapped_key
	let wrapped_aes =  hex_toByteArray(wrapped_key)

	let aes_key = await unwrapped_aes_key(wrapped_aes,unwrapper)

	return aes_key
}


//$>>	key_signer
async function key_signer(data_to_sign,priv_signer_key) {
	try {
		let signer_jwk = JSON.parse(priv_signer_key)
		let signer = await g_crypto.importKey(
				"jwk",
				signer_jwk,
				{
					'name': "ECDSA",
					'namedCurve': "P-384"
				},
				true,
				["sign"]
		);

		let enc = new TextEncoder();
		let signable = enc.encode(data_to_sign);
		let signature = await g_crypto.sign({
												name: "ECDSA",
												hash: {name: "SHA-384"},
											},
											signer,
											signable
										);

		let type8 = new Uint8Array(signature)
		let tranportable = hex_fromTypedArray(type8)
		return tranportable
	} catch(e) {
		console.log(e)
	}
	return false
}


//$>>	verifier
async function verifier(was_signed_data,signature,signer_pub_key) {
	try {
		let signer_jwk = JSON.parse(signer_pub_key)
		let verifier = await g_crypto.importKey(
				"jwk",
				signer_jwk,
				{
					'name': "ECDSA",
					'namedCurve': "P-384"
				},
				true,
				["verify"]
		);
		//
		let enc = new TextEncoder();
		let verifiable = enc.encode(was_signed_data);

		let sig_bytes = hex_toByteArray(signature)

		let result = await g_crypto.verify({
											name: "ECDSA",
											hash: {name: "SHA-384"},
										},
										verifier,
										sig_bytes,
										verifiable
									);
		return result
	}  catch(e) {
		console.log(e)
	}
}



//$>>	decipher_message
async function decipher_message(message,wrapped_key,priv_key,nonce) {
	try {
		let aes_key = await key_unwrapper(wrapped_key,priv_key)
		if ( aes_key ) {
			let iv_nonce = buffer_from_b64_csv(nonce)
			let buffer = buffer_from_cvs_array(message)
			let clear = await aes_decipher_message(buffer,aes_key,iv_nonce)
			return clear
		}
	} catch(e) {
		console.log(e)
	}
	return false
}
// 




//$>>	unwrapped_aes_key
// --
async function unwrapped_aes_key(wrapped_aes,unwrapper_key) {
    let unwrapped_aes = await g_crypto.unwrapKey(
        "jwk", // same as wrapped
        wrapped_aes, //the key you want to unwrap
        unwrapper_key, //the private key with "unwrapKey" usage flag
        {   //these are the wrapping key's algorithm options
		name: "RSA-OAEP",
			modulusLength: 4096, //can be 1024, 2048, or 4096
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
         },
        {   //this what you want the wrapped key to become (same as when wrapping)
            name: "AES-CBC",
            length: 256
        },
        true, //whether the key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //the usages you want the unwrapped key to have
    )
    //
    return unwrapped_aes
}
//--<



//$>>	protect_hash

// wrap a hash of the biomarker -- done before server create identity operation 
// 
async function protect_hash(priv_keys,aes_key,nonce,blob64) {
	// get a sha255 hash of the blob...
	const encoder = new TextEncoder();
	const data = encoder.encode(blob64);
	const hash = await g_crypto.digest('SHA-256', data);

	let priv_signer_key = priv_keys.signer_priv_key

	let signer_jwk = JSON.parse(priv_signer_key)
	let signer = await g_crypto.importKey(	"jwk",
											signer_jwk,
											{
												'name': "ECDSA",
												'namedCurve': "P-384"
											},
											true,
											["sign"]
									);

	let signature = await g_crypto.sign({
											name: "ECDSA",
											hash: {name: "SHA-384"},
										},
										signer,
										hash
									);

	let sig_buff = new Uint8Array(signature)
	let sig_txt = sig_buff.toString()
	let iv_nonce = buffer_from_b64_csv(nonce)
	let cipher_sig = await aes_encryptor(sig_txt,aes_key,iv_nonce)
	//
	let int_rep_enc = new Uint8Array(cipher_sig)
	return int_rep_enc.toString()
}


//$>>	galactic_user_starter_keys
//    make a priv/pub key pair. Then negotiate with the server to wrap the key.
async function galactic_user_starter_keys() {
	// Generate a local public/private key pair
	let keypair = await pc_wrapper_keypair_promise()
	// ---- ---- ---- ----
	let pub_key = keypair.publicKey
	let priv_key = keypair.privateKey
	// ---- ---- ---- ----                                      // g_nonce_buffer - space to use
	let exported = await g_crypto.exportKey("jwk",pub_key);
	let pub_key_str = JSON.stringify(exported)

	let priv_exported = await g_crypto.exportKey("jwk",priv_key);
	let priv_key_str =  JSON.stringify(priv_exported);

	let signer_pair = await pc_keypair_promise()

	let signer_pub_key = signer_pair.publicKey
	let signer_priv_key = signer_pair.privateKey

	let sign_exported = await g_crypto.exportKey("jwk",signer_pub_key);
	let sign_pub_key_str = JSON.stringify(sign_exported)

	let sign_priv_exported = await g_crypto.exportKey("jwk",signer_priv_key);
	let sign_priv_key_str =  JSON.stringify(sign_priv_exported);
	//
	let key_info = {
		"pk_str" : pub_key_str,
		"priv_key" : priv_key_str,
		"signer_pk_str"  : sign_pub_key_str,
		"signer_priv_key" : sign_priv_key_str
	}
	return(key_info)
}



//$>>	fix_keys
async function fix_keys(identity) {
	let u_info = identity.user_info
	if ( !u_info ) return // can't fix it
	if ( ( identity.priv_key === undefined) || ( identity.signer_priv_key === undefined ) || ( u_info.signer_public_key === undefined ) ) {
		try {
			let storage_obj = await identity_from_user(u_info)
			if ( identity.priv_key === undefined ) {
				let keypair = await pc_wrapper_keypair_promise()
				// ---- ---- ---- ----
				let pub_key = keypair.publicKey
				let priv_key = keypair.privateKey
				let exported = await g_crypto.exportKey("jwk",pub_key);
				let pub_key_str = JSON.stringify(exported)

				let priv_exported = await g_crypto.exportKey("jwk",priv_key);
				let priv_key_str =  JSON.stringify(priv_exported);
				//
				storage_obj.priv_key = priv_key_str
				u_info.public_key = pub_key_str
			}
			//
			if ( ( identity.signer_priv_key === undefined ) || ( u_info.signer_public_key === undefined ) ) {
				let signer_pair = await pc_keypair_promise()
				//
				let signer_pub_key = signer_pair.publicKey
				let signer_priv_key = signer_pair.privateKey

				let sign_exported = await g_crypto.exportKey("jwk",signer_pub_key);
				let sign_pub_key_str = JSON.stringify(sign_exported)

				let sign_priv_exported = await g_crypto.exportKey("jwk",signer_priv_key);
				let sign_priv_key_str = JSON.stringify(sign_priv_exported);
				//
				storage_obj.signer_priv_key = sign_priv_key_str					
				u_info.signer_public_key = sign_pub_key_str
			}
			let transaction = g_galactic_db.transaction(PROMAIL_USERID_STORE, "readwrite");
			let userStore = transaction.objectStore(PROMAIL_USERID_STORE);
			//
			let p = new Promise((resolve,reject) => {
				const updateUserRequest =  userStore.put(storage_obj)           // information create by 
				updateUserRequest.onsuccess = () => {
					resolve(true)
				};
			})
			return p
		} catch (e) {
		}
	}
}



//$$EXPORTABLE::
/*
gen_public_key
get_user_public_wrapper_key
get_user_public_signer_key
user_decryption
user_encryption
aes_encryptor
aes_decipher_message
gen_cipher_key
pc_wrapper_keypair_promise
aes_to_str
aes_from_str
key_wrapper
key_unwrapper
verifier
decipher_message
unwrapped_aes_key
protect_hash
galactic_user_starter_keys
fix_keys
*/