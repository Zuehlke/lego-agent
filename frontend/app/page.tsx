'use client';

import React, {useState} from 'react';
import RobotClient from './robot_client';
import DirectControl from "@/app/DirectControl";
import ChatControl from "@/app/ChatControl";
import VoiceControl from "@/app/VoiceControl";

export default function RobotControl() {
  const [ip, setIp] = useState('');
  const [robotClient, setRobotClient] = useState<RobotClient | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [activeTab, setActiveTab] = useState<string>('chat');

  const handleConfirm = async () => {
    setStatus('connecting...');
    try {
      const client = new RobotClient(ip);
      const devices = await client.getDevices();
      setStatus(`connected: ${devices.join(', ')}`);
      setRobotClient(client);
    } catch (err) {
      setStatus('connection failed');
    }
  };

  const renderActiveTab = () => {
    if (!robotClient) return null;
    switch (activeTab) {
      case 'direct':
        return <DirectControl robotClient={robotClient}/>;
      case 'chat':
        return <ChatControl robotClient={robotClient}/>;
      case 'voice':
        return <VoiceControl robotClient={robotClient}/>;
      default:
        return null;
    }
  };

  return (
    <div>
      <input
        type="text"
        value={ip}
        style={{border: "1px solid black"}}
        onChange={(e) => setIp(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === 'Enter') handleConfirm();
        }}
        placeholder="Enter robot IP"
      />
      <button onClick={handleConfirm}>Confirm</button>
      <p>Status: {status}</p>
      {robotClient && (
        <div>
          <select onChange={(e) => setActiveTab(e.target.value)} value={activeTab}>
            <option value="chat">Chat Control</option>
            <option value="voice">Voice Control</option>
            <option value="direct">(Debug) Direct Control</option>
          </select>
          {renderActiveTab()}
        </div>
      )}
    </div>
  );
}
