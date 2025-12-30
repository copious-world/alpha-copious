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

let g_all_funcs = {}
let g_all_calls = {}

const walker = new Walker();

// Assume src is the string contents of myfile.js
// or the AST of an outside parse of myfile.js

let g_target_file = "client/crypto-wraps.js"

let src = fs.readFileSync(g_target_file).toString()

let src_lines = src.split("\n")

const g_callers = [ "FunctionDeclaration", "ClassMethod", "ArrowFunctionExpression" ]


let all_types = Object.assign({},previous_types_analyzed)
walker.walk(src, node => {
  if (node.type !== undefined) {
    // No need to keep traversing since we found what we wanted
    //console.log(node.type)
    //all_types[node.type] = all_types[node.type] ? all_types[node.type] + 1 : 1
    if ( node.type === "ClassDeclaration" ) {
        console.dir(node)
    } else {
        switch ( node.type ) {
            case "CallExpression" : {
                let the_one_who_calls = ""
                walker.moonwalk(node.parent,anode => {
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
                let call_ky = ""
                let field_path = false
                if ( node.callee ) {
                    if ( node.callee.name ) {
                        call_ky = node.callee.name
                        console.log("CallExpression:",node.callee.name)
                    } else if ( node.callee.object ) {
                        if ( node.callee.object.name ) {
                            call_ky = node.callee.object.name
                            console.log("CallExpression:", node.callee.object.name, node.callee.property.name)                        
                        } else {
                            let object_path = append_object_dots(node.callee.object)
                            call_ky = node.callee.property.name
                            field_path = object_path
                            console.log("CallExpression:", object_path, node.callee.property.name)                        
                        }
                    }
                } else {
                    console.dir(node)
                }

                if ( call_ky && call_ky.length ) {
                    //
                    let call_def = g_all_calls[call_ky]
                    if ( call_def === undefined ) {
                        call_def = {}
                        g_all_calls[call_ky] = call_def
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
                        
                        console.log(`\tcalled by ${the_one_who_calls}`)
                    }
                    //
                }

                break;
            }
            case "ClassMethod" : {
                break;
            }
            case "FunctionDeclaration" : {
                console.log("!! FunctionDeclaration:",node.id.name)
                g_all_funcs[node.id.name] = {
                    "depends_on" : {},
                    "file" : g_target_file
                }
                break;
            }
            case "ArrowFunctionExpression" : {
                break;
            }
        }
    }
  }
});


//console.log()
let sorted_kys = Object.keys(all_types).sort()
let sorted_all_types = {}

for ( let ky of sorted_kys ) {
    sorted_all_types[ky] = all_types[ky]
}

//console.dir(sorted_all_types)


for ( let func in g_all_funcs ) {
    let fdef = g_all_funcs[func]
    for ( let [cky,callers] of Object.entries(g_all_calls) ) {
        callers = callers.callers
        if ( func in callers ) {
            fdef.depends_on[cky] = callers[func].use_count
        }
    }
}


// ALL FUNCTIONS
console.dir(g_all_funcs)

// ALL CALLS
console.dir(g_all_calls,{depth:5})
