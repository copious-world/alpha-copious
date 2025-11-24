

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

async function media_startup(tracking,protocol,media,counter_link,session) { // _x_link_counter > counter_link
    if ( protocol === 'ipfs' ) {
        let links = await crypto_ready_counted(counter_link,tracking,session,media)  // src is for checking...
        return links
    } else if ( protocol === 'local' ) {
        let links = await clear_counted(counter_link,tracking,session,media)  // src is for checking...
        return links
    } else {		// default
        counter_link = "localhost:7777"
        let links = await clear_counted(counter_link,tracking,session,media)
        return links
    }
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

// the counter link is complete, stored in the _x_link_counter field of the meta object

async function crypto_ready_counted(counter_link,tracking,session,src) {
    //
    let prot = "https:"
    let sp = "//"
    let url = `${prot}${sp}${counter_link}/key-media/${tracking}`
    if ( (typeof session === 'string') && (session.length > 0) ) {
        url += `/${session}`
    }
    //
    try {
        let result = await fetchUrl(url)
        if ( result.status === "OK" ) {
            return result.links
        }
    } catch(e) {
    }
    return false
}


async function clear_counted(counter_link,tracking,session,src) {
    //
    let prot = location.protocol
    let sp = "//"
    let url = `${prot}${sp}${counter_link}/clear-media/${tracking}`
    if ( (typeof session === 'string') && session.length > 0 ) {
        url += `/${session}`
    }
    //
    try {
        let result = await fetchUrl(url)
        if ( result.status === "OK" ) {
            return result.links
        }
    } catch(e) {
    }
    return false
}

function retrieve_session() {
    return ""
}

