// MODULE: PC LOCATION (windowized)

// AFTER LOADING

//$>>	pc_getLocation

const DEFAULT_LOCATION_DISPLAY_ELEMENT = "wv-geo-location"

/**
 * If a location display is not passed then, this expects 
 * that there will be an element with id "wv-geo-location".
 * 
 * Also, a page global will be `g_pc_current_location`..
 * 
 * This will call the method pc_update_geo_location 
 * 
 * @param {string} location_diplay - optional
 */
function pc_getLocation(location_diplay = DEFAULT_LOCATION_DISPLAY_ELEMENT) {
  if (navigator.geolocation) {
    let loc_display = document.getElementById(location_diplay);
    navigator.geolocation.watchPosition((position) => {  // watch position updates location at a system defined interval
      if ( loc_display ) loc_display.innerHTML = `${position.coords.latitude},${position.coords.longitude}`
      g_pc_current_location = { "latitude" : position.coords.latitude, "longitude" : position.coords.longitude }  // clone
      pc_update_geo_location(g_pc_current_location)
    });
  } else { 
      alert("Geolocation is not supported by this browser.");
  }
}
  
  

//$$EXPORTABLE::
/*
pc_getLocation
*/