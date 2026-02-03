function promise_handling(source_name) {
	if ( g_responder_tables[source_name] !== undefined ) {  // do we implement this entry?
		let p = new Promise((resolve,reject) => {
			g_responder_tables[source_name].resolver = (resp_obj) => {
				g_responder_tables[source_name] = {
					"resolver" : false,
					"rejector" : false            
				}
				resolve(resp_obj)
			}
			g_responder_tables[source_name].rejector = () => {
				g_responder_tables[source_name] = {
					"resolver" : false,
					"rejector" : false            
				}
				reject(false)
			}
		})
		return p    
	}
	return false
}
