import threading
import time
from enum import Enum
from typing import List

from ev3dev2 import DeviceNotFound
from ev3dev2.led import Leds
from ev3dev2.motor import MoveTank, Motor, OUTPUT_A, OUTPUT_B, OUTPUT_C, SpeedPercent
from ev3dev2.sound import Sound
from ev3dev2.sensor import INPUT_1, INPUT_3, INPUT_4
from ev3dev2.sensor.lego import TouchSensor, ColorSensor, InfraredSensor


class Device(Enum):
    LIGHTS = 'Lights'
    MOTORS = 'Motors'
    HEAD = 'Head'
    SPEAKER = 'Speaker'
    DISTANCE = 'Distance'


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
        # Make sure these ports are in sync with the information in the README.
        self._devices = []
        self._leds = self._try_init_device(lambda: Leds(), Device.LIGHTS)
        self._tank_drive = self._try_init_device(lambda: MoveTank(OUTPUT_C, OUTPUT_B), Device.MOTORS)
        self._head = self._try_init_device(lambda: Motor(OUTPUT_A), Device.HEAD)
        self._sound = self._try_init_device(lambda: Sound(), Device.SPEAKER)
        self._ultrasonic_sensor = self._try_init_device(lambda: InfraredSensor(INPUT_4), Device.DISTANCE)

        if Device.MOTORS in self._devices:
            self._stop_motors()
        if Device.LIGHTS in self._devices:
            self.set_lights('BLACK', 'BLACK')

    def get_device_list(self) -> List[Device]:
        return self._devices

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

    def set_heads(self, position: int) -> None:
        if self._head is None:
            raise IOError('Head not connected')
        self._head.on_to_position(20, position)

    def speak(self, text: str) -> None:
        if self._sound is None:
            raise IOError('Speaker is not connected')
        text_cleaned = text[:200].encode('ascii', errors='ignore').decode('ascii')
        self._sound.speak(text_cleaned)

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
