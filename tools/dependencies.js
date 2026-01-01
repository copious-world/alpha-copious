const Walker = require('node-source-walk');


const fs = require('fs')


let previous_types_analyzed = {
  ArrayExpression: 32,
  ArrowFunctionExpression: 69,
  AssignmentExpression: 102,
  AwaitExpression: 63,
  BinaryExpression: 55,
  BlockStatement: 272,
  BooleanLiteral: 135,
  BreakStatement: 1,
  CallExpression: 311,
  CatchClause: 18,
  ClassBody: 2,
  ClassDeclaration: 2,
  ClassMethod: 46,
  CommentBlock: 78,
  CommentLine: 873,
  ConditionalExpression: 4,
  ExpressionStatement: 237,
  File: 3,
  ForInStatement: 2,
  ForOfStatement: 1,
  FunctionDeclaration: 33,
  Identifier: 2079,
  IfStatement: 120,
  LogicalExpression: 17,
  MemberExpression: 554,
  NewExpression: 29,
  NullLiteral: 15,
  NumericLiteral: 25,
  ObjectExpression: 46,
  ObjectProperty: 89,
  Program: 3,
  ReturnStatement: 131,
  StringLiteral: 192,
  Super: 1,
  SwitchCase: 6,
  SwitchStatement: 2,
  TemplateElement: 18,
  TemplateLiteral: 9,
  ThisExpression: 163,
  TryStatement: 18,
  UnaryExpression: 62,
  VariableDeclaration: 260,
  VariableDeclarator: 260
}



function append_object_dots(the_obj,the_path) {
    if ( !the_obj ) return ""
    if ( the_path === undefined ) the_path = ""
    let object_path = ""
    if ( the_obj && the_obj.name === undefined ) {
        if ( the_obj.property && the_obj.property.name ) {
            the_path = "." + the_obj.property.name + the_path
            return append_object_dots(the_obj.object,the_path)
        }
    } else {
        object_path = the_obj.name + the_path
    }
    return object_path
}



class OneFileDependencies {

    constructor(target_file) {
        //
        this.all_funcs = {}
        this.all_calls = {}
        this.last_func_def = false
        this.last_func_def_type = "function"
        this.all_class_defs = {}
        //
        this.target_file = target_file
        this.src = fs.readFileSync(this.target_file).toString()
        //
        this._noisy = false
        //
    }

    //
    noisy_output(...args) {
        if ( this._noisy ) {
            console.log(...args)
        }
    }

    //
    noisy_object_output(obj) {
        if ( this._noisy ) {
            console.dir(obj)
        }
    }
    
    set_noisy(tf) {
        this._noisy = tf ? true : false
    }

    async analyze_target_file() {
        let src_lines = this.src.split("\n")
        //
        let walker = new Walker();
        //
        walker.walk(this.src, node => {
            if (node.type !== undefined) {
                if ( node.type === "ClassDeclaration" ) {
                    //console.dir(node)
                    let extender = node.superClass
                    if ( extender ) {
                        extender = extender.name
                    } else extender = ""
                    this.noisy_output("ClassDeclaration",node.id.name,extender)
                    this.all_class_defs[node.id.name] = {
                        "is_subclass" : (extender.length > 0),
                        "depends_on" : ((extender.length > 0) ? {
                                                                    "class" : extender,
                                                                    "file" : "unknown"
                                                                } : "<base>"),
                        "file" : this.target_file
                    }
                } else {
                    switch ( node.type ) {
                        case "CallExpression" : {
                            //
                            //
                            let the_one_who_calls = this.last_func_def ? this.last_func_def : ""
                            let the_parent = node.parent
                            if ( Array.isArray(node.parent) ) {
                                the_parent = node
                            }
                            //
            //console.dir(node,{depth:3})
                            //
                            if ( this.last_func_def_type === "function" ) {
                                if ( typeof the_parent === "object"  && !(Array.isArray(the_parent))) {
                                    walker.moonwalk(the_parent,anode => {
                                        let a_line = parseInt(anode.loc.start.line)
                                        while ( a_line > 0 ) {
                                            a_line--
                                            let checker = src_lines[a_line]
                                            if ( checker.indexOf("function") >= 0 ) {
                                                let calling_def = checker.substring(checker.indexOf("function") + "function".length + 1,checker.indexOf("("))
                                                calling_def = calling_def.trim()
                                                the_one_who_calls = calling_def
                                                break
                                            }
                                        }
                                    })
                                } else {
                                    this.noisy_output("node.parent",node.parent)
                                }
                            }  
                            let call_ky = ""
                            let field_path = false
                            if ( node.callee ) {
                                if ( node.callee.name ) {
                                    call_ky = node.callee.name
                                    this.noisy_output("CallExpression:",node.callee.name)
                                } else if ( node.callee.object ) {
                                    if ( node.callee.object.name ) {
                                        call_ky = node.callee.object.name
                                        this.noisy_output("CallExpression:", node.callee.object.name, node.callee.property.name)                        
                                    } else {
                                        let object_path = append_object_dots(node.callee.object)
                                        call_ky = node.callee.property.name
                                        field_path = object_path
                                        this.noisy_output("CallExpression:", object_path, node.callee.property.name)                        
                                    }
                                }
                            } else {
                                this.noisy_object_output(node)
                            }

                            if ( call_ky && call_ky.length ) {
                                //
                                let call_def = this.all_calls[call_ky]
                                if ( call_def === undefined ) {
                                    call_def = {}
                                    this.all_calls[call_ky] = call_def
                                }
                                //
                                if ( typeof the_one_who_calls === "string" && the_one_who_calls.length ) {
                                    if ( typeof call_def.callers !== "object" ) {
                                        call_def.callers = {}
                                    }
                                    if ( typeof call_def.callers[the_one_who_calls] !== "object" ) {
                                        call_def.callers[the_one_who_calls] = {
                                            "def_file" : "unknown",
                                            "use_count" : 1,
                                            "o_path" : field_path
                                        }
                                    } else {
                                        call_def.callers[the_one_who_calls].use_count++
                                    }
                                    
                                    this.noisy_output(`\tcalled by ${the_one_who_calls}`)
                                }
                                //
                            }

                            break;
                        }
                        case "ClassMethod" : {
                            this.noisy_output("!! ClassMethod:",node.key.name)
                            this.all_funcs[node.key.name] = {
                                "depends_on" : {},
                                "file" : this.target_file,
                                "is_method" : true
                            }
                            this.last_func_def = node.key.name
                            this.last_func_def_type = "method"
                            break;
                        }
                        case "FunctionDeclaration" : {
                            this.noisy_output("!! FunctionDeclaration:",node.id.name)
                            this.all_funcs[node.id.name] = {
                                "depends_on" : {},
                                "file" : this.target_file,
                                "is_method" : false
                            }
                            this.last_func_def = node.id.name
                            this.last_func_def_type = "function"
                            break;
                        }
                        case "ArrowFunctionExpression" : {
                            break;
                        }
                    }
                }
            }
        });
    }


    /**
     * 
     */
    collect_dependencies() {
        //
        for ( let func in this.all_funcs ) {
            let fdef = this.all_funcs[func]
            for ( let [cky,callers] of Object.entries(this.all_calls) ) {
                if ( callers.callers !== undefined ) {
                    callers = callers.callers
                    if ( func in callers ) {
                        fdef.depends_on[cky] = callers[func].use_count
                    }
                } else {
                    callers.callers = { "_info" : "NO CALLERS" }
                }
            }
        }
        //
    }

    ascertain_file_ast_types() {
        //
        let all_types = Object.assign({},previous_types_analyzed)
        let walker = new Walker();
        //
        walker.walk(this.src, node => {
            if (node.type !== undefined) {
                all_types[node.type] = all_types[node.type] ? all_types[node.type] + 1 : 1
            }
        })
        //
        //console.log()
        let sorted_kys = Object.keys(all_types).sort()
        let sorted_all_types = {}

        for ( let ky of sorted_kys ) {
            sorted_all_types[ky] = all_types[ky]
        }
        //
        this.noisy_object_output(sorted_all_types)
    }


    print_results() {

        // ALL FUNCTIONS
        console.dir(this.all_funcs)

        // ALL CALLS
        console.dir(this.all_calls,{depth:5})

        // ALL CLASS DEFS
        console.dir(this.all_class_defs,{depth:5})

    }

}





let g_map_of_files = {}


function find_file_defining(callky) {
console.log(callky)
    for ( let [fname,file_def] of Object.entries(g_map_of_files) ) {
        let possible_calldefs = file_def.keys
        if ( possible_calldefs.includes(callky) ) return fname
    }
    return false
}



//let g_target_file = "client/crypto-wraps.js"
//let g_target_file = "client/user_db.js"
//let g_target_file = "client/one_table_db.js"



async function main()  {
    //
    let file_analysis = []
    let fa = false

    let flist = fs.readdirSync("client")

    let files = flist.map((a_file) => {
        return `client/${a_file}`
    })
    console.log(files)

    for (let file of files ) {
        console.log(`analysizing:: ${file}`)
        let fa = new OneFileDependencies(file)
        file_analysis.push(fa)
        await fa.analyze_target_file()
        g_map_of_files[file] = { "info" : fa, "keys" : Object.keys(fa.all_funcs) }
    }

    for ( let i = 0; i < file_analysis.length; i++ ) {
        fa = file_analysis[i]
        fa.collect_dependencies()
        console.log(`reporting on file: ${fa.target_file}--------------------------`)
        console.log(g_map_of_files[fa.target_file].keys)
        // fa.print_results()
        // console.log("\n======\n")
    }


    for ( let i = 0; i < file_analysis.length; i++ ) {
        fa = file_analysis[i]
        console.log(`reporting on file: ${fa.target_file}--------------------------`)
        console.log(g_map_of_files[fa.target_file].keys)
        g_map_of_files[fa.target_file].keys.forEach((fky) => {
            console.log('\t',fky)
            console.dir(fa.all_funcs[fky].depends_on)
            for ( let [callky,v] of Object.entries(fa.all_funcs[fky].depends_on) ) {
                if ( v !== undefined ) {
                    let file_of_calldef = find_file_defining(callky)
                    if ( file_of_calldef ) {
                        if ( file_of_calldef === fa.target_file ) {
                            file_of_calldef = "@SELF"
                        }
                        fa.all_funcs[fky].depends_on[callky] = file_of_calldef
                    }
                }
            }
            console.dir(fa.all_funcs[fky].depends_on)
        })
        
        // fa.print_results()
        // console.log("\n======\n")
    }


    // for ( let file_data of Object.values(g_map_of_files) ) {
    //     console.log(file_data.target_file)
    // }

}


 main()

