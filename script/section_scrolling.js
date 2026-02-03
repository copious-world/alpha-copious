



function scroll_pin(view_center) {
	if ( window.innerWidth >= 1100 ) {
        if ( view_center !== 'section_1' ) {
            let sect_box = `#${view_center}_response`
            g_current_section_select = sect_box
            pinBox(sect_box)
        } else {
            g_current_section_select = 'section_1_response'
            unpin_current(true)
        }
    } else {
        let details = document.getElementById("scroll-info-button")
        if ( view_center !== 'section_1' ) {
            let sect_box = `#${view_center}_response`
            g_current_section_select = sect_box
            if (details) details.removeAttribute("disabled")
        } else {
            g_current_section_select = 'section_1_response'
            if (details) details.setAttribute("disabled",true)
        }
    }
}


function resize_sections(skip_container) {
    let above = document.getElementById("sections-header")
    let sects = document.getElementById("sections-container")
    if ( sects && above) {
        let abox = above.getBoundingClientRect()
        let box = sects.getBoundingClientRect()
        let pbox = sects.parentElement.getBoundingClientRect()
        //
        //
        let bbot = pbox.bottom - 2
        if ( !skip_container ) {
            let btop = abox.bottom + 2
            sects.style.height = `${bbot - btop}px`
        }
        for ( let i = 0; i < g_section_count; i++ ) {
            let sect = document.getElementById(`section_${i+1}`)
            if ( sect ) {
                sect.style.height = `${bbot - box.top - 2}px`
                sect.style.minHeight = `${bbot - box.top - 2}px`
            }
        }
    }
}




function section_select() {
    return g_current_section_select
}


function isElementInScrollView(container, element, partial) {

  const domRect1 = container.getBoundingClientRect();
  const domRect2 = element.getBoundingClientRect();

  return !(
    domRect1.top > domRect2.bottom ||
    domRect1.right < domRect2.left ||
    domRect1.bottom < domRect2.top ||
    domRect1.left > domRect2.right
  );
}

      //     l1, r1, l2, r2
function top_difference(rect_1, rect_2) {

    let b = rect_1.top - rect_2.top
  
    return b
}


function top_stray_amount(container,element) {

  const rect_1 = container.getBoundingClientRect();
  const rect_2 = element.getBoundingClientRect();

  return Math.abs(top_difference(rect_1, rect_2))

}


function scroller(evnt) {
    //
    if ( lastKnownScrollPosition === 0 ) {
        let element = evnt.target
        lastKnownScrollPosition = evnt.target.scrollTop;
    }
    //
}


function scrollender(evnt) {
    let current_scroll_pos = evnt.target.scrollTop;
    lastKnownScrollPosition = 0;

    let viz_list = {}
    for ( let i = 0; i < g_section_count; i++ ) {
        let checker = elementsToCheck[i]
        if ( checker && !(checker.checked) ) {
            let container = evnt.target
            let el = checker.el
            if ( isElementInScrollView(container,el) ) {
                checker.checked = true
            }
        }
        if ( checker && checker.checked) {
            let container = evnt.target
            let el = checker.el
            viz_list[checker.name] = top_stray_amount(container,el)
        }
    }
    //
    //  
    //console.log(viz_list)
    let least_strayed = Infinity
    let least_strayed_name = ""
    for ( let [name,stray] of Object.entries(viz_list) ) {
        if ( least_strayed > stray ) {
            least_strayed = stray
            least_strayed_name = name
        }
    }


    scroll_pin(least_strayed_name)

    //
    for ( let i = 0; i < g_section_count; i++ ) {
        let checker = elementsToCheck[i]
        checker.checked = false
    }

}


function init_els_to_check() {
    for ( let i = 0; i < g_section_count; i++ ) {
        let check_record = {
            "name" : `section_${i+1}`,
            "checked" : false,
            "el" : document.getElementById(`section_${i+1}`)
        }
        elementsToCheck.push(check_record);
    }
}
 

function setup_section_toggles() {
    let sect_togs = document.getElementsByClassName("togglebar-sect")
    for ( let st of sect_togs ) {
        let namer = st.parentNode.parentNode.id
        st.onclick = (ev) => {
            let sect_box = `#${namer}_response`
            if ( g_current_section_select === sect_box ) {
                let sbr = document.querySelector(sect_box)
                if ( sbr.style.display === "none") {
                    pinBox(sect_box)
                } else {
                    sbr.style.display = "none"
                }
            }
        }
    }
}

