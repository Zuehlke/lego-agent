# Lego Agent

This repository contains all code to control a Mindstorms EV3 Lego Robot via a small LLM Agent.

## Setup Repo

Make sure you have [uv](https://docs.astral.sh/uv/) installed, then navigate to this directoy and run `uv sync`.

Furthermore, copy _.env.template_ to _.env_ and populate the variables.
The IP address can be found on the robot screen (see below).

## Prepare Robot

Connect the following hardware to the EV3 block:

- Left motor to port A
- Right motor to port D
- Ultrasonic sensor to port 4

Connect the robot to the same wifi as your laptop. Upon successful connection, the IP is shown on the top left.
The robot only supports 2.4 GHz networks.

In the file browser, select _run_server.py_ and wait until the light are no longer blinking. 

## Control Robot

You can either run a fixed script by executing `uv run main_script.py` or a flexible chat with `uv run main_chat.py`.
In both cases, a small log-statement shows you if it was possible to connect to the robot, including the hardware which was recognized by the robot.

## Battery

The screen shows the voltage of the battery.
If it drops below 5V, the robot will turn off.
However, ideally you recharge the battery earlier, to extend its lifetime.

To prevent potential damage to the EV3 block, it's recommended to remove the battery after usage.

## SSH

The robot exposes an SSH interface on the default port.
This can be used to copy over files via sftp.
The following credentials are used:

- Username: _robot_
- Passwort: _maker_

## Troubleshooting

If you cannot connect to the robot (`ConnectionRefusedError`), check the following:

- Is the robot still in the wifi? Sometimes it disconnects, in which case a reboot helps.
- Is the robot and your laptop in the __same__ wifi?
- Is the IP of the robot correctly configured in _.env_?
- Is the server on the robot running (_run_server.py_)?

If you can connect, but a specific sensor or actor is not working, check if it's connected at the right location.
Optionally plug it out and in again or replace the cable.
