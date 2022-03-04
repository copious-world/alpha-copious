

//$>>	Uploader
// CONTENT FETCHING CLASS
class Uploader {
    //
    constructor(props) {
        this.errorDiv = props.errorDiv
        this.fileDiv = props.fileDiv
        this.uploadEndpoint = props.uploadEndpoint
        this.fileType = props.fileType ? props.fileType : '.mp3'
        this.emailField = props.emailField
        this.positiveCompletion = props.positiveCompletion
        //
        delete props.errorDiv
        delete props.fileDiv
        delete props.uploadEndpoint
        delete props.fileType
        delete props.emailField
        delete props.positiveCompletion
        //
        this.extra_props = {}
        for ( let prop in props ) {
            this.extra_props[prop] = props[prop]
        }
        //
        this._msgTimeout = null
    }
    //
    errorMessage(emsg) {
        let errDiv = document.querySelector(this.errorDiv)
        if ( errDiv ) {
            if ( this._msgTimeout ) {
                clearTimeout(this._msgTimeout)
            }
            errDiv.innerHTML = emsg
            this._msgTimeout = setTimeout(() => {
                let errDivNxt = document.querySelector(this.errorDiv)
                errDivNxt.innerHTML = ""
                this._msgTimeout = false
            },1500)
        }
    }
    // 
    checkFilesSelected(fileType) {
        let file = document.querySelector(this.fileDiv)
        if ( !file ) {
            return(false)
        }
        if ( !(file.value) || (file.value.indexOf(fileType) !== (file.value.length - 4)) ) {
            // File type is not .mp3
            return(false)
        }
        return(true)
    }

    checkForm(event) {
        let errField = document.querySelector(this.errorDiv)
        if ( this.emailField ) {
            let inspect_field = document.querySelector(this.emailField)
            if ( inspect_field && !checkEmailField(inspect_field) ) {
                inspect_field.style.borderColor="red"
                if (errField) errField.style.color = "red"
                this.errorMessage("unrecognized mail format")
                return(false)
            }
            if ( inspect_field ) inspect_field.style.borderColor="black"
        }
        //
        if ( this.fileDiv ) {
            let inspect_field = document.querySelector(this.fileDiv)
            if ( !(inspect_field) || !(this.fileType) ) {
                this.errorMessage("This page has not specified either a file container <div> or a file type in props [fileDiv,fileType]")
                return(false)
            }
            if ( !this.checkFilesSelected(this.fileType) ) {
                inspect_field.style.borderColor="red"
                if (errField) errField.style.color = "red"
                this.errorMessage("no file selected")
                return(false)
            }
            if ( inspect_field ) inspect_field.style.borderColor="black"
        }
        if (errField) errField.style.color = "darkgreen"
        this.errorMessage("")
        return(true)
    }

    async uploader() {
        if ( this.checkForm() ) {
            try {
                let data = new FormData()
                this.app_prepData(data)
                let json =  await postData(this.uploadEndpoint,data,'omit',false,'multipart/form-data')
                this.success_report(json)
                this.errorMessage(this.positiveCompletion)
                document.querySelector(this.errorDiv).style.color = "blue"
                return true
            } catch (e) {
                let emsg = e.message
                this.errorMessage(emsg)
                return false
            }
        }
    }
    
    app_prepData(data) {		// mp3 one file as default -- subclass and override
        let files = document.querySelector(this.fileDiv)
        let file = files.files[0]
        data.append('mp3file', file)
        let email = document.querySelector(this.emailField).value;
        data.append('email', email)
        for ( let p in this.extra_props ) {
            data.append(p, this.extra_props[p])
        }
    }

    success_report(json) {
        if ( this.positiveCompletion ) this.errorMessage(this.positiveCompletion)
        document.querySelector(this.errorDiv).style.color = "blue"
    }
}


//$$EXPORTABLE::
/*
Uploader
*/
