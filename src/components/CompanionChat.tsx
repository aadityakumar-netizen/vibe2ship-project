import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, Task } from "../types";
import VoiceInput from "./VoiceInput";
import {
  Sparkles,
  Send,
  Brain,
  Flame,
  Mail,
  Activity,
  Check,
  Plus,
  Dna,
  Zap,
  Bot,
  User,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  Trash2,
} from "lucide-react";

interface CompanionChatProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  chatHistory: ChatMessage[];
  onChatHistoryChange: (history: ChatMessage[]) => void;
}

export default function CompanionChat({
  tasks,
  onTasksChange,
  chatHistory,
  onChatHistoryChange,
}: CompanionChatProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingParsedTask, setPendingParsedTask] = useState<any>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const newHistory = [...chatHistory, userMsg];
    onChatHistoryChange(newHistory);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          chatHistory: newHistory.slice(-10), // Pass recent context
          currentTasks: tasks,
        }),
      });
      const data = await response.json();

      const coachMsg: ChatMessage = {
        sender: "coach",
        text:
          data.reply || "I am right here with you. What should we tackle next?",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      onChatHistoryChange([...newHistory, coachMsg]);

      // Check if Lumina parsed an autonomous planned task
      if (data.action === "add_task" && data.taskData) {
        setPendingParsedTask(data.taskData);
      }
    } catch (err) {
      console.error(err);
      onChatHistoryChange([
        ...newHistory,
        {
          sender: "coach",
          text: "I hit a small cosmic disruption in my AI network. But don't let that stop you: break your goal down manually, take a dynamic breath pattern, and log your next objective! I am still right here supporting you.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyboardSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const approveParsedTask = () => {
    if (!pendingParsedTask) return;

    // Convert date string if approximate or missing
    let finalDueDate = pendingParsedTask.dueDate;
    if (!finalDueDate || finalDueDate.length < 5) {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0); // 5 PM tomorrow
      finalDueDate = tomorrow.toISOString().slice(0, 16);
    }

    const taskCreated: Task = {
      id: "ai_parsed_" + Math.random().toString(36).substring(2, 9),
      title: pendingParsedTask.title || "Parsed Deadline Assignment",
      notes:
        pendingParsedTask.notes ||
        "Automatically structured by Lumina Coach from speech/chat conversation.",
      dueDate: finalDueDate,
      importance: pendingParsedTask.importance || "high",
      estimatedTime: Number(pendingParsedTask.estimatedTime) || 45,
      completed: false,
      category: pendingParsedTask.category || "assignment",
    };

    onTasksChange([...tasks, taskCreated]);
    setPendingParsedTask(null);

    // Send supportive system verification message
    onChatHistoryChange([
      ...chatHistory,
      {
        sender: "coach",
        text: `🚀 Added! I have categorized "${taskCreated.title}" and locked it into your core planner queue. We can prioritize it at any time!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  // Direct fast starter pill triggers
  const promptPills = [
    {
      label: "🔥 Emergency Panic Shift",
      prompt:
        "I am feeling highly overwhelmed and panicked about an approaching deadline. Take me through an cognitive emergency panic reset loop right now.",
    },
    {
      label: "✉️ Draft Extension Script",
      prompt:
        "I am in a high-stress pinch. Draft a highly professional, polite, and respectful deadline extension email template I can copy and send to my professor/client right now.",
    },
    {
      label: "🧩 Break Down Math/Quiz Prep",
      prompt:
        "Draft a high-speed micro-targeted study blueprint for a technical assignment/quiz tomorrow. Break down the hours needed.",
    },
  ];

  return (
    <div
      id="companion-chat"
      className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[650px]"
    >
      {/* Header element */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm inline-block">
              <Bot className="w-5 h-5" />
            </span>
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
              Lumina Companion AI
            </h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
              Active Strategy Guard
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {chatHistory.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChatHistoryChange([]);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-100 dark:border-slate-800 rounded-lg transition-all duration-150 cursor-pointer shadow-3xs"
              title="Clear Chat"
            >
              <Trash2 className="w-3 h-3 text-rose-500" />
              <span>Clear Chat</span>
            </button>
          )}
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter uppercase font-semibold hidden sm:inline">
            Strategy Mode Live
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 py-2">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center h-full py-10 space-y-4 px-4 animate-fade-in">
            <span className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-900/30 shadow-2xs">
              <Bot className="w-8 h-8 animate-pulse" />
            </span>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                No Active Chat Ledger
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-xs leading-relaxed">
                Consult Lumina AI Companion on homework prep, draft extension email messages, or get immediate mental relaxation guidelines.
              </p>
            </div>
          </div>
        )}

        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-2.5 max-w-[80%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar block */}
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                msg.sender === "user"
                  ? "bg-slate-150 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  : "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-450"
              }`}
            >
              {msg.sender === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-tr-none font-medium"
                  : "bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800/80"
              }`}
            >
              <p className="font-normal whitespace-pre-wrap">{msg.text}</p>
              <span
                className={`text-[9px] mt-1.5 block text-right font-medium opacity-60 ${
                  msg.sender === "user"
                    ? "text-slate-300 dark:text-slate-700"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Live Pending Task parsing prompt card */}
        {pendingParsedTask && (
          <div className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-slate-850 dark:to-slate-900 border border-violet-100 dark:border-violet-900/40 rounded-2xl max-w-[85%] mr-auto space-y-3 shadow-md animate-fade-in">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-750 dark:text-violet-400">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 animate-spin" />
              Autonomous Deadline Extracted!
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              I heard you list an impending chore. Approve this details envelope
              to schedule it instantly in your core planner queue:
            </p>

            <div className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-violet-100/40 dark:border-violet-900/30 text-xs space-y-2 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-550">
                  Title:
                </span>
                <span className="text-slate-800 dark:text-slate-200 text-right font-semibold">
                  {pendingParsedTask.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-550">
                  Duration:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {pendingParsedTask.estimatedTime || 45} mins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-550">
                  Difficulty Level:
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-bold uppercase">
                  {pendingParsedTask.importance === "high"
                    ? "Critical Risk"
                    : "Normal"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingParsedTask(null)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-[10px] text-slate-650 dark:text-slate-300 font-bold transition cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={approveParsedTask}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition cursor-pointer"
              >
                Approve & Schedule
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 mr-auto bg-slate-100 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-xl rounded-tl-none text-xs text-slate-500 dark:text-slate-450">
            <div className="flex gap-1">
              <span
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Lumina is formulating strategy...
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested pill starters */}
      {chatHistory.length <= 2 && (
        <div className="py-2 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-850 shrink-0">
          {promptPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(pill.prompt)}
              className="text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-850 rounded-full py-1.5 px-3 border border-slate-200 dark:border-slate-750 transition shadow-2xs font-bold cursor-pointer"
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}

      {/* Input container */}
      <form
        onSubmit={handleKeyboardSend}
        className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 items-center"
      >
        <input
          id="input-chat-message"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type an issue, e.g. 'I've got an exam tomorrow and I'm stressed!'"
          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-650 focus:ring-1 focus:ring-indigo-650 transition placeholder-slate-400 dark:placeholder-slate-500"
        />
        <VoiceInput
          onTranscript={(text) =>
            setInputText((prev) => (prev ? prev + " " + text : text))
          }
          placeholder="Lumina listening..."
        />
        <button
          id="btn-chat-send"
          type="submit"
          disabled={!inputText.trim() || loading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4 fill-white" />
        </button>
      </form>
    </div>
  );
}
