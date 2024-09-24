import ast
import re


def list_functions_with_docs(obj):
    return [(attr, getattr(obj, attr).__doc__) for attr in dir(obj) if callable(getattr(obj, attr)) and not attr.startswith("__")]


def string_to_dict(s):
    s = s.strip()
    s = '{' + s + '}'
    
    # Replace single quotes with double quotes for JSON compatibility
    s = re.sub(r"'", '"', s)
    
    # Replace Python-style True/False with JSON-style true/false
    s = s.replace('True', 'true').replace('False', 'false')
    
    try:
        # Use ast.literal_eval to safely evaluate the string
        return ast.literal_eval(s)
    except (SyntaxError, ValueError) as e:
        print(f"Error parsing string: {e}")
        return None
    
def tools_from_docstr(robot_functions):
    tools = []
    for fun_name, docstr in robot_functions:
        fun_desc = {}
        if docstr:
            fun_desc = string_to_dict(docstr)
        tools += [{
                    "type": "function",
                    "function": {
                        "name": fun_name
                    }
                }]
        tools[-1]["function"].update(fun_desc)
    return(tools)