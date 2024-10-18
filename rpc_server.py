#!/usr/bin/env python3

from xmlrpc.server import SimpleXMLRPCServer

from simple_robot import SimpleRobot

robot = SimpleRobot()


def rpc_server():
    # Create server
    server = SimpleXMLRPCServer(('0.0.0.0', 8000), allow_none=True)
    server.register_introspection_functions()
    server.register_instance(robot)

    print("Server is running on port 8000...")

    # Run the server's main loop
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Server is shutting down...")
    finally:
        server.server_close()


if __name__ == "__main__":
    rpc_server()
