	//
	var reEmail = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
	function checkEmailField(efield) {
		let email = efield.value
		if ( !(reEmail.test(email)) ) {
		  return(false)
		}
		return(true)
	}

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	function getVal(the_field) {
		if ( the_field ) {
			let val = the_field.value;
			if ( val.length ) {
				val = encodeURIComponent(val)
			}
			return(val)
		}
		return("")
	}

	function is_empty(the_field) {
		if ( the_field && ( the_field.value.length > 0 ) ) {
			return(false)
		}
		return(true)
	}

	function colorize(theField,colr) {
		theField.style.borderColor = colr;
	}

