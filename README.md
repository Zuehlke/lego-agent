# Lego Agent

This repository contains all code to control a Mindstorms EV3 Lego Robot via a small LLM Agent.

## Setup Repo

Make sure you have [node.js](https://nodejs.org/) installed, then navigate to the frontend directory and run `npm install`.

Furthermore, copy _frontend/app/config.template.tsx_ to _frontend/app/config.tsx_ and fill in your OpenAI API key.

## Prepare Robot

Connect the robot to the same Wi-Fi as your laptop. The robot only supports 2.4 GHz networks.
Upon successful connection, the IP is shown on the top left. Make sure you write it down, since you need it later.

In the file browser, select _run_server.py_ and wait until the lights are no longer blinking. 

## Control Robot

Navigate to the frontend directory and run `npm run dev`.
Open [http://localhost:3000](http://localhost:3000) with your browser.
Use the IP of the robot to connect to it.
Once connected, you should see that it recognized the following hardware: **Lights, Motors, Speaker, Distance**.

## Battery

The screen shows the voltage of the battery.
If it drops below 5V, the robot will turn off.
However, ideally you recharge the battery earlier, to extend its lifetime.

To prevent potential damage to the EV3 block, it's recommended to remove the battery after usage.

## SSH

The robot exposes an SSH interface on the default port.
This can be used to copy over the backend files via sftp.
The following credentials are used:

- Username: _robot_
- Passwort: _maker_

**Hint:** Given the default credentials, and also the unprotected REST API, it's recommended to only use the robot in a trusted network.

## Mock API

If you want to test the frontend without the robot, you can use the mock API.
For this, navigate to the backend directory and run `uv run run_mock_server.py`.
You'll have to have [uv](https://docs.astral.sh/uv/) installed for this.

## Troubleshooting

If you cannot connect to the robot, check the following:

- Is the robot still in the wifi? Sometimes it disconnects, in which case a reboot helps.
- Is the robot and your laptop in the __same__ wifi?
- Is the server on the robot running (_run_server.py_)?
- Was the IP of the robot correctly entered?

If you can connect, but a specific sensor or actor is not working, check if it's connected at the right location:

- Left motor on Port C
- Right motor on Port B
- Head motor on Port A
- Distance sensor on Port 4

You can also try plugging a sensor/actor out and in again or replacing the cable.

## MCP Server

The robot can also be exposed as MCP server. For this, navigate to the _mcp_server_ repo and run the following:

```
uv sync
source .venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The MCP server is now running at http://localhost:8000/mcp via streamable HTTP.
