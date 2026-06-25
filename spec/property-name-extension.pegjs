// Property name with block

Expression
  = head:Property tail:Block? {
      return Object.assign(head,tail || {pointer:".",filter:[]});
    }

Property = [^{]+ { return {property:text()};}
  
Block = "{" pointer:Pointer filter:Filter* "}" {return {pointer,filter};}

Pointer = Absolute/ Relative / Root / Current

Root = "/"

Current = "."

Absolute = $("/" Relative)
  
Relative = $([^\/\.\{\}\[\]<>!=] [^\{\}\[\]<>!=]*)

Filter = "[" condition:Condition "]" {return condition;}

Condition = Relation / NotExist / Exist
  
Exist = pointer:Relative {return {pointer,op:"Exist"};}

NotExist = "!" pointer:Relative {return {pointer,op:"NotExist"};}

Relation= pointer:Relative op:("<=" / ">=" / "<" / ">" / "!=" / "=") value:Literal {return {pointer,op,value};}
  
Literal "literal"
  = String / True / False / Number / Integer / Null

True "true"
  = "true" {return true;}

False "false"
  = "false" {return false;}

Null "null"
  = "null" {return null;}

String "string"
  = "'" a:([^']*) "'" {return a.join("");}

Integer "integer"
  = _ "-"? [0-9]+ { return parseInt(text(), 10); }
  
Number "number"
  = _ "-"? [0-9]+"."[0-9]+ { return parseFloat(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*
  
