
// // // ----------------- // // // ----------------- // // // -----------------
// // // ----------------- // // // ----------------- // // // -----------------

let chat_opener = () => {}
let blog_opener = () => {}
let demos_opener = () => {}

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
setupLogoutRestoration()

//
window.onresize = resize;
resize()
