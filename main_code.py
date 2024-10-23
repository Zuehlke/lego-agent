# WILLKOMMEN!

# DIESEN TEIL HIER SOLLTEST DU NICHT ÄNDERN
from time import sleep

from robot_client import RobotClient

r = RobotClient('192.168.1.168')

# FÜGE AB HIER DEINEN CODE EIN:

r.set_motors(20, 20)
sleep(1)
r.set_motors(0, 0)
