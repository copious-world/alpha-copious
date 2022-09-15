
// === ---------------------------------------  === ---------------------------------------  === --------------------------------------- 
// CONTENT GENERATION
// ---- ---- ---- ---- ---- ----
function centerBoxText(tightpace) {
	if ( !tightpace ) {
		return `<div class="middleBanner">
		<p style="text-align:center">{{middleBoxHook}}</p>
		<blockquote style="text-align:center;padding-bottom:4px;">
		<button id="contact-btn"	onmouseup="pinBox('#contact_box')" onmouseover="defadeBox('#contact_box')" onmouseleave="fade_apparition(this,event)" >contact</button>
		<button id="topicBox_1-btn"	onmouseup="pinBox('#topicBox_1')" onmouseover="defadeBox('#topicBox_1')" onmouseleave="fade_apparition(this,event)" >{{topicBox_1.name}}</button>
		<button id="about-btn"		onmouseup="pinBox('#about_box')" onmouseover="defadeBox('#about_box')" onmouseleave="fade_apparition(this,event)" >about</button>
		</blockquote>
		</div>`;
	} else {
		return `<div class="middleBanner">
		<p style="text-align:center">{{middleBoxHook}}</p>
		<blockquote style="text-align:center;padding-bottom:4px;">
		<button id="contact-btn"	onmouseup="pinBox('#contact_box')" onmouseover="defadeBox('#contact_box')" onmouseleave="fade_apparition(this,event)" >contact</button>
		<button id="about-btn"		onmouseup="pinBox('#about_box')" onmouseover="defadeBox('#about_box')" onmouseleave="fade_apparition(this,event)" >about</button>
		</blockquote>
		</div>`;
	}
}

function rightBoxText() {
	return `<div class="extraBanner">
	<p style="text-align:center">{{rightBoxHook}}</p>
	<br>
	<blockquote style="text-align:center;padding-bottom:4px">
	<button id="topicBox_2-btn"	onmouseup="pinBox('#topicBox_2')" onmouseover="defadeBox('#topicBox_2')" onmouseleave="fade_apparition(this,event)" >{{topicBox_2.name}}</button>
	<button id="topicBox_3-btn"	onmouseup="pinBox('#topicBox_3')" onmouseover="defadeBox('#topicBox_3')" onmouseleave="fade_apparition(this,event)" >{{topicBox_3.name}}</button>
	</blockquote>
	</div>`;
}

function logoutForDropdown() {
	if ( g_LoggedIn ) {
		return `
	<div style='text-align:center' >
		<button class='logout' onclick='logout()'>logout</button>
	</div>
	`
	} else {
		return ""
	}
}

// independent floating box..

function hide_thankyou_box(theBox) {
	theBox.style.visibility = "hidden"
	theBox.style.display = "none";
	theBox.style.zIndex = 0
}

function show_thankyou_box(msg) {
	let theBox = document.querySelector("#thankyou_box")
	if ( theBox ) {
		if ( msg ) {
			let mbox = document.querySelector("#thankyou_box-message")
			if ( mbox ) mbox.innerHTML = msg

		}
		theBox.style.display = "block";
		theBox.style.visibility = "visible"
		theBox.style.zIndex = 2000
	}
}


// ---- ---- ---- ---- ---- ----
function lowerFillerText() {
	let content = `{{{decoratedLinks.content}}}`
	content = decodeURIComponent(content)
	return `<div class="fillLower">
		${content}
	</div>`;
}


function menuHandler(mHandle) {
	if ( squashMenuContainer.style.visibility !== "visible" && (mHandle !== null) ) {
		squashMenuContainer.style.visibility = "visible"
		squashMenuContainer.style.top = "60px";
		squashMenuContainer.style.left = (Math.floor(window.innerWidth/2) - 40) + "px";
		squashMenuContainer.style.height = (window.innerHeight - 64) + "px";
		squashMenuContainer.style.width = (Math.floor(window.innerWidth/2) + 34) + "px";
		//
		let lowerText = lowerFillerText();
		let menuLower = `<div class="fitMenuLower">
		${lowerText}
		</div>`
		squashMenuContainer.innerHTML = logoutForDropdown() + centerBoxText(false) + rightBoxText() + menuLower;
		//
	} else {
		squashMenuContainer.style.visibility = "hidden"
	}
}

function releaseMenu(mHandle) {
	
}
