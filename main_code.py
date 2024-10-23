# WILLKOMMEN!

# DIESEN TEIL HIER SOLLTEST DU NICHT ÄNDERN
from time import sleep
import xmlrpc.client

s = xmlrpc.client.ServerProxy('http://192.168.1.168:8000', allow_none=True)
s.init()

# FÜGE AB HIER DEINEN CODE EIN:

s.set_motors(100, -100)
sleep(1)
s.set_motors(0, 0)
