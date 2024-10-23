import time


COLOR_MAP = {
    0: "NO COLOR",
    1: "BLACK",
    2: "BLUE",
    3: "GREEN",
    4: "YELLOW",
    5: "RED",
    6: "WHITE",
    7: "BROWN"
}


class SimpleRobot:
    def __init__(self):
        self.init()

    def init(self):
        from ev3dev2.led import Leds
        from ev3dev2.motor import MoveTank, OUTPUT_A, OUTPUT_B
        from ev3dev2.sound import Sound
        from ev3dev2.sensor import INPUT_1, INPUT_3, INPUT_4
        from ev3dev2.sensor.lego import TouchSensor, ColorSensor, UltrasonicSensor

        self.leds = Leds()
        self.tank_drive = MoveTank(OUTPUT_A, OUTPUT_B)
        self.sound = Sound()
        self.touch_sensor = TouchSensor(INPUT_1)
        self.color_sensor = ColorSensor(INPUT_3)
        self.ultrasonic_sensor = UltrasonicSensor(INPUT_4)

    def set_leds(self, left_color: str, right_color: str) -> None:
        """{
            "description": "Set the color of the left and right LED (or turn it off by setting it to BLACK).",
            "parameters": {
                "type": "object",
                "properties": {
                    "left_color": {
                        "type": "string",
                        "description": "Color of left LED.",
                        "enum": ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
                    },
                    "right_color": {
                        "type": "string",
                        "description": "Color of right LED.",
                        "enum": ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
                    }
                }
            }
        }"""
        self.leds.set_color("LEFT", left_color)
        self.leds.set_color("RIGHT", right_color)

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
        from ev3dev2.motor import SpeedPercent

        self.tank_drive.on(SpeedPercent(left_speed), SpeedPercent(right_speed))

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
        self.sound.speak(text)

    def get_button(self) -> bool:
        """{
            "description": "Get the value of the touch sensor, whether it's pressed or not.",
            "parameters": {}
        }"""
        return self.touch_sensor.is_pressed

    def wait_button_pressed(self) -> None:
        """{
            "description": "Function which blocks until the touch sensor is pressed.",
            "parameters": {}
        }"""
        while not self.get_button():
            time.sleep(0.1)

    def wait_button_released(self) -> None:
        """{
            "description": "Function which blocks until the touch sensor is released.",
            "parameters": {}
        }"""
        while self.get_button():
            time.sleep(0.1)

    def get_color(self) -> str:
        """{
            "description": "Get the color which is detected by the color sensor.",
            "parameters": {}
        }"""
        return COLOR_MAP[self.color_sensor.color]

    def get_distance(self) -> int:
        """{
            "description": "Get the distance which is detected by the distance sensor, value in centimeters.",
            "parameters": {}
        }"""
        return int(self.ultrasonic_sensor.distance_centimeters)
