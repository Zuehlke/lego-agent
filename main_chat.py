import inspect
import json
import openai

from config import ROBOT_IP
from robot_client import RobotClient


def get_tool_args(fn_name):
    fn = getattr(RobotClient, fn_name)
    return [a for a in inspect.signature(fn).parameters if a != 'self']


def get_tool_desc(robot: RobotClient):
    tools = []
    for fn_name in robot.get_methods():
        doc = getattr(RobotClient, fn_name).__doc__
        tool = {
            'type': 'function',
            'function': {
                'name': fn_name,
                **json.loads(doc)
            }
        }
        args = get_tool_args(fn_name)
        if len(args) > 0:
            tool['function']['parameters']['required'] = args
        tools.append(tool)
    return tools


def main():
    robot = RobotClient(ROBOT_IP)
    tool_desc = get_tool_desc(robot)

    history = [{
        "role": "system",
        "content": "You control a lego robot by calling different functions that execute commands on the robot"
    }]

    while True:
        user_msg = input('>>> ')
        if user_msg == 'exit':
            break

        history.append({"role": "user", "content": user_msg})

        while True:
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=history,
                tools=tool_desc,
            )
            response_message = response.choices[0].message
            history.append(response_message)

            if response_message.content:
                print(response_message.content)

            tool_calls = response_message.tool_calls
            if tool_calls is not None:
                for tool_call in tool_calls:
                    fn_name = tool_call.function.name
                    fn_args = json.loads(tool_call.function.arguments)
                    fn_args_positional = [fn_args[a] for a in get_tool_args(fn_name)]
                    print(f'    {fn_name}({fn_args_positional if len(fn_args_positional) > 0 else ""})', end='')
                    response = getattr(robot, fn_name)(*fn_args_positional)
                    print(f' -> {str(response)}')
                    history.append({
                        "role": "tool",
                        "content": str(response),
                        "tool_call_id": tool_call.id
                    })
            else:
                break


if __name__ == '__main__':
    main()
