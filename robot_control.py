import json
from openai import OpenAI
from dotenv import load_dotenv
from helpers import list_functions_with_docs, tools_from_docstr
from simple_robot import SimpleRobot
import xmlrpc.client
import inspect

load_dotenv()

class RobotControl(object):

    def __init__(self, server_name='http://192.168.178.145:8000'):
        
        # Load config values
        with open(r"config.json") as config_file:
            config_details = json.load(config_file)

        self.client = OpenAI()

        self.model_name = config_details["MODEL_NAME"]

        self.robot = SimpleRobot()

        self.robot_functions = list_functions_with_docs(self.robot)
        self.tools = tools_from_docstr(self.robot_functions)

        self.xmlrpc_server = xmlrpc.client.ServerProxy(server_name, allow_none=True)

        self.available_functions = {}
        for fun_name, _ in self.robot_functions:
            self.available_functions[fun_name] = getattr(self.xmlrpc_server, fun_name)
    
    def send_command(self, command):
        messages = [{"role": "system", "content": "You control a legon mindstorms robot with evdev3 by calling different functions that execute commands on the robot"},
                    {"role": "user", "content": command}]

        # Call the model with the user query (messages) and the functions defined in the functions parameter
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            tools=self.tools,
            tool_choice="auto",
        )

        chosen_fn_name = response.choices[0].message.tool_calls[0].function.name
        function_args = json.loads(response.choices[0].message.tool_calls[0].function.arguments)

        args = []
        for arg in list(inspect.signature(getattr(self.robot, chosen_fn_name)).parameters):
            if arg in function_args.keys():
                args += [function_args[arg]]

        self.available_functions[chosen_fn_name](*args)