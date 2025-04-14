'use client';

import React, {useState} from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RobotClient from './robot_client';
import DirectControl from "@/app/DirectControl";
import ChatControl from "@/app/ChatControl";
import VoiceControl from "@/app/VoiceControl";
import {
  faCode,
  faHeadset,
  faKeyboard,
} from "@fortawesome/free-solid-svg-icons";
import zuehlkeLogo from '@/app/img/logo.png';

export default function RobotControl() {
  const [ip, setIp] = useState('');
  const [robotClient, setRobotClient] = useState<RobotClient | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [devices, setDevices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('chat');
  const CONNECTED_STRING = "Connected";

  const handleConfirm = async () => {
    setStatus('connecting...');
    try {
      const client = new RobotClient(ip || "localhost");
      setDevices(await client.getDevices());
      setStatus(CONNECTED_STRING);
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
  <div className='flex flex-row h-screen m-0 p-0 bg-zuehlke-secondary'>
    <div className="flex flex-col justify-between bg-zuehlke-insight text-white w-40 p-4 pt-0">
      <div>
        <img src={zuehlkeLogo.src} alt='Zühlke Logo' />
        <div className='flex flex-col gap-6 pt-6'>
          <FontAwesomeIcon icon={faKeyboard} size='3x' onClick={(e) => setActiveTab("chat")} className={(activeTab == 'chat' ? 'shadow bg-black' : '') + ' hover:cursor-pointer rounded-2xl'} />
          <FontAwesomeIcon icon={faHeadset} size='3x' onClick={(e) => setActiveTab("voice")} className={(activeTab == 'voice' ? 'shadow bg-black' : '') + ' hover:cursor-pointer rounded-2xl'} />
          <FontAwesomeIcon icon={faCode} size='3x' onClick={(e) => setActiveTab("direct")} className={(activeTab == 'direct' ? 'shadow bg-black' : '') + ' hover:cursor-pointer rounded-2xl'} />
        </div>
      </div>
      { !!robotClient ? 
        <div className='hover:cursor-pointer border p-3 bg-purple-300 text-black shadow rounded-2xl' onClick={() => setRobotClient(null)}>
          <p>{ip}</p>
          { devices.map(device => {
            return (<p key={device}>{device}</p>)
          }) }
        </div>
        : null
      }
      
    </div>

    <div className='flex flex-col w-full'>
      <div className='items-center h-full'>
        { !!!robotClient ?
          <div className='h-full flex  items-center'>
            <div className='mx-auto flex flex-col max-w-sm items-center gap-x-4 gap-y-3 rounded-xl p-5 shadow-lg outline bg-zuehlke-insight dark:shadow-2xl'>
              <input
                className='bg-white'
                type="text"
                value={ip}
                style={{border: "1px solid black"}}
                onChange={(e) => setIp(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                }}
                placeholder="Enter robot IP"
              />
              <p>Status: {status}</p>
              <button className="bg-sky-500 hover:bg-sky-700 rounded-2xl p-1" onClick={handleConfirm}>Confirm</button>
            </div>
          </div>
          :
          <div className='h-full'>
            {renderActiveTab()}
          </div>
        }
      </div>
      
    </div>
  </div>
    
  );
}
