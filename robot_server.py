import threading
import time
from typing import List

from ev3dev2 import DeviceNotFound
from ev3dev2.led import Leds
from ev3dev2.motor import MoveTank, OUTPUT_A, OUTPUT_D, SpeedPercent
from ev3dev2.sound import Sound
from ev3dev2.sensor import INPUT_1, INPUT_3, INPUT_4
from ev3dev2.sensor.lego import TouchSensor, ColorSensor, InfraredSensor

from robot_common import Device

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


class RobotServer:
    def __init__(self):
        self.init()
        self._watchdog_enabled = False
        self._watchdog_cnt = 0
        motor_watchdog = threading.Thread(target=self._motor_watchdog)
        motor_watchdog.daemon = True
        motor_watchdog.start()

    def _try_init_device(self, constructor, device_name):
        device = None
        try:
            device = constructor()
            self._devices.append(device_name)
        except DeviceNotFound:
            pass
        return device

    def init(self):
        self._devices = []
        self._leds = self._try_init_device(lambda: Leds(), Device.LIGHTS)
        self._tank_drive = self._try_init_device(lambda: MoveTank(OUTPUT_A, OUTPUT_D), Device.MOTORS)
        self._sound = self._try_init_device(lambda: Sound(), Device.SPEAKER)
        self._touch_sensor = self._try_init_device(lambda: TouchSensor(INPUT_1), Device.BUTTON)
        self._color_sensor = self._try_init_device(lambda: ColorSensor(INPUT_3), Device.COLOR)
        self._ultrasonic_sensor = self._try_init_device(lambda: InfraredSensor(INPUT_4), Device.DISTANCE)

        if Device.MOTORS in self._devices:
            self._stop_motors()
        if Device.LIGHTS in self._devices:
            self.set_lights('BLACK', 'BLACK')

    def get_device_list(self) -> List[str]:
        return [d.value for d in self._devices]

    def set_lights(self, left_color: str, right_color: str) -> None:
        if self._leds is None:
            raise IOError('Lights not connected')
        self._leds.set_color("LEFT", left_color)
        self._leds.set_color("RIGHT", right_color)

    def set_motors(self, left_speed: int, right_speed: int) -> None:
        if self._tank_drive is None:
            raise IOError('Motors not connected')
        self._watchdog_cnt = 0
        self._watchdog_enabled = True
        self._tank_drive.on(SpeedPercent(-left_speed), SpeedPercent(-right_speed))  # invert due to caterpillar tracks

    def speak(self, text: str) -> None:
        if self._sound is None:
            raise IOError('Speaker is not connected')
        text_cleaned = text[:200].encode('ascii', errors='ignore').decode('ascii')
        self._sound.speak(text_cleaned)

    def get_button(self) -> bool:
        if self._touch_sensor is None:
            raise IOError('Button is not connected')
        return self._touch_sensor.is_pressed

    def wait_button_pressed(self) -> bool:
        for _ in range(20):
            if self.get_button():
                return True
            time.sleep(0.1)
        return False

    def wait_button_released(self) -> bool:
        for _ in range(20):
            if not self.get_button():
                return True
            time.sleep(0.1)
        return False

    def get_color(self) -> str:
        if self._color_sensor is None:
            raise IOError('Color sensor is not connected')
        return COLOR_MAP[self._color_sensor.color]

    def get_distance(self) -> int:
        if self._ultrasonic_sensor is None:
            raise IOError('Distance sensor is not connected')
        return int(self._ultrasonic_sensor.proximity * 0.7)

    def _stop_motors(self) -> None:
        self.set_motors(0, 0)

    def _motor_watchdog(self) -> None:
        while True:
            time.sleep(1)
            if self._watchdog_enabled:
                self._watchdog_cnt += 1
                if self._watchdog_cnt > 5:
                    self._stop_motors()
                    self._watchdog_enabled = False
