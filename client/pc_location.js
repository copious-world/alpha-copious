// MODULE: PC LOCATION (windowized)

// AFTER LOADING

const DEFAULT_LOCATION_DISPLAY_ELEMENT = "wv-geo-location"

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

/**
 * A  GeoLocationHandler is applied to db a part of some session (e.g. recording session).
 * Each part may have a location at which it is recorded. (can be used in identity formation)
 * This information is passed on to a worker if it has been set.
 * The interface will request permission from the user.
 */
class GeoLocationHandler {
  
  constructor(update_interval) {
    this._pc_current_location = { 'latitude' : NaN,'longitude' : NaN }
    this._message_client = null
    this._geo_update_interval = null
    this._update_interval = update_interval ? update_interval : 0
  }


  set_messaging_client(m_client) {
    this._message_client = m_client
  }

  /**
   * If a location display is not passed then, this expects 
   * that there will be an element with id "wv-geo-location".
   * 
   * Also, a page global will be `this._pc_current_location`..
   * 
   * This will call the method pc_update_geo_location 
   * 
   * @param {string} location_diplay - optional
   */
  getLocation(location_diplay = DEFAULT_LOCATION_DISPLAY_ELEMENT) {
    if (navigator.geolocation) {
      let loc_display = document.getElementById(location_diplay);
      let self = this
      navigator.geolocation.watchPosition((position) => {  // watch position updates location at a system defined interval
        if ( loc_display ) loc_display.innerHTML = `${position.coords.latitude},${position.coords.longitude}`
        self._pc_current_location = { "latitude" : position.coords.latitude, "longitude" : position.coords.longitude }  // clone
        self.update_geo_location(self._pc_current_location)
      });
    } else { 
        alert("Geolocation is not supported by this browser.");
    }
  }

  location_as_string() {
    return JSON.stringify(this._pc_current_location)
  }


  /**
   * 
   * @param {*} location 
   */
  update_geo_location(location) {
    if ( !this._message_client ) return 
    let message = {
      'type' : 'geolocation',
      'geo_location' : location
    }
    this._message_client.postMessage(message)
  }
  
  stop_geo_update() {
    if ( this._geo_update_interval ) clearInterval(this._geo_update_interval)
  }

  restart_geo_update() {
    if ( !isNaN(this._update_interval) && (this._update_interval > 10) ) {
      if ( this._geo_update_interval ) clearInterval(this._geo_update_interval)
      let self = this
      this._geo_update_interval = setInterval(() => { self.getLocation() },this._update_interval)
    }
  }

}

