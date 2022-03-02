
// === ---------------------------------------  === ---------------------------------------  === --------------------------------------- 
// VALIDATION
// -- -- -- -- -- -- -- -- -- -- -- -- -- 
//

class ValidationContainer {
    // 
    constructor(props) {
        this.errline = props.errors_here
        this.fields = props.fields
        this.checks = props.checks

        this.modal = props.modal
        this.closer = props.closer
        this.form = props.form
        this.where_captcha = props.captcha
        this.captch_input = props.captcha_field
        this.auth_port = props.auth_port
        this.password_rules = props.password_rules
        this.service_url = props.service_url

        this.plain_text_color = (props.plain_text_color !== undefined) ? props.plain_text_color : "black"
        this.error_text_color = (props.error_text_color !== undefined) ? props.error_text_color : "black"

        this.errline.style.visibility = "hidden"
        this.failure_msg_prefix = props.failure_msg_prefix
        this.empty_checker = props.is_empty ? props.is_empty : is_empty
    }

    hideFormErrorMessage() {
        let errline = this.errline
        if ( errline ) {
            errline.innerHTML = ""
            errline.style.visibility = "hidden"
        }
    }

    formErrorMessage(msg) {
        let errline = this.errline
        if ( errline ) {
            errline.innerHTML = msg
            errline.style.visibility = "visible"
        }
    }

    emptyFieldMessage(fields) { // name_empty,email_empty,commment_empty
        let msg = "The following fields require values: "
        //
        let sep = ','
        msg += fields.join(sep)
        this.formErrorMessage(msg);
    }

    emailFormatError() {
        this.formErrorMessage("Email does not match a known email format.");
    }

    passwordFieldError(whichFields) {
        this.formErrorMessage(`${whichFields} are required to have the same value`);
    }

    //
    checkFormValid() {
        //
        if ( !g_ComponentErrorsActivated ) {
            return(true);
        }
        //
        for ( let field in this.fields ) {
            let c = this.fields[field]
            colorize(c,this.plain_text_color)
        }
        //
        let mustHaveValue = this.checks.is_empty
        let empty_fields = mustHaveValue.filter((field) => {
            let c = this.fields[field]
            //colorize(c,"black")
            return(this.empty_checker(c))
        })
        //
        if ( empty_fields.length ) {
            this.emptyFieldMessage(empty_fields)
            empty_fields.forEach(field => {
                let c = this.fields[field]
                colorize(c,this.error_text_color)
            })
            return(false)
        }
        //
        let emailFields = this.checks.email
        emailFields.forEach(e_field => {
            let c = this.fields[e_field]
            if ( !checkEmailField(c) ) {
                this.emailFormatError();
                colorize(c,this.error_text_color)
                return(false);
            }
        })
        //
        if ( this.password_rules && (typeof this.password_rules === "function") ) {
            if ( this.checks.passwords && (this.checks.passwords.length) ) {
                let pvalues = this.checks.passwords.map(pfield => {
                        let c = this.fields[pfield]
                        if ( c ) {
                            return(c.value)
                        } else {
                            return(null)
                        }
                    })
                //
                let [check,violation] = this.password_rules(pvalues)
                //
                if ( !check ) {
                    let message = violation()
                    this.passwordFieldError(message)
                    return(false)
                }
                //
                this.hideFormErrorMessage()
            }
        }
        //
        return(true);
    }
    
    switchCaptchaDisplay(on_off) {
        if ( on_off ) {
            this.modal.style.display = "block";  // show captcha
            this.form.style.display = "none"
        } else {
            this.modal.style.display = "none";  // show captcha
            this.form.style.display = "block"
        }
    }
}



