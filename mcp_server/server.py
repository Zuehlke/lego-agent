from mcp.server.fastmcp import FastMCP
from robot_client import RobotClient
from typing import Literal
import os
import httpx
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.exceptions import HTTPException

ROBOT_IP = os.environ["ROBOT_IP"]
OAUTH_AUTHORIZATION_SERVER_URL = os.environ.get("OAUTH_AUTHORIZATION_SERVER_URL")

mcp = FastMCP("Lego Robot")
robot = RobotClient(ROBOT_IP)

@mcp.tool()
def setLights(
    leftColor: Literal["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"],
    rightColor: Literal["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
) -> str:
    """Set the color of the left and right light (or turn it off by setting it to BLACK)."""
    robot.setLights(leftColor, rightColor)
    return f"Set left light to {leftColor} and right light to {rightColor}"

@mcp.tool()
def setMotors(leftSpeed: int, rightSpeed: int) -> str:
    """Set the speed of the left and right motor (or turn it off by setting it to 0).
    
    Args:
        leftSpeed: Speed of left motor, from -100 (full backwards) to 100 (full forwards).
        rightSpeed: Speed of right motor, from -100 (full backwards) to 100 (full forwards).
    """
    if not (-100 <= leftSpeed <= 100):
        raise ValueError("leftSpeed must be between -100 and 100")
    if not (-100 <= rightSpeed <= 100):
        raise ValueError("rightSpeed must be between -100 and 100")
    
    robot.setMotors(leftSpeed, rightSpeed)
    return f"Set left motor speed to {leftSpeed} and right motor speed to {rightSpeed}"

@mcp.tool()
def setHead(position: int) -> str:
    """Set the position of the head.
    
    Args:
        position: Position, from -100 (fully to the right) to 100 (fully to the left).
    """
    if not (-100 <= position <= 100):
        raise ValueError("position must be between -100 and 100")
    
    robot.setHead(position)
    return f"Set head position to {position}"

@mcp.tool()
def speak(text: str) -> str:
    """Speak a text via the speaker of the robot.
    
    Args:
        text: Text to speak. The text has to be in English, no other language is supported. 
              Special signs like apostrophe or so are not supported, only alphanumerical characters.
    """
    robot.speak(text)
    return f"Speaking"

@mcp.tool()
def getDistance() -> float:
    """Get the distance which is detected by the distance sensor, value in centimeters."""
    distance = robot.getDistance()
    return distance

@mcp.tool()
def getDevices() -> list[str]:
    """Get the list of connected devices on the robot."""
    devices = robot.getDevices()
    return devices

app = mcp.streamable_http_app()

async def oauth_authorization_server(request):
    if not OAUTH_AUTHORIZATION_SERVER_URL:
        raise HTTPException(status_code=404, detail="OAuth authorization server URL not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OAUTH_AUTHORIZATION_SERVER_URL}/.well-known/oauth-authorization-server")
            response.raise_for_status()
            return JSONResponse(response.json())
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch OAuth configuration: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

oauth_route = Route("/.well-known/oauth-authorization-server", oauth_authorization_server, methods=["GET"])
app.router.routes.append(oauth_route)
