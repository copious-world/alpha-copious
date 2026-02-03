
/**
 * Hides a particular box "interface-box" if it is included among the DOM
 */
function hide_interface_box() {
	hide_box('interface-box')
}

/**
 * 
 * @param {string} bxname 
 */
function hide_box(bxname) {
	let display = document.getElementById(bxname)
	if ( display ) {
		display.style.visibility = "hidden"
		display.style.display = "none"
	}
}

/**
 * 
 * @param {string} bxname 
 */
function show_box(bxname) {
	let display = document.getElementById(bxname)
	if ( display ) {
		display.style.visibility = "visible"
		display.style.display = "block"
	}
}


hide_box('error-box')
hide_box('success-box')

