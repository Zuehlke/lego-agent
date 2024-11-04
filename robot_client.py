import sys
import threading
import time
import xmlrpc.client

from robot_common import Device


_METHOD_DEPENDENCIES: dict[str, tuple[Device, ...]] = {}


def _depends_on(*devices: Device):
    def wrapper(method):
        _METHOD_DEPENDENCIES[method.__name__] = devices
        return method
    return wrapper


class RobotClient:

    def __init__(self, ip_address: str):
        self._server = xmlrpc.client.ServerProxy(f'http://{ip_address}:8000', allow_none=True)
        try:
            self._server.init()
        except ConnectionRefusedError:
            print("Could not connect to robot! Is the server running? Is the IP address correct?")
            sys.exit()  # not nice, but results in user-friendly error message

        devices = self._server.get_device_list()
        self._devices = [Device(d) for d in devices]
        print(f"Connected to robot! Devices: {', '.join(d.value for d in self._devices)}")

        self._motor_speeds = (0, 0)
        motor_watchdog = threading.Thread(target=self._motor_watchdog)
        motor_watchdog.daemon = True
        motor_watchdog.start()

    def get_methods(self) -> list[str]:
        methods = []
        for method, dependencies in _METHOD_DEPENDENCIES.items():
            if all(d in self._devices for d in dependencies):
                methods.append(method)
        return methods

    def get_devices(self) -> list[Device]:
        return self._devices

    @_depends_on(Device.LIGHTS)
    def set_lights(self, left_color: str, right_color: str) -> None:
        """{
            "description": "Set the color of the left and right light (or turn it off by setting it to BLACK).",
            "parameters": {
                "type": "object",
                "properties": {
                    "left_color": {
                        "type": "string",
                        "description": "Color of left light.",
                        "enum": ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
                    },
                    "right_color": {
                        "type": "string",
                        "description": "Color of right light.",
                        "enum": ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
                    }
                }
            }
        }"""
        return self._server.set_lights(left_color, right_color)

    @_depends_on(Device.MOTORS)
    def set_motors(self, left_speed: int, right_speed: int) -> None:
        """{
            "description": "Set the speed of the left and right motor (or turn it off by setting it to 0).",
            "parameters": {
                "type": "object",
                "properties": {
                    "left_speed": {
                        "type": "integer",
                        "description": "Speed of left motor, from -100 (full backwards) to 100 (full forwards)."
                    },
                    "right_speed": {
                        "type": "integer",
                        "description": "Speed of right motor, from -100 (full backwards) to 100 (full forwards)."
                    }
                }
            }
        }"""
        self._motor_speeds = (left_speed, right_speed)
        self._server.set_motors(left_speed, right_speed)

    @_depends_on(Device.SPEAKER)
    def speak(self, text: str) -> None:
        """{
            "description": "Speak a text via the speaker of the robot.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "Text to speak."
                    }
                }
            }
        }"""
        return self._server.speak(text)

    @_depends_on(Device.BUTTON)
    def get_button(self) -> bool:
        """{
            "description": "Get the value of the touch sensor, whether it's pressed or not.",
            "parameters": {}
        }"""
        return self._server.get_button()

    @_depends_on(Device.BUTTON)
    def wait_button_pressed(self) -> None:
        """{
            "description": "Function which blocks until the touch sensor is pressed.",
            "parameters": {}
        }"""
        while not self._server.wait_button_pressed():
            pass

    @_depends_on(Device.BUTTON)
    def wait_button_released(self) -> None:
        """{
            "description": "Function which blocks until the touch sensor is released.",
            "parameters": {}
        }"""
        while not self._server.wait_button_released():
            pass

    @_depends_on(Device.COLOR)
    def get_color(self) -> str:
        """{
            "description": "Get the color which is detected by the color sensor.",
            "parameters": {}
        }"""
        return self._server.get_color()

    @_depends_on(Device.DISTANCE)
    def get_distance(self) -> int:
        """{
            "description": "Get the distance which is detected by the distance sensor, value in centimeters.",
            "parameters": {}
        }"""
        return self._server.get_distance()

    def _motor_watchdog(self):
        while True:
            if self._motor_speeds != (0, 0):
                print('Setting motor speed')
                self._server.set_motors(self._motor_speeds[0], self._motor_speeds[1])
            time.sleep(2)
