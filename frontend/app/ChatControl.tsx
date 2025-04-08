import React, {useEffect, useRef, useState} from 'react';
import {OpenAI} from 'openai';
import RobotClient from './robot_client';
import {model_chat, OPENAI_API_KEY} from './config';
import {toolDescriptions, getToolDescChat} from './tools';

interface ChatMessage {
  role: string;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id?: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

const openai = new OpenAI({apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true});

interface Props {
  robotClient: RobotClient;
}

export default function ChatControl({robotClient}: Props) {
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'You control a lego robot by calling different functions that execute commands on the robot'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const callChatApi = async (currentHistory: ChatMessage[]): Promise<ChatMessage> => {
    const completion = await openai.chat.completions.create({
      model: model_chat,
      messages: currentHistory,
      tools: getToolDescChat(),
      store: true,
    });
    return completion.choices[0].message;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    let updatedHistory = [...history, {role: 'user', content: input}];
    setHistory(updatedHistory);
    setInput('');
    setLoading(true);

    let continueLoop = true;
    while (continueLoop) {
      const assistantMsg = await callChatApi(updatedHistory);
      updatedHistory = [...updatedHistory, assistantMsg];
      setHistory(updatedHistory);

      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        for (const toolCall of assistantMsg.tool_calls) {
          let toolResult: any;
          try {
            const parsedArgs = JSON.parse(toolCall.function.arguments);
            const requiredArgs = toolDescriptions[toolCall.function.name].parameters.required;
            const argsArray = requiredArgs.map(key => parsedArgs[key]);
            toolResult = await (robotClient as any)[toolCall.function.name](...argsArray);
          } catch (err: any) {
            toolResult = `Error calling function "${toolCall.function.name}": ${err.message}`;
          }
          const toolResponseMsg: ChatMessage = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: String(toolResult)
          };
          updatedHistory = [...updatedHistory, toolResponseMsg];
          setHistory(updatedHistory);
        }
      } else {
        continueLoop = false;
      }
    }
    setLoading(false);
  };

  function mapHistoryForVisualization(history: ChatMessage[]): ChatMessage[] {
    const visualizedHistory: ChatMessage[] = [];
    history
      .filter((msg) => msg.role !== 'system')
      .forEach((msg) => {
        if (msg.role !== "assistant") {
          visualizedHistory.push(msg);
        } else {
          const hasContent = msg.content && msg.content.trim().length > 0;
          const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
          if (hasContent && hasToolCalls) {
            visualizedHistory.push({...msg, tool_calls: undefined});
            msg.tool_calls!.forEach((toolCall) => {
              visualizedHistory.push({
                role: "assistant",
                content: `Tool call: ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`,
              });
            });
          } else if (hasToolCalls) {
            msg.tool_calls!.forEach((toolCall) => {
              visualizedHistory.push({
                role: "assistant",
                content: `Tool call: ${toolCall.function.name} with arguments: ${toolCall.function.arguments}`,
              });
            });
          } else {
            visualizedHistory.push(msg);
          }
        }
      });
    return visualizedHistory;
  }

  function mapChatHistory(history: ChatMessage[]): ChatMessage[] {
    const visualizedHistory: ChatMessage[] = [];
    history
      .filter((msg) => msg.role !== 'system')
      .forEach((msg) => {
        if (msg.role === "user") {
          visualizedHistory.push(msg);
        } else if (msg.role === "assistant") {
          const hasContent = msg.content && msg.content.trim().length > 0;
          const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
          if (hasContent && !hasToolCalls) {
            visualizedHistory.push(msg);
          }
        }
      });
    return visualizedHistory;
  }

  function mapToolCallHistory(history: ChatMessage[]): ChatMessage[] {
    const visualizedHistory: ChatMessage[] = [];
    history
      .filter((msg) => msg.role !== 'system')
      .forEach((msg) => {
        const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
        if (hasToolCalls) {
          msg.tool_calls!.forEach((toolCall) => {
            visualizedHistory.push({
              role: "Tool call",
              content: `${toolCall.function.name} with arguments: ${toolCall.function.arguments}`,
            });
          });
        }
      });
    return visualizedHistory;
  }

  function mapToolHistory(history: ChatMessage[]): ChatMessage[] {
    const visualizedHistory: ChatMessage[] = [];
    history
      .filter((msg) => msg.role !== 'system')
      .forEach((msg) => {
        if (msg.role !== "assistant" && msg.role !== "user") {
          visualizedHistory.push(msg);
        }
      });
    return visualizedHistory;
  }



  return (
    <div className='p-3 h-full'>
      <h2>Robot Chat Control</h2>
      <div className='flex flex-row h-9/10'>
        <div className='p-3 w-1/2'>
          <div className='flex flex-col p-4 rounded-2xl bg-fuchsia-700 h-full'>
            <div className='flex flex-col flex-grow border-2 p-3 mb-3 overflow-y-auto'>
              {mapChatHistory(history).map((msg, idx) => (
                <div key={idx} className='mb-1'>
                  <strong>{msg.role}:</strong> {msg.content}
                </div>
              ))}
            </div>

            <div className='flex'>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSend();
                }}
                disabled={loading}
                style={{flex: 1, padding: "8px", border: "1px solid black"}}
              />
              <button onClick={handleSend} disabled={loading} style={{marginLeft: "10px", padding: "8px"}}>
                Send
              </button>
            </div>
          </div>
        </div>
        <div className='flex flex-col w-1/2 p-3 gap-6'>
          <div className='p-4 rounded-2xl bg-fuchsia-700 flex-1 max-h-1/2'>
            <div className='border-2 h-full p-3 overflow-y-auto'>
              {mapToolCallHistory(history).map((msg, idx) => (
                <div key={idx} className='mb-1'>
                  <strong>{msg.role}:</strong> {msg.content}
                </div>
              ))}
            </div>
          </div>
          <div className='p-4 rounded-2xl bg-fuchsia-700 flex-1  max-h-1/2'>
            <div className='border-2 h-full p-3 overflow-y-auto'>
              {mapToolHistory(history).map((msg, idx) => (
                <div key={idx} className='mb-1'>
                  <strong>{msg.role}:</strong> {msg.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
