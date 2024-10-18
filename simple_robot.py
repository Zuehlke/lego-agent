import time

from ev3dev2.led import Leds
from ev3dev2.motor import MoveTank, OUTPUT_A, OUTPUT_B, SpeedPercent
from ev3dev2.sound import Sound
from ev3dev2.sensor import INPUT_1, INPUT_3, INPUT_4
from ev3dev2.sensor.lego import TouchSensor, ColorSensor, UltrasonicSensor


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


class SimpleRobot(object):
    def __init__(self):
        self.leds = Leds()
        self.tank_drive = MoveTank(OUTPUT_A, OUTPUT_B)
        self.sound = Sound()
        self.touch_sensor = TouchSensor(INPUT_1)
        self.color_sensor = ColorSensor(INPUT_3)
        self.ultrasonic_sensor = UltrasonicSensor(INPUT_4)

    def set_leds(self, left_color: str, right_color: str) -> None:
        """
            "description": "Set the color of a specific LED (or turn it off by setting it to BLACK)",
            "parameters": {
                "type": "object",
                "properties": {        # TODO
                    "position": {
                        "type": "string",
                        "description": "Which LED to change the color.",
                        "enum": ["LEFT", "RIGHT"]
                    },
                    "color": {
                        "type": "string",
                        "description": "Color to change the LED to.",
                        "enum": ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
                    }
                },
                "required": ["group", "color"]
            }
        """
        self.leds.set_color("LEFT", left_color)
        self.leds.set_color("RIGHT", right_color)

    def set_motors(self, left_speed: int, right_speed: int) -> None:
        self.tank_drive.on(SpeedPercent(left_speed), SpeedPercent(right_speed))

    def speak(self, text: str) -> None:
        self.sound.speak(text)

    def get_button(self) -> bool:
        return self.touch_sensor.is_pressed

    def wait_button_pressed(self) -> None:
        while not self.get_button():
            time.sleep(0.1)

    def wait_button_released(self) -> None:
        while self.get_button():
            time.sleep(0.1)

    def get_color(self) -> str:
        return COLOR_MAP[self.color_sensor.color]

    def get_distance(self) -> int:
        return int(self.ultrasonic_sensor.distance_centimeters)
