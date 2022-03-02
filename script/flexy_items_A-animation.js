
// === ---------------------------------------  === ---------------------------------------  === --------------------------------------- 
// ANIMATION
// -- -- -- -- -- -- -- -- -- -- -- -- -- 
//

var g_apparition = null;
var g_current_pin = null;
var g_fade_scheduled = null;
var g_defade_scheduled = null;

function togglebar(the_bar,state) {
	// enter exit animation
	if ( state == 1 ) {
		if ( the_bar ) {
			the_bar.style.backgroundColor = "darkgreen"
		}
	} else {
		if ( the_bar ) {
			the_bar.style.backgroundColor = "navy"
		}

	}
}

function hideFader(fdr) {
	fdr.style.visibility = "hidden"
	fdr.style.zIndex = -10
	stopDefade()
	stopFade()
	g_apparition = null;
	g_current_pin = null;
	if ( !g_ComponentErrorsActivated ) {
		if ( g_CurContainer ) g_CurContainer.hideFormErrorMessage();
	}
}

function closefader(whichFader) {
	clear_pin_time()
	let fdr = document.querySelector('#' + whichFader);
	hideFader(fdr)
	if ( g_CurContainer ) g_CurContainer.hideFormErrorMessage();
}

function closesolid(whichSolid) {
	let sld = document.querySelector('#' + whichSolid);
	sld.style.visibility = "hidden"
	sld.style.display = "none";
}
// ---- ---- ---- ---- ---- ----

let g_pin_time = false
function newest_pin(pinned) {
	g_pin_time = Date.now()
	setTimeout(() => { g_pin_time = false }, 5500 )
}

function recent_pin(pinned) {
	if ( g_pin_time === false ) {
		return false
	}
	let check_time = Date.now()
	if ( (check_time - g_pin_time)  > 5000 ) {
		g_pin_time = false
		return false
	}
	return true
}

function clear_pin_time() {
	g_pin_time = false
}


function unpin_current() {
	if ( recent_pin(g_current_pin) ) {
		return false
	}
	if ( g_CurContainer )  {
		g_CurContainer.switchCaptchaDisplay(false)
		g_CurContainer.hideFormErrorMessage();
	}
	if ( g_current_pin != null ) {
		g_current_pin.style.visibility = "hidden";
		g_current_pin.style.zIndex = -10
	}
	return true
}
function fade_apparition(btn,evt) {
	if ( g_apparition !== null ) {
		var fader = g_apparition;
		//if ( evt ) console.log(fader.offsetWidth + "," + evt.clientX + "," + window.innerWidth)
		if ( ( evt !== undefined )&& (fader.offsetWidth >= evt.clientX) ) {
			return;
		}
		stopDefade()
		g_defade_scheduled = setInterval(() => { lowerAlpha(fader); },50);
	}
}
function stopDefade() {
	if ( g_defade_scheduled != null ) {
		clearInterval(g_defade_scheduled);
	}
}
function stopFade() {
	if ( g_fade_scheduled != null ) {
		clearInterval(g_fade_scheduled);
	}
}
function pin_ItsAlive(pinned) {
	newest_pin(pinned)
	if ( pinned && (typeof pinned.openAction === 'function')) {
		pinned.openAction()
	}
	g_apparition = null;
}
// ---- ---- ---- ---- ---- ----
function raiseAlpha(aGhost) {
	if ( aGhost.style.opacity == 1.0 ) {
		stopDefade()
		pinBoxElem(aGhost)
	} else {
		aGhost.style.opacity = parseFloat(aGhost.style.opacity) + 0.025;
	}
}
function lowerAlpha(aGhost) {
	if ( aGhost.style.opacity <= 0.2 ) {
		hideFader(aGhost)
	} else {
		aGhost.style.opacity = parseFloat(aGhost.style.opacity) - 0.1;
	}
}
// ---- ---- ---- ---- ---- ----
function replaceApparition(newGhost) {
	if ( !unpin_current() ) {
		return
	}
	if ( g_apparition !== null ) {
		stopDefade()
		stopFade()
		g_apparition.style.visibility = "hidden";
		newGhost.style.zIndex = -10
	}
	if ( newGhost !== null ) {
		newGhost.style.opacity = "0.0"
		newGhost.style.visibility = "visible"
		newGhost.style.zIndex = 200
		g_apparition = newGhost
		g_defade_scheduled = setInterval(() => { raiseAlpha(newGhost); },50);
	}
}

// ---- ---- ---- ---- ---- ----
function pinBoxElem(thisPin) {
	clear_pin_time()
	if ( g_current_pin !== thisPin ) unpin_current();
	g_current_pin = thisPin;
	stopDefade()
	thisPin.style.opacity = "0.0"
	thisPin.style.visibility = "visible"
	thisPin.style.zIndex = 200
	//
	thisPin.style.opacity = "1.0"
	pin_ItsAlive(g_current_pin);
}
function pinBox(selector) {
	let thisPin = document.querySelector(selector);
	pinBoxElem(thisPin)
}

// ---- ---- ---- ---- ---- ----
function defadeBox(selector) {
	replaceApparition(document.querySelector(selector));
}

function resize() {
	if ( menuHandler !== undefined ) menuHandler(null)
	if ( window.innerWidth >= 1100 ) {
		if ( centerBox ) {
			centerBox.innerHTML = centerBoxText( (window.innerWidth <= 1040) );
			centerBox.style.visibility = "visible";
			centerBox.style.display = "block";
		}
		rightBox.innerHTML = rightBoxText();
		squashMenu.style.visibility = "hidden";
		squashMenuContainer.style.visibility = "hidden";
		rightBox.style.visibility = "visible";
		rightBox.style.display = "block";
		if ( g_LoggedIn ) {
			logoutCtrl.style.visibility = "visible";
			logoutCtrl.style.display = "block";
		} else {
			logoutCtrl.style.visibility = "hidden";
			logoutCtrl.style.display = "none";
		}
		let logoutCtrlInDropdown = document.getElementById('logout-control-dropdown')
		if ( logoutCtrlInDropdown ) {
			logoutCtrlInDropdown.style.visibility = "hidden";
			logoutCtrlInDropdown.style.display = "none";
		}
	} else {
		if ( centerBox ) {
			centerBox.textContent = "";
			centerBox.style.visibility = "hidden";
			centerBox.style.display = "none";
		}
		rightBox.textContent = "";
		rightBox.style.visibility = "hidden";
		rightBox.style.display = "none";
		squashMenu.style.visibility = "visible";
		//
		logoutCtrl.style.visibility = "hidden";
		logoutCtrl.style.display = "none";
		if ( g_LoggedIn ) {
			let logoutCtrlInDropdown = document.getElementById('logout-control-dropdown')
			if ( logoutCtrlInDropdown ) {
				logoutCtrlInDropdown.style.visibility = "visible";
				logoutCtrlInDropdown.style.display = "block";
			}
		} else {
			let logoutCtrlInDropdown = document.getElementById('logout-control-dropdown')
			if ( logoutCtrlInDropdown ) {
				logoutCtrlInDropdown.style.visibility = "hidden";
				logoutCtrlInDropdown.style.display = "none";
			}
		}
	}
	if ( window.innerWidth >= 1100 ) {
		lowerFiller.innerHTML = lowerFillerText();
	} else {
		lowerFiller.textContent = "";
	}
}


