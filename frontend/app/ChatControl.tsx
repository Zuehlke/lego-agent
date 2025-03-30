import React, {useState} from 'react';
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


  return (
    <div>
      <h2>Robot Chat Control</h2>
      <div
        style={{height: "300px", overflowY: "scroll", border: "1px solid #ccc", padding: "10px", marginBottom: "10px"}}>
        {mapHistoryForVisualization(history).map((msg, idx) => (
          <div key={idx} style={{marginBottom: "10px"}}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div style={{display: "flex"}}>
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
  );
}
