import React, {useEffect, useRef, useState} from 'react';
import {OpenAI} from 'openai';
import RobotClient from './robot_client';
import {model_chat, OPENAI_API_KEY} from './config';
import {toolDescriptions, getToolDescChat} from './tools';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

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
  const toolChatEndRef = useRef(null);
  const chatEndRef = useRef(null);

  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    toolChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);
  

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
        } else if (msg.role !== "assistant" && msg.role !== "user") {
          visualizedHistory.push(msg);
        }
      });
    return visualizedHistory;
  }

  return (
    <div className='p-3 h-full'>
      <div className='flex flex-row h-full'>
        <div className='p-3 w-1/2'>
          <div className='flex flex-col border-2 p-4 rounded-2xl bg-zuehlke-insight h-full shadow-2xl'>
            <div className='flex flex-col flex-grow border-2 rounded-xl p-3 mb-3 overflow-y-auto bg-zuehlke-secondary'>
              {mapChatHistory(history).map((msg, idx) => (
                <div key={idx} className='mb-1'>
                  <strong>{msg.role}:</strong> {msg.content}
                </div>
              ))}
              <div ref={chatEndRef} />
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
                className='flex-1 p-2 border-2 rounded-xl bg-zuehlke-secondary'
              />
              <button onClick={handleSend} disabled={loading} className='hover:cursor-pointer px-3 '>
                <FontAwesomeIcon icon={faPaperPlane} size='2x' />
              </button>
            </div>
          </div>
        </div>
        <div className='flex flex-col w-1/2 p-3'>
          <div className='border-2 p-4 h-full rounded-2xl bg-zuehlke-insight shadow-2xl'>
            <div className='border-2 h-full p-3 rounded-xl overflow-y-auto bg-zuehlke-secondary'>
              {mapToolCallHistory(history).map((msg, idx) => (
                <div key={idx} >
                  <strong>{msg.role}:</strong> {msg.content}
                </div>
              ))}
              <div ref={toolChatEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
