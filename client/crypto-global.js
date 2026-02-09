// MODULE: CRYPTO GLOBAL  (windowized)




//$>>	setup_window_crypto
function setup_window_crypto() {
  if ( window.g_crypto === undefined ) {
    window.g_crypto = window.crypto ? window.crypto.subtle : null
    if ( g_crypto === null  ) {
      alert("No cryptography support in this browser. To claim ownership of assets, please use another browser.")
    }
  }
}

//$$EXPORTABLE::
/*
setup_window_crypto
*/