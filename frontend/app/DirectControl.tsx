import React, { useState } from 'react';
import RobotClient from './robot_client';

interface Props {
  robotClient: RobotClient;
}

export default function DirectControl({ robotClient }: Props) {
  const [leftSpeed, setLeftSpeed] = useState(0);
  const [rightSpeed, setRightSpeed] = useState(0);
  const [leftColor, setLeftColor] = useState('');
  const [rightColor, setRightColor] = useState('');
  const [speakText, setSpeakText] = useState('');
  const [distance, setDistance] = useState<number | null>(null);

  const handleSetMotors = async () => {
    await robotClient.setMotors(leftSpeed, rightSpeed);
  };

  const handleSetLights = async () => {
    await robotClient.setLights(leftColor, rightColor);
  };

  const handleSpeak = async () => {
    await robotClient.speak(speakText);
  };

  const handleGetDistance = async () => {
    const dist = await robotClient.getDistance();
    setDistance(dist);
  };

  return (
    <div>
      <h2>Robot Manual Control</h2>
      <div>
        <h3>Set Motors</h3>
        <input
          type="number"
          value={leftSpeed}
          onChange={(e) => setLeftSpeed(Number(e.target.value))}
          placeholder="Left Speed"
        />
        <input
          type="number"
          value={rightSpeed}
          onChange={(e) => setRightSpeed(Number(e.target.value))}
          placeholder="Right Speed"
        />
        <button onClick={handleSetMotors}>Set Motors</button>
      </div>
      <div>
        <h3>Set Lights</h3>
        <input
          type="text"
          value={leftColor}
          onChange={(e) => setLeftColor(e.target.value)}
          placeholder="Left Color"
        />
        <input
          type="text"
          value={rightColor}
          onChange={(e) => setRightColor(e.target.value)}
          placeholder="Right Color"
        />
        <button onClick={handleSetLights}>Set Lights</button>
      </div>
      <div>
        <h3>Speak</h3>
        <input
          type="text"
          value={speakText}
          onChange={(e) => setSpeakText(e.target.value)}
          placeholder="Text to Speak"
        />
        <button onClick={handleSpeak}>Speak</button>
      </div>
      <div>
        <h3>Get Distance</h3>
        <button onClick={handleGetDistance}>Get Distance</button>
        {distance !== null && <p>Distance: {distance} cm</p>}
      </div>
    </div>
  );
}