from ev3dev2.led import Leds

# Reusable type definitions
LEDGroup = str # ['LEFT', 'RIGHT']
LEDColor = str # ['BLACK', 'RED', 'GREEN', 'AMBER', 'ORANGE', 'YELLOW']



class SimpleRobot(object):
    def __init__(self, **data):
        self.leds = Leds()


    def set_led_color(self,
                      group: LEDGroup,
                      color: LEDColor,
                      pct = 1
                    ) -> None:
        """
            "description": "Set the color of a specific LED",
            "parameters": {
                "type": "object",
                "properties": {
                    "group": {
                        "type": "string",
                        "description": "Which LED to change the color.",
                        "enum": ["LEFT", "RIGHT"]
                    },
                    "color": {
                        "type": "string",
                        "enum": ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
                    },
                },
                "required": ["group", "color"]
            }
        """
        self.leds.set_color(group, color, pct)


    def all_leds_off(self) -> None:
        """
            "description": "Turn all LEDs off"
        """
        self.leds.all_off()

    
    def animate_police_lights(self,
                              color1: LEDColor='RED',
                              color2: LEDColor='YELLOW',
                              group1: LEDGroup='LEFT',
                              group2: LEDGroup='RIGHT',
                              sleeptime=0.5,
                              duration=5,
                              block=True
                            ) -> None:
        """
            "description": "Cycle the group1 and group2 LEDs between color1 and color2 to give the effect of police lights.  Alternate the group1 and group2 LEDs every sleeptime seconds. Animate for duration seconds.  If duration is None animate for forever.",
            "parameters": {
                "type": "object",
                "properties": {
                    "color1": {
                        "type": "string",
                        "enum": ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
                    },
                    "color2": {
                        "type": "string",
                        "enum": ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
                    },
                    "group1": {
                        "type": "string",
                        "description": "Which LED to change the color.",
                        "enum": ["LEFT", "RIGHT", "BOTH"]
                    },
                    "group2": {
                        "type": "string",
                        "description": "Which LED to change the color.",
                        "enum": ["LEFT", "RIGHT", "BOTH"]
                    },
                },
                "required": []
            }
        """
        self.leds.animate_police_lights(color1, color2, group1, group2, sleeptime, duration, block)

    
    def animate_stop(self) -> None:
        """
            "description": "Stop all animation"
        """
        self.leds.animate_stop()