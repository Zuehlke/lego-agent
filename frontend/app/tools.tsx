export const toolDescriptions: {
  [key: string]: {
    description: string;
    parameters: {
      properties: any;
      required: string[];
    };
  };
} = {
  setLights: {
    description: "Set the color of the left and right light (or turn it off by setting it to BLACK).",
    parameters: {
      properties: {
        leftColor: {
          type: "string",
          description: "Color for left light",
          enum: ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
        },
        rightColor: {
          type: "string",
          description: "Color for right light",
          enum: ["BLACK", "RED", "GREEN", "AMBER", "ORANGE", "YELLOW"]
        }
      },
      required: ["leftColor", "rightColor"],
    }
  },
  setMotors: {
    description: "Set the speed of the left and right motor (or turn it off by setting it to 0).",
    parameters: {
      properties: {
        leftSpeed: {
          type: "number",
          description: "Speed of left motor, from -100 (full backwards) to 100 (full forwards)."
        },
        rightSpeed: {
          type: "number",
          description: "Speed of right motor, from -100 (full backwards) to 100 (full forwards)."
        }
      },
      required: ["leftSpeed", "rightSpeed"],
    }
  },
  setHead: {
    description: "Set the position of the head.",
    parameters: {
      properties: {
        position: {
          type: "number",
          description: "Position, from -100 (fully to the right) to 100 (fully to the left)."
        }
      },
      required: ["position"],
    }
  },
  speak: {
    description: "Speak a text via the speaker of the robot.",
    parameters: {
      properties: {
        text: {
          type: "string",
          description: "Text to speak. The text has to be in English, no other language is supported. Special signs like apostrophe or so are not supported, only alphanumerical characters."
        }
      },
      required: ["text"],
    }
  },
  getDistance: {
    description: "\"Get the distance which is detected by the distance sensor, value in centimeters.",
    parameters: {properties: {}, required: []}
  }
};

export function getToolDescChat() {
  return Object.entries(toolDescriptions).map(([name, meta]) => ({
    type: "function",
    function: {
      name,
      description: meta.description,
      parameters: {
        type: "object",
        properties: meta.parameters.properties,
        required: meta.parameters.required,
        additionalProperties: false
      },
      strict: true
    }
  }));
}

export function getToolDescVoice() {
  return Object.entries(toolDescriptions)
    .filter(([name]) => name !== 'speak')
    .map(([name, meta]) => ({
      type: "function",
      name,
      description: meta.description,
      parameters: {
        type: "object",
        strict: true,
        properties: meta.parameters.properties,
        required: meta.parameters.required
      }
    }));
}
