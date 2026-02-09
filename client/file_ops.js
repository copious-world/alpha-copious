// MODULE: FILE OPS (windowized)

//$>>	get_file_from_file_element
// called in response to a file selection through the system file browser
//
function get_file_from_file_element(file_el_id) {
	let p = new Promise((resolve,reject) => {
		let file_el = document.getElementById(file_el_id)
		if ( !file_el ) reject(false)
		file_el.addEventListener('change',(ev) => {
			//
			let file = file_el.files[0]
			let mtype = file.type
			if ( ext_of_file(file.name) === 'json' ) {
				let reader = new FileReader();
				if ( mtype === 'application/json' ) {
					reader.onload = (e) => {
						resolve(e.target.result)
					};
					reader.readAsText(file);
				}
			}
			//
		})
		file_el.click()
	})
	//
	return p
}


//$>>	get_blob_file_from_file_element
// called in response to a file selection through the system file browser
//
function get_blob_file_from_file_element(file_el_id) {
	let p = new Promise((resolve,reject) => {
		let file_el = document.getElementById(file_el_id)
		file_el.addEventListener('change',(ev) => {
			//
			let file = file_el.files[0]
			// let mtype = file.type
            let reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result)
            };
            reader.readAsDataURL(file);
			//
		})
		file_el.click()
	})
	//
	return p
}



//$>>	generic_downloader
function generic_downloader(dataStr) {
	let downloadlink = document.getElementById("identity-download-link")
	if ( !(downloadlink) ) return false
	try {
		let mime_type = dataStr.substring(dataStr.indexOf(":")+1, dataStr.indexOf(";"))
		//
		let ext = mime_type.split('/')[1]
		//
		downloadlink.setAttribute("href",     dataStr     );
		downloadlink.setAttribute("download", (`untitled.${ext}`) );
		downloadlink.click();
	} catch (e) {}
}



function drop(items,files) {
    //
    let p = new Promise((resolve,reject) => {
        if ( items ) {
            // Use DataTransferItemList interface to access the file(s)
            for ( let i = 0; i < items.length; i++ ) {
                if ( items[i].kind === 'file' ) {
                    let file = items[i].getAsFile();
                    let fname = file.name
                    var reader = new FileReader();
                        reader.onload = async (e) => {
                            let blob64 = e.target.result
                            resolve([fname,blob64])
                        };
                        reader.readAsDataURL(file)
                    break
                }
            }
        } else if ( files ) {
            // Use DataTransfer interface to access the file(s)
            for ( let i = 0; i < files.length; i++ ) {
                let file = files[i].getAsFile();
                let fname = file.name
                reader.onload = (e) => {
                    let blob64 = e.target.result
                    resolve([fname,blob64])
                };
                reader.readAsDataURL(file)
                break
            }
        } else {
            reject(false)
        }
    })
    return p
}


//$$EXPORTABLE::
/*
get_file_from_file_element
get_blob_file_from_file_element
generic_downloader
drop
*/
