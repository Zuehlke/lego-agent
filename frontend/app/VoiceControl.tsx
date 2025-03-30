import React from 'react';
import {useEffect, useRef, useState} from "react";
import RobotClient from './robot_client';
import {model_voice, OPENAI_API_KEY, voice} from './config';
import {getToolDescVoice, toolDescriptions} from "@/app/tools";

interface Props {
  robotClient: RobotClient;
}

export default function VoiceControl({robotClient}: Props) {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const peerConnection = useRef<RTCPeerConnection>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [events, setEvents] = useState([]);  // TODO: Are events needed?
  const audioElement = useRef<HTMLAudioElement>(null);
  const [listening, setListening] = useState(true);

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
      setEvents((prev) => [message, ...prev]);
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
        setEvents((prev) => [event, ...prev]);

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
          setEvents([]);
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
            }
          }))
          if(function_called) {
            sendClientEvent({type: "response.create"})
          }
        }
      });
    }
  }, [dataChannel]);

  // TODO: Show function calls and results
  return (
    <div>
      <h2>Robot Voice Control</h2>
      <button disabled={status === "connecting"} onClick={status === "connected" ? stopSession : startSession}>
        {status === "connected" ? "Stop" : "Start"} Session
      </button>
      <p>Status: {status}</p>
      {status === "connected" && (
        <p>Turn: {listening ? "Listening" : "Speaking"}</p>
      )}
      <p>Events:</p>
      {events.map((event, i) => (
        <div key={i}><b>{event.type}</b>{JSON.stringify(event)}</div>
      ))}
    </div>
  );
};
