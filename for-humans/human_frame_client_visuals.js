
// BEFORE LOADING

/**
 * 
 * @param {number} size 
 * @param {string} title 
 */
function adjust_dashboard_frame_top(size,title) {
//
    let dash_frame = document.getElementById("dashboard-frame")
    let pre2 = document.getElementById("special-dash-link")
    let bot_dash_ctrl = document.getElementById("dash_control")
    let on_display = (pre2.style.display !== 'none') && (pre2.style.display.length > 0)
    //
    let sheader = null
    if ( size ) sheader = document.getElementById("top-controls")
    else sheader = document.getElementById("super-header")
    if ( sheader ) {
        let sbox = sheader.getBoundingClientRect()
        let sh_adjust = sbox.bottom
        if ( on_display ) {
            let box = pre2.getBoundingClientRect()
            dash_frame.style.top = (box.bottom - sh_adjust) + "px"
        } else {
            let box = bot_dash_ctrl.getBoundingClientRect()
            dash_frame.style.top = (box.bottom - sh_adjust) + "px"
        }
    }

    let w_problem = document.getElementById("special-app-link")
    w_problem.style.width = pre2.width + 'px'

    w_problem = document.getElementById("special-dash-link")
    w_problem.style.width = pre2.width + 'px'

    update_selected_frame_title(title)
}

/**
 * 
 * @param {string} title 
 */
function update_selected_frame_title(title) {
    if ( title != undefined ) {
        let title_spot = document.getElementById('put-sel-frame-here')
        if ( title_spot ) {
            title_spot.textContent = title
        }
    }
}

/**
 * 
 */
function show_special_link_entry() {
    hide_div("special-link-opener",true)
    show_div("special-app-link",true)
    show_div("special-link-hider",true)
    adjust_dashboard_frame_top()
}

/**
 * 
 */
function hide_special_link_entry() {
    show_div("special-link-opener",true)
    hide_div("special-app-link",true)
    hide_div("special-link-hider",true)
    adjust_dashboard_frame_top()
}


/**
 * 
 */
function show_special_dash_entry() {
    hide_div("special-dash-opener",true)
    show_div("special-dash-link",true)
    show_div("special-dash-hider",true)
    adjust_dashboard_frame_top()
}

/**
 * 
 */
function hide_special_dash_entry() {
    show_div("special-dash-opener",true)
    hide_div("special-dash-link",true)
    hide_div("special-dash-hider",true)
    adjust_dashboard_frame_top()
}



// --- startup


/**
 * 
 */
function show_controls() {
    hide_div("open-controls",true)
    show_div("user-controls",true)
}
function hide_controls() {
    hide_div("user-controls",true)
    show_div("open-controls",true)
}


setTimeout(() => {
    hide_special_link_entry()
    hide_special_dash_entry()
}, 40)


/**
 * 
 * @param {string} did 
 * @param {number} n_btn 
 * @param {number} size 
 */
function hide_div(did,n_btn,size) {
    let dobj = document.getElementById(did)
    if ( dobj ) {
        dobj.style.display = "none"
    }
    if ( !(n_btn) ) {
        let bid = did+"-btn"
        if ( size ) {
            bid += `-${size}`
        }
        let dobjbtn = document.getElementById(bid)
        if ( dobjbtn ) {
            dobjbtn.classList = ""
        }
    }
}

/**
 * 
 * @param {string} did 
 * @param {number} n_btn 
 * @param {number} size 
 */
function show_div(did,n_btn,size) {
    let dobj = document.getElementById(did)
    if ( dobj ) {
        dobj.style.display = n_btn ? "inline-block" : "block"
    }
    if ( !(n_btn) ) {
        let bid = did+"-btn"
        if ( size ) {
            bid += `-${size}`
        }
        let dobjbtn = document.getElementById(bid)
        if ( dobjbtn ) {
            dobjbtn.classList = "selected-frame"
        }
    }
}

// left as functions to make it easier to render html click handlers
//
// ---- show_local_data
/**
 * 
 * @param {number} size 
 * @param {string} title 
 */
function show_local_data(size,title) {
    hide_div("application_container",false,size)
    hide_div("manager_container",false,size)
    hide_div("wallet_container",false,size)
    if ( size != undefined ) {
        show_div("db_container",false,size)
    } else {
        show_div("db_container")
    }
    adjust_dashboard_frame_top(size,title)
}


/**
 * 
 * @param {number} size 
 * @param {string} title 
 */
function show_id_manager(size,title) {
    hide_div("application_container",false,size)
    hide_div("db_container",false,size)
    hide_div("wallet_container",false,size)
    if ( size != undefined ) {
        show_div("manager_container",false,size)
    } else {
        show_div("manager_container")
    }
    update_selected_frame_title(title)
}

/**
 * 
 */
function navigate_to_uploader() {
    show_id_manager()
    show_id_manager('sml','identity manager')
}

/**
 * 
 * @param {number} size 
 * @param {string} title 
 */
function show_wallet_manager(size,title) {
    hide_div("application_container",false,size)
    hide_div("db_container",false,size)   
    hide_div("manager_container",false,size)
    if ( size != undefined ) {
        show_div("wallet_container",false,size)
    } else {
        show_div("wallet_container")
    }
    update_selected_frame_title(title)
}


/**
 * 
 * @param {number} size 
 * @param {string} title 
 */
function show_application(size,title) {
    hide_div("manager_container",false,size)
    hide_div("db_container",false,size)
    hide_div("wallet_container",false,size)
    if ( size != undefined ) {
        show_div("application_container",false,size)
    } else {
        show_div("application_container")
    }
    update_selected_frame_title(title)
}


/**
 * 
 */
function show_uploader() {
    show_local_data()
}




