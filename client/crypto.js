//
import * as base64 from "../modules/base64.js";

var g_crypto = window.crypto ? window.crypto.subtle : null
if ( g_crypto === null  ) {
  alert("No cryptography support in this browser. To claim ownership of assets, please use another browser.")
}


async function do_hash_buffer(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await g_crypto.digest('SHA-256', data);
    return hash
}

export async function do_hash(text) {
    let buffer = await do_hash_buffer(text)
    const hashArray = Array.from(new Uint8Array(buffer));
    return base64.bytesToBase64(hashArray)
}

export function from_hash(base64text) {
    let bytes = base64.base64ToBytes(base64text)
    return bytes
}


export function to_base64(text) {
    return base64.base64encode(text)
}

export function from_base64(base64text) {
    let bytesAsText = base64.base64decode(base64text)
    return bytesAsText
}

// https://docs.ipfs.io/concepts/content-addressing/
// -- https://github.com/multiformats/multicodec/blob/master/table.csv
// MULTI BASE FOR IPFS Support 
// u = no padding
// U = with padding
/*

function do_hash (text) {
    const hash = crypto.createHash('sha256');
    hash.update(text);
    let ehash = hash.digest('base64');
    ehash = ehash.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    return(ehash)
}


sha2-256	multihash	0x12	permanent	
sha2-512	multihash	0x13	permanent	
sha3-512	multihash	0x14	permanent	
sha3-384	multihash	0x15	permanent	
sha3-256	multihash	0x16	permanent	
sha3-224	multihash	0x17	permanent	

// does not start with Qm, so it is v1.

let cidV1 = 'u' +  encode( 0x55 | 0x12 |  256  encoded 256 bytes...) 


base64url - cidv1 - raw - (sha2-256 : 256 : 6E6FF7950A36187A801613426E858DCE686CD7D7E3C0FC42EE0330072D245C95)

multibase - version - multicodec - multihash (name : size : digest in hex)

*/
