
// // // ----------------- // // // ----------------- // // // -----------------
// // // ----------------- // // // ----------------- // // // -----------------

let login_opener = async (evt) => {
	let human_info = await intergalactic_session_going()
	if ( human_info === false ) {
		await open_intergalactic_session_window("login",g_current_pub_identity,false)
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
		await open_intergalactic_session_window("private-blog",human_info,human_info.session)
	} else {
		open_public_window("blog")
	}
}
let demos_opener = async (evt) => {
	let human_info = await intergalactic_session_going()
	if ( human_info !== false ) {
		await open_intergalactic_session_window("private-demos",human_info,human_info.session)
	} else {
		open_public_window("demos")
	}
}
let streams_opener = async (evt) => {
	let human_info = await intergalactic_session_going()
	if ( human_info !== false ) {
		await open_intergalactic_session_window("private-streams",human_info,human_info.session)
	} else {
		open_public_window("streams")
	}
}
let composites_opener = async (evt) => {
	let human_info = await intergalactic_session_going()
	if ( human_info !== false ) {
		await open_intergalactic_session_window("private-composites",human_info,human_info.session)
	} else {
		open_public_window("composites")
	}
}




function show_intergalactic_explain() {
	let explainer = document.getElementById('intergalactic-explain')
	if ( explainer ) {
		explainer.style.visibility = "visible"
		explainer.style.display = "block"
	}
}

/*
audios_1
greet_and_meet_2
*/

/**
 * If the page has been loggged in, then the public identity will have been loaded into the context.
 * First. the session of the public identity is discarded
 * Then, the DB version of it is updated to keep the session from reloading.
 * Finally, the appearance of the page is changed to the logged out state, and the reference to the public identity is discarded.
 */
async function logout_process() {
    if ( g_current_pub_identity ) {
        delete g_current_pub_identity.session
        await update_galactic_identity(g_current_pub_identity)
        visual_session_indicator(false)
        g_current_pub_identity = false
    }
}


function hide_login() {
    let greeter = document.getElementById("greet_and_meet_2")
    let solong = document.getElementById("audios_1")

    if ( greeter && solong ) {
        greeter.style.display = "none"
        solong.style.display = "block"
    }
}

function show_login() {
    let greeter = document.getElementById("greet_and_meet_2")
    let solong = document.getElementById("audios_1")

    if ( greeter && solong ) {
        greeter.style.display = "block"
        solong.style.display = "none"
    }
}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

if ( typeof visual_session_indicator === "function" ) {
	visual_session_indicator = (boolval) => {
		/// show hide indicator
		if ( boolval ) {
			hide_login()
		} else {
			show_login()
		}
	}
}

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
