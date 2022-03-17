


//$>>	pc_getLocation

function pc_getLocation() {
    if (navigator.geolocation) {
      let loc_display = document.getElementById("wv-geo-location");
      navigator.geolocation.watchPosition((position) => {  // watch position updates location at a system defined interval
        if ( loc_display ) loc_display.innerHTML = `${position.coords.latitude},${position.coords.longitude}`
        g_pc_current_locaion = { "latitude" : position.coords.latitude, "longitude" : position.coords.longitude }  // clone
        pc_update_geo_location(g_pc_current_locaion)
      });
    } else { 
      alert("Geolocation is not supported by this browser.");
    }
  }
  
  



//$$EXPORTABLE::
/*
pc_getLocation
*/