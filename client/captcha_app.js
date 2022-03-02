
//  === ---------------------------------------  === ---------------------------------------  === --------------------------------------- 
// CAPTCHA
// -- -- -- -- -- -- -- -- -- -- -- -- --  -- -- -- -- -- -- -- -- -- -- -- -- --  -- -- -- -- -- -- -- -- -- -- -- -- --  -- -- -- -- -- 

var g_currenCaptchaTOKEN = null; 	// delivered by the authorization handler, which maps this interaction to a session.
var g_captaFinalResolution = null;  // will be a function for completing a captcha

async function captchaCheck(callBack) {
	//
	let captchaGuessField = g_CurContainer.captch_input
	if ( captchaGuessField ) {
		let captchaVal = captchaGuessField.value;
		if ( captchaVal && captchaVal.length && g_currenCaptchaTOKEN ) {
			//
			let port = g_CurContainer.auth_port
			port = !(port) ? '' : ( port.length ? `:${port}`   : '')
			//
			try {
				let url = `${location.protocol}//${g_siteURL}${port}/{{auth_path}}/secondary/transition`
				let data = { 'captcha_val' : captchaVal, 'token' : g_currenCaptchaTOKEN }
				let resp = await postData(url, data)
				if ( resp.OK === "true" ) {
						if ( g_captaFinalResolution !== null ) {
							g_captaFinalResolution(1)
						}
				} else {
						if ( g_captaFinalResolution !== null ) {
							g_captaFinalResolution(2,"captcha does not match: try again")
						}
				}
			} catch (e) {
				console.log(e.message)
			}
		}
	}
	//
}

function captchaPromises() {
	return new Promise((resolve,reject) => {
							g_captaFinalResolution = (a,b) => {
								//
								if ( a === 1 ) {
									resolve(true);
								} else if ( a == 2 ) {
									resolve(b)
								} else if ( a == 3 ) {
									reject(-1)
								}
							}
						})
}


async function doCaptcha(port,proxyPath) {
	//
	if (g_CurContainer ) g_CurContainer.switchCaptchaDisplay(true)
	else {
		throw new Error("Current container undefined in doCaptcha")
	}
	//
	try {
		port = !(port) ? '' : ( port.length ? `:${port}`   : '')
			//
		let endpoint = `${location.protocol}//${g_siteURL}${port}/${proxyPath}/transition/captcha`
		let captchaObject = await postData(endpoint)
		if ( (captchaObject.type == "transition") && (captchaObject.OK == 'true') )  {
			let svgText = decodeURIComponent(captchaObject.elements.captcha)
			let captchaPlacement = g_CurContainer.where_captcha
			if ( captchaPlacement ) {
				captchaPlacement.innerHTML = svgText
				g_currenCaptchaTOKEN = captchaObject.transition.token
				g_CurContainer.captch_input.value = ''
			}
			//
			return await captchaPromises();  // wait for user interaction to finish else 
		} else {
			g_CurContainer.formErrorMessage("captcha service not available")
		}
	} catch (e) {
		console.log(e.message)  // page level error may be needed
	}
}


// Get the <span> element that closes the modal
function setupCaptchaClose() {
	let closerList = document.getElementsByClassName("close");
	let n = closerList.length
	for ( let i = 0; i < n; i++ ) {
		let span = closerList[i]
		span.onclick = function() {
			if ( g_CurContainer ) g_CurContainer.switchCaptchaDisplay(false)
			if ( g_captaFinalResolution ) g_captaFinalResolution(3)
		}
	}
}

