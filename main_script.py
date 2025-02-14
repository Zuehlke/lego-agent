import os
import time

from dotenv import load_dotenv

from robot_client import RobotClient


load_dotenv()
r = RobotClient(os.environ['ROBOT_IP'])


r.set_lights('GREEN', 'GREEN')
time.sleep(1)
r.set_lights('BLACK', 'BLACK')
