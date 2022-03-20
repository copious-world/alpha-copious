// MODULE: FILE OPS (windowized)

//$>>	get_file_from_file_element
// called in response to a file selection through the system file browser
//
function get_file_from_file_element(file_el) {
	let p = new Promise((resolve,reject) => {
		let file_el = document.getElementById(file_el)
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



//$$EXPORTABLE::
/*
get_file
generic_downloader
*/