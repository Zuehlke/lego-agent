# WILLKOMMEN!

# DIESEN TEIL HIER SOLLTEST DU NICHT ÄNDERN
import time
import xmlrpc.client

s = xmlrpc.client.ServerProxy('http://192.168.1.168:8000', allow_none=True)


# FÜGE AB HIER DEINEN CODE EIN:

s.set_motors(100, -100)
time.sleep(1)
s.set_motors(0, 0)
