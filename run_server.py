#!/usr/bin/env python3

from xmlrpc.server import SimpleXMLRPCServer

from robot_server import RobotServer


def main():
    robot = RobotServer()

    server = SimpleXMLRPCServer(('0.0.0.0', 8000), allow_none=True)
    server.register_introspection_functions()
    server.register_instance(robot)

    print("Server is running on port 8000...")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Server is shutting down...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
