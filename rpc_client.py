import xmlrpc.client

s = xmlrpc.client.ServerProxy('http://192.168.178.145:8000', allow_none=True)
s.set_led_color("LEFT", "GREEN")

# Print list of available methods
print(s.system.listMethods())