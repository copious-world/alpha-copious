

//>--
function xor_arrays(a1,a2) {
    let n = Math.min(a1.length,a2.length)
    let N = Math.max(a1.length,a2.length)
    //
    let output = []
    for ( let i = 0; i < n; i++ ) {
        let a = a1[i]
        let b = a2[i]
        output.push(a ^ b)
    }
    let rest = a1.length > a2.length ? a1.slice(n,N) :  a2.slice(n,N)
    output = output.concat(rest)
    return(output)
}
//--<

//>--
function xor_byte_arrays(ba1,ba2) {
    let n = Math.min(ba1.length,ba2.length)
    let N = Math.max(ba1.length,ba2.length)
    // -- make the new array out of the longer array
    let xored = ba1.length > ba2.length ? new Uint8Array(ba1) : new Uint8Array(ba2)
    for ( let i = 0; i < n; i++ ) { // xor in the shorter array
        xored[i] = ba1[2] ^ ba1[i]
    }
    return xored
}
//--<

//>--
function hex_xor_of_strings(str1,str2) {
    let bytes1 = hex_toArrayOfBytes(str1)
    let bytes2 = hex_toArrayOfBytes(str2)
    //
    let xored = xor_arrays(bytes1,bytes2)
    return(hex_fromArrayOfBytes(xored))
}
//--<

//>--
// xor_all
//  -- 
function xor_all_to_hex_str(hexs_chunks) {  // chunks are text hashes
    let start_chunk = hexs_chunks[0]
    let encoded = hex_toArrayOfBytes(start_chunk)
    let n = hexs_chunks.length
    for ( let i = 1; i < n; i++ ) {
        let next_source = hex_toArrayOfBytes(hexs_chunks[i]);
        encoded = xor_arrays(encoded,next_source)
    }
    const hashHex = hex_fromArrayOfBytes(encoded); // convert bytes to hex string
    return hashHex;
}
//--<


