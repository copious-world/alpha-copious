// MODULE: DRAG DIV (windowized)

// Make the DIV element draggagle:

//$>>	dragElement
function dragElement(floater_id,float_header_id) {

	let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

	let floater = document.getElementById(floater_id)
	let floater_h_bar = document.getElementById(float_header_id)

	if ( floater === undefined ) return
	if ( floater_h_bar === undefined ) return

	floater_h_bar.onmousedown = (e) => {
										e = e || window.event;
										e.preventDefault();
										// get the mouse cursor position at startup:
										pos3 = e.clientX;
										pos4 = e.clientY;
										document.onmouseup = closeDragElement;
										// call a function whenever the cursor moves:
										document.onmousemove = elementDrag;
									}

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		let newtop = (floater.offsetTop - pos2)
		let newleft =  (floater.offsetLeft - pos1)
		if ( newtop > 10 ) {
			floater.style.top = newtop + "px";
		}
		if ( newleft > 4 ) {
			floater.style.left = newleft + "px";
		}
	}

	function closeDragElement() {
		/* stop moving when mouse button is released:*/
		document.onmouseup = null;
		document.onmousemove = null;
	}

}




//$$EXPORTABLE::
/*
dragElement
*/
