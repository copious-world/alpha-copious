// browser :: window.location
var g_siteURL = window.location.host;
var g_finalizers = []
//
var g_loginStateViewHolders = {}
var g_loginValueViews = {}
var g_LoggedIn = false
//
var g_global_web3_public_identity = false

let page_time = new Date()

let g_page_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let page_tz_str = page_time.toLocaleTimeString("en-US", { timeZone: g_page_timezone })
let page_tparts = page_tz_str.split(':')
let page_hr_update = parseInt(page_tparts[0])

let h_rest = page_tparts[2].split(' ')
let h_night_n_day = h_rest[1].trim()

if ( (h_night_n_day === "PM") && (page_hr_update !== 12) ) {
    page_hr_update += 12
}


let p_tz_date_str = page_time.toLocaleDateString("en-US", { timeZone: g_page_timezone })

var local_date_time = `Local Time: ${g_page_timezone} ${p_tz_date_str} ${page_tz_str}`
