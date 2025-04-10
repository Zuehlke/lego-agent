import React from 'react';
import {useEffect, useRef, useState} from "react";
import RobotClient from './robot_client';
import {model_voice, OPENAI_API_KEY, voice} from './config';
import {getToolDescVoice, toolDescriptions} from "@/app/tools";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed, faEarListen, faMicrophone, faMicrophoneSlash, faPlaneDeparture, faVolumeHigh } from '@fortawesome/free-solid-svg-icons';

interface Props {
  robotClient: RobotClient;
}

export default function VoiceControl({robotClient}: Props) {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const peerConnection = useRef<RTCPeerConnection>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const audioElement = useRef<HTMLAudioElement>(null);
  const [listening, setListening] = useState(true);
  const [functionCalls, setFunctionCalls] = useState<{name: string, args: string, result: string}[]>([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [functionCalls]);

  async function startSession() {
    setStatus("connecting");

    const pc = new RTCPeerConnection();

    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current!.srcObject = e.streams[0]);

    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=${model_voice}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      peerConnection.current.close();
    }

    setDataChannel(null);
    peerConnection.current = null;
    setStatus("disconnected");
  }

  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      dataChannel.send(JSON.stringify(message));

      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      console.log(message)
    }
  }

  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", async (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }
        console.log(event)

        if (event.type === "session.created") {
          sendClientEvent({
            type: "session.update",
            session: {
              instructions: "You control a lego robot by calling different functions that execute commands on the robot. Talk as if you're the robot, don't talk about the robot in 3rd person.",
              voice,
              tools: getToolDescVoice(),
              tool_choice: "auto"
            }
          });
          setStatus("connected");
        } else if (event.type === "output_audio_buffer.started") {
          setListening(false);
        } else if (event.type === "output_audio_buffer.stopped") {
          setListening(true);
        } else if (event.type === "response.done" && event.response.output) {
          let function_called = false;
          await Promise.all(event.response.output.map(async (output) => {
            if (output.type == "function_call") {
              function_called = true;
              let toolResult: any;
              try {
                const parsedArgs = JSON.parse(output.arguments);
                const requiredArgs = toolDescriptions[output.name].parameters.required;
                const argsArray = requiredArgs.map(key => parsedArgs[key]);
                toolResult = await (robotClient as any)[output.name](...argsArray);
              } catch (err: any) {
                toolResult = `Error calling function "${output.name}": ${err.message}`;
              }
              sendClientEvent({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: output.call_id,
                  output: String(toolResult)
                }
              });
              setFunctionCalls((prev) => [...prev,
                {
                name: output.name,
                args: output.arguments,
                result: String(toolResult)
              }])
            }
          }))
          if(function_called) {
            sendClientEvent({type: "response.create"})
          }
        }
      });
    }
  }, [dataChannel]);

  return (
    <div className='flex flex-row h-full w-full p-3'>
      <div className='flex flex-col flex-1 p-3 justify-center gap-20'>
        <button disabled={status === "connecting"} onClick={status === "connected" ? stopSession : startSession} className='hover:cursor-pointer'>
          <FontAwesomeIcon size='10x' icon={status === "connected" ? faMicrophone : faMicrophoneSlash} className={(status === "connected" ? "shadow-white bg-white rounded-full" : "") + " p-2"} />
        </button>
        <button disabled={true} >
          <FontAwesomeIcon size='10x' className={( status === "connected" && listening ? "shadow-white bg-white rounded-full p-8" : "") + " flex p-2"} icon={ status === "disconnected" ? (
            faBed
            ) : ( status === "connecting" ? 
              faPlaneDeparture
              : ( listening ? 
                faEarListen
                : faVolumeHigh
              )
            )
          } />
        </button>
        
        
      </div>
      <div className='flex-1 p-3'>
        <div className='border-2 p-4 rounded-2xl bg-zuehlke-insight flex-1 h-full shadow-2xl'>
          <div className='border-2 h-full rounded-xl p-3 overflow-y-auto bg-zuehlke-secondary flex-none'>
            {functionCalls.map((call, i) => (
              <div key={i}><b>{call.name}</b> {call.args}: {call.result}</div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>     
    </div>
  );
};
