
window.all_windows = false

//  ------------------   dragging


let draggers = {}
let current_dragger = false


function add_dragging() {

    let drag_bars = document.getElementsByClassName("togglebar")
    for ( let db of drag_bars ) {

        let cname = db.parentNode.className
        if ( cname.indexOf(' ') > 0 ) {
            cname = cname.split(' ')[0]
        }

        if ( cname === 'solid_able' ) {
            if ( db.parentNode.id === "intergalactic-explain" ) {
                cname = "fade_able"
            }
        }

        if ( ["fade_able","right_fade_able"].indexOf(cname) >= 0 ) {
            let drag_Node = db.parentNode
            draggers[drag_Node.id] = {
                "offsetX" : 0,
                "offsetY" : 0,
                "isDragging" : false,
                "dragged" : drag_Node,
                "drag_control" : db
            }

            db.onmousedown = (e) => {
                let drag_Node = e.target.parentNode;
                if ( !draggers[drag_Node.id] ) return
                e.preventDefault()
                draggers[drag_Node.id].isDragging = true;
                // Calculate the offset between the mouse position and the div's top-left corner
                draggers[drag_Node.id].offsetX = e.clientX - drag_Node.getBoundingClientRect().left;
                draggers[drag_Node.id].offsetY = e.clientY - drag_Node.getBoundingClientRect().top;
                db.style.cursor = 'grabbing';
                current_dragger = drag_Node.id
            }

            db.onmouseup = (ev) => {
                if ( current_dragger ) {
                    let dragger_stats = draggers[current_dragger]
                    let drag_bar = dragger_stats.drag_control
                    drag_bar.style.cursor = 'move';
                }
            }
        }
    }

    document.addEventListener('mousemove', (e) => {
        if (!current_dragger) return;

        if ( current_dragger ) {
            let dragger_stats = draggers[current_dragger]
            let drag_Node = dragger_stats.dragged
            // Calculate new position based on mouse movement and offsetif 
            if ( drag_Node ) {
                const newX = e.clientX - dragger_stats.offsetX;
                const newY = e.clientY - dragger_stats.offsetY;

                drag_Node.style.left = `${newX}px`;
                drag_Node.style.top = `${newY}px`;
            }
        }

    });

    document.addEventListener('mouseup', () => {
        if ( current_dragger ) {
            let dragger_stats = draggers[current_dragger]
            let drag_bar = dragger_stats.drag_control
            drag_bar.style.cursor = 'move';
        }
        current_dragger = false
    });

}
add_dragging()


//  ------------------   resizing


let resizers = {}
let current_resizer = false


function add_resizing() {
    let sizer_bobs = document.getElementsByClassName("sizerbar")
    for ( let sb of sizer_bobs ) {
        let pnode = sb.parentNode

        resizers[pnode.id] = {
            "isDragging" : false,
            "dragged" : pnode,
            "drag_control" : sb
        }

        sb.onmousedown = (e) => {
            let pnode = e.target.parentNode;
            if ( !resizers[pnode.id] ) return
            e.preventDefault()
            resizers[pnode.id].isDragging = true;
            current_resizer = pnode.id
        }
  
    }


    document.addEventListener('mousemove', (e) => {
        if (!current_resizer) return;

        if ( current_resizer ) {
            let resizer_stats = resizers[current_resizer]
            let pnode = resizer_stats.dragged
            // Calculate new position based on mouse movement and offsetif 
            if ( pnode ) {
                const newX = e.clientX;
                const newY = e.clientY;
                //
                let brect = pnode.getBoundingClientRect()
                let newW = newX - brect.left
                let newH = newY - brect.top
                //
                if ( newW > 60 ) {
                    pnode.style.width = `${newW}px`;
                }
                if ( newH > 60 ) {
                    pnode.style.height = `${newH}px`;
                }
            }
        }

    });


    document.addEventListener('mouseup', () => {
        current_resizer = false
    });

}

add_resizing() 



function init_app_resize() {
    //
    window.addEventListener('resize',(ev) => {
        // container it
        let it_container = document.getElementById('sections-container')
        if ( it_container ) {
            let footer = document.getElementsByTagName('footer')[0]
            if ( footer ) {
                let ic_rect = it_container.getBoundingClientRect()
                let ft_rect = footer.getBoundingClientRect()
                let h = ft_rect.top - ic_rect.top - 1;
                it_container.style.height = `${h}px`
                it_container.style.minHeight= `${h}px`
                //
                // let flw = document.getElementById("sections-flc")
                // if ( flw ) {
                //     flw.style.height = `${h}px`
                //     flw.style.minHeight= `${h}px`
                // }
                //
                for ( let i = 0; i < g_section_count; i++ ) {
                    let sect = document.getElementById(`section_${i+1}`)
                    if ( sect ) {
                        sect.style.height = `${h - 2}px`
                        sect.style.minHeight = `${h - 2}px`
                    }
                }
            }
        }
        //
        for ( let wbox_id in all_windows ) {
            let wbox = all_windows[wbox_id]
            if ( !wbox ) continue;
            let w = window.innerWidth*0.8;
            let x = window.innerWidth*0.3;
            if ( wbox.x >= (window.innerWidth-20) ) {
                wbox.move(x)
            }
            if ( wbox.y >= (window.innerHeight-20) ) {
                wbox.move(wbox.y - 60)
            }
            let h = window.innerHeight*0.96
            wbox.resize(w,h)
        }
        //
        for ( let dinfo of Object.values(draggers) ) {
            let dragged = dinfo.dragged
            if ( dragged ) {
                //
                let drect = dragged.getBoundingClientRect()
                //
                let x = window.innerWidth*0.3;
                let h = window.innerHeight*0.8
                let w = window.innerWidth*0.9;
                //
                if ( drect.x >= (window.innerWidth-20) ) {
                    dragged.style.left = `${x}px`
                }
                if ( drect.y >= (window.innerHeight-20) ) {
                    dragged.style.top = `{drect.y - 60}px`
                }
                w = Math.min(450,w)
                h = Math.min(450,h)
                dragged.style.width = `${w}px`
                dragged.style.height = `${h}px`
            }
        }
    })
    //
}



function init_app_windows() {

    let left = "30%",
        height = "96%",
        width = "60%"
    //
    let ref_el = document.getElementById("sections-container")
    if ( ref_el ) {
        if ( window.innerWidth >= 1100 ) {
            let rbox = ref_el.getBoundingClientRect()
            let l = rbox.right + 6
            left = `${rbox.right}px`
            let r = window.innerWidth - 20;
            let w = r - l
            width = `${w}px`
        } else {
            let rbox = ref_el.getBoundingClientRect()
            let l = rbox.left + 6
            left = `${l}px`
            width = `${window.innerWidth}px`
        }
    }
    //
    let winbox = new WinBox("extra-file-class",{
        "url" : "http://localhost/doc/extra-file-class",
        "x" : left,
        "height" : height,
        "width" : width,
        "hidden" : true,
        "onclose" : () => {
            let winbox = all_windows["extra-file-class"]
            winbox.hide(true)
            return true
        }
    })
    //
    all_windows["extra-file-class"] = winbox
    //
    winbox = new WinBox("roll-right",{
        "url" : "http://localhost/doc/index.html",
        "x" : left,
        "height" : height,
        "width" : width,
        "hidden" : true,
        "onclose" : () => {
            let winbox = all_windows["roll-right"]
            winbox.hide(true)
            return true
        }
    })
    all_windows["roll-right"] = winbox
    //
    //
    winbox = new WinBox("release-lite",{
        "url" : "http://localhost/doc/index.html",
        "x" : left,
        "height" : height,
        "width" : width,
        "hidden" : true,
        "onclose" : () => {
            let winbox = all_windows["release-lite"]
            winbox.hide(true)
            return true
        }
    })
    all_windows["release-lite"] = winbox
    //
    init_app_resize()

}
//
