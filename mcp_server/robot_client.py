import requests
import threading
import time


class RobotClient:
    def __init__(self, ip):
        self.base_url = f"http://{ip}:5000"
        self.motor_speeds = {"left_speed": 0, "right_speed": 0}
        threading.Thread(target=self._motor_watchdog, daemon=True).start()

    def _get(self, path):
        resp = requests.get(self.base_url + path)
        return resp.json()

    def _post(self, path, payload):
        resp = requests.post(self.base_url + path, json=payload)

    def getDevices(self) -> list[str]:
        return self._get("/list_devices")

    def setLights(self, leftColor: str, rightColor: str):
        self._post("/set_lights", {"left_color": leftColor, "right_color": rightColor})

    def setMotors(self, leftSpeed: int, rightSpeed: int):
        self.motor_speeds = {"left_speed": leftSpeed, "right_speed": rightSpeed}
        self._post("/set_motors", self.motor_speeds)

    def setHead(self, position: int):
        self._post("/set_head", {"position": position})

    def speak(self, text: str):
        self._post("/speak", {"text": text})

    def getDistance(self) -> float:
        data = self._get("/get_distance")
        return float(data["distance"])

    def _motor_watchdog(self):
        while True:
            if self.motor_speeds["left_speed"] != 0 or self.motor_speeds["right_speed"] != 0:
                try:
                    # best-effort resend; swallow errors
                    self.setMotors(self.motor_speeds["left_speed"], self.motor_speeds["right_speed"])
                except Exception:
                    pass
            time.sleep(2)
