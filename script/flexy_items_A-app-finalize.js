
// // // ----------------- // // // ----------------- // // // -----------------
// // // ----------------- // // // ----------------- // // // -----------------

let login_opener = async (evt) => {
	let human_info = await intergalactic_session_going()
	if ( human_info === false ) {
		await open_intergalactic_session_window("login",human_info,{})
	}
}
let chat_opener = async (evt) => {
	let human_info = await intergalactic_session_going()
	if ( human_info !== false ) {
		await open_intergalactic_session_window("chat",human_info,human_info.session)
	} else {
		if ( typeof suggest_login === "function" ) suggest_login("chat")
		else alert("login to chat")
	}
}
let blog_opener = async (evt) => {
	let human_info = await intergalactic_session_going()
	if ( human_info !== false ) {
		await open_intergalactic_session_window("blog",human_info,human_info.session)
	} else {
		open_public_window("blog")
	}
}
let demos_opener = async (evt) => {
	let human_info = await intergalactic_session_going()
	if ( human_info !== false ) {
		await open_intergalactic_session_window("demos",human_info,human_info.session)
	} else {
		open_public_window("demos")
	}
}


function show_intergalactic_explain() {
	let explainer = document.getElementById('intergalactic-explain')
	if ( explainer ) {
		explainer.style.visibility = "visible"
		explainer.style.display = "block"
	}
}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

// initial validation application is contact
g_CurContainer = null // will be initilialized within the finalizers

// EXTRA STUFF for some gracefull clicing
var the_thankyou_box = document.getElementById("thankyou_box");

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
	if ( g_CurContainer && (event.target == g_CurContainer.closer) ) {
		g_CurContainer.switchCaptchaDisplay(false)
		g_CurContainer.hideFormErrorMessage();
	}
	hide_thankyou_box(the_thankyou_box)
}

setupCaptchaClose()


// ---- run_finalizers
async function run_finalizers() {
	for ( let fn of g_finalizers ) {
		await fn()
	}
}
//
run_finalizers()
if ( typeof setupLogoutRestoration === "function" ) setupLogoutRestoration()

//
window.onresize = resize;
resize()
