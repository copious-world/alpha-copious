




async function drop_biometric(ev) {
    ev.preventDefault();
    try {
        let files = ev.dataTransfer.files ? ev.dataTransfer.files : false
        let items = ev.dataTransfer.items ? ev.dataTransfer.items : false
        let [fname,blob64] = await utils.drop(items,files)
        // 
        let bio_data = blob64;
        let u_info = await do_update_on_server(bio_data)  // returns the user info with the updated ingergalactic ID
        //
        if ( u_info !== false ) {
            await human_frame_application_id_installation(u_info)  // the private key is stored in the local DB
        }
        //
    } catch (e) {
        console.log(e)
    }
}


// ----
async function bio_dragover_picture(ev) {
    ev.preventDefault();
}

// ----
async function load_biometric(ev) {
    //
    let bio_data = await load_blob_as_url()
    let u_info = await do_update_on_server(bio_data)
    if ( u_info !== false ) {
        await human_frame_application_id_installation(u_info)
        await startup()
    }
    //
}


