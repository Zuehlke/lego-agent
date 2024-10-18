import time
import xmlrpc.client


if __name__ == '__main__':
    s = xmlrpc.client.ServerProxy('http://192.168.48.88:8000', allow_none=True)
    # print(s.system.listMethods())

    s.speak("Hello World!")
