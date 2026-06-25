// Property value with block

Expression
  = SingleBlock / AttributeValueTemplate

SingleBlock = "{" pointer:Pointer "}" !. {return {pointer};}

AttributeValueTemplate =  (Block / NoBlock)* 
  
Block = "{" pointer:Pointer "}" {return {pointer};}

NoBlock = a:(OpenBrace / CloseBrace / [^{}])+ {return a.join("");}

OpenBrace = "\u005c\u007b" {return "\u007b";}

CloseBrace = "\u005c\u007d" {return "\u007d";}

Pointer = Absolute/ Relative / Root / Current

Root = "/"

Current = "."

Absolute = $("/" Relative)
  
Relative = $([^\/\.\{\}\[\]<>!=] [^\{\}\[\]<>!=]*)

