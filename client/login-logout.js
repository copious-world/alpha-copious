// MODULE: LOGIN LOGOUT (windowized)


// --------- LOGIN // REGISTER
// links on this page...

//$>>	login_process
var g_login_Handling = null
function login_process() {
	let login = document.querySelector("#login")
	if ( login ) {
		login.style.visibility = "visible"
		login.style.display = "block";
		//
		unpin_current();
		g_CurContainer = g_login_Handling
		//
		//hide other things
		let register = document.querySelector("#register")
		if ( register ) {
			register.style.visibility = "hidden"
			register.style.display = "none";
		}
	}
	login_opening_view()	// app implements
}

//$>>	hide_login_process
function hide_login_process() {
	if ( g_login_Handling ) {
		g_login_Handling.switchCaptchaDisplay(false)
	}
	//hide other things
	let login = document.querySelector("#login")
	if ( login ) {
		login.style.visibility = "hidden"
		login.style.display = "none";
	}
}

//$>>	retry_password
var g_login_failure = null
function retry_password() {
	login_process()
	if ( g_login_failure ) g_login_failure()
}




//  === ---------------------------------------  === ---------------------------------------  === --------------------------------------- 

//$>>	logout
async function logout(originator = true) {
	// send synch message
	g_LoggedIn = await app_process_logout(originator)
	// then
	if ( !g_LoggedIn ) {
		for ( let key in g_loginStateViewHolders ) {
			let stateHolder = g_loginStateViewHolders[key]
			if ( stateHolder ) {
				let element = stateHolder.element
				element.innerHTML = stateHolder.unauthed
				element.style.visibility = true
				element.style.display = "block"
			}
		}
	}
	//
	resize()
}

//$>>	loginView
function loginView(accountData) {
	hide_login_process()
	g_LoggedIn = true
	for ( let key in g_loginStateViewHolders ) {
		let stateHolder = g_loginStateViewHolders[key]
		let element = stateHolder.element
		if ( stateHolder.authed ) {
			if ( stateHolder.action ) {
				element.innerHTML = g_loginValueViews[stateHolder.action](accountData,stateHolder.authed)
			} else {
				element.innerHTML = stateHolder.authed
			}
		}
	}
	resize()
}


//$>>	setupLogoutRestoration
//                                          <<var-depends>> greetAndMeetContainer1,greetAndMeetContainer2
function setupLogoutRestoration() {
	let g_originalGreetAndMeet1 = greetAndMeetContainer1.innerHTML
	let g_originalGreetAndMeet2 = greetAndMeetContainer2.innerHTML
	let profile_dom =  document.getElementById('profile-line-container')
	let profileHTML = profile_dom ? profile_dom.innerHTML : "profile link goes here"
	let dashboard_dom =  document.getElementById('dashboard_dom-line-container')
	let dashboardHTML = dashboard_dom ? dashboard_dom.innerHTML : "dashboard link goes here"
	g_loginStateViewHolders["gAndM1"] = {
		'element' : greetAndMeetContainer1,
		'unauthed' : g_originalGreetAndMeet1,
		'authed' : profileHTML,
		'action' : `{{yourProileLinks.instantiate}}`
	}
	g_loginStateViewHolders["gAndM2"] = {
		'element' : greetAndMeetContainer2,
		'unauthed' : g_originalGreetAndMeet2,
		'authed' : dashboardHTML,
		'action' : `{{yourDashboardLinks.instantiate}}`
	}
	profileHTML.textContent = '';
	dashboardHTML.textContent = '';
}



//$$EXPORTABLE::
/*
login_process
hide_login_process
retry_password
logout
loginView
setupLogoutRestoration
*/
