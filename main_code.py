# WILLKOMMEN!

# DIESEN TEIL HIER SOLLTEST DU NICHT ÄNDERN
import os
from time import sleep

from robot_client import RobotClient
from robot_common import Device

robot_ip = os.environ['ROBOT_IP']
r = RobotClient(robot_ip)

# FÜGE AB HIER DEINEN CODE EIN:
devices = r.get_devices()

if Device.LIGHTS in devices:
    print('Test lights')
    for _ in range(3):
        r.set_lights('RED', 'GREEN')
        sleep(0.5)
        r.set_lights('GREEN', 'RED')
        sleep(0.5)
    r.set_lights('BLACK', 'BLACK')
else:
    print('Skip lights test')

if Device.SPEAKER in devices:
    print('Test speaker')
    r.speak('Hello World')
else:
    print('Skip speaker test')

if Device.MOTORS in devices:
    print('Test motors')
    r.set_motors(50, 0)
    sleep(2)
    r.set_motors(0, -50)
    sleep(2)
    r.set_motors(0, 0)
else:
    print('Skip motors test')

if Device.BUTTON in devices:
    print('Test button')
    for _ in range(30):
        print(f'  Button state: {r.get_button()}')
        sleep(0.1)
else:
    print('Skip button test')

if Device.COLOR in devices:
    print('Test color')
    for _ in range(30):
        print(f'  Detected color: {r.get_color()}')
        sleep(0.1)
else:
    print('Skip color test')

if Device.DISTANCE in devices:
    print('Test distance')
    for _ in range(30):
        print(f'  Measured distance: {r.get_distance()}')
        sleep(0.1)
else:
    print('Skip distance test')

print('Done')
