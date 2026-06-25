// Property value with block

Expression
  = SingleBlock / AttributeValueTemplate

SingleBlock = "{" pointer:Pointer "}" !. {return {pointer};}

AttributeValueTemplate =  (Block / NoBlock)* 
  
Block = "{" pointer:Pointer "}" {return {pointer};}

NoBlock = $([^\{\}]+)

Pointer = Absolute/ Relative / Root / Current

Root = "/"

Current = "."

Absolute = $("/" Relative)
  
Relative = $([^\/\.\{\}\[\]<>!=] [^\{\}\[\]<>!=]*)

