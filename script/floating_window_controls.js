
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


