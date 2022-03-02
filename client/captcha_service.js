
// Wrapper for captcha ...

var g_ComponentErrorsActivated = false
var g_CurContainer = null


async function processUI_captchaService(handlerDefsValidator,calcAppDataDB,completionaAction,failureAction) {
	//
	g_ComponentErrorsActivated = true	// will be processing errors, etc. some selective behavior permitted
	g_CurContainer = handlerDefsValidator
	//
	if ( g_CurContainer && g_CurContainer.checkFormValid() ) {
		try {
			// CAPTCH PROCESSING 
			let captchaResult = await doCaptcha('','{{auth_path}}')   // the captcha has to be processed first.
			// CAPTCH RESULT 
			if ( captchaResult === true ) {
				if ( g_currenCaptchaTOKEN ) {
					let data = await calcAppDataDB()		// calcAppDataDB
					if ( data ) {
						try {
							let resp = await postData(g_CurContainer.service_url, data,'include')
							if ( resp.OK === "true" ) {
								g_currenCaptchaTOKEN = null;     // check for duplicates
								if ( completionaAction ) await completionaAction(resp);
							} else {
								g_CurContainer.formErrorMessage(`${g_CurContainer.failure_msg_prefix}: ${resp.reason}`)
								if ( failureAction ) failureAction(resp)
							}
						} catch (e) {
							g_CurContainer.formErrorMessage(`${g_CurContainer.failure_msg_prefix}: ${e.message}`)
							if ( failureAction ) failureAction(resp)
						}
					} else {
						g_CurContainer.formErrorMessage(`${g_CurContainer.failure_msg_prefix}: ${e.message}`)
						if ( failureAction ) failureAction(resp)
					}
				}
			} else {
				if ( captchaResult !== false ) {
					g_CurContainer.switchCaptchaDisplay(false)
					if ( captchaResult !== undefined ) {
						g_CurContainer.formErrorMessage(captchaResult)
					} else {
						g_CurContainer.formErrorMessage("Web service not responding.")
					}
				}
			}
		} catch(e) {
			console.log(e.message)
		}
	} else {
		if ( g_CurContainer === undefined ) {
			throw new Error("The current container is not defined in processUI_captchaService.")
		}
	}
}
