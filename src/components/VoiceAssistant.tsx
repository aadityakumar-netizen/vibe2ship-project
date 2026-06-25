import React, { useState, useEffect, useRef } from "react";
import { Task } from "../types";
import { safeLocalStorage } from "../utils/safeStorage";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  X,
  HelpCircle,
  Clock,
  Calendar,
  AlertCircle,
  Play,
  Bookmark
} from "lucide-react";

interface VoiceAssistantProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  className?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function VoiceAssistant({
  tasks,
  onTasksChange,
  className = "",
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen
}: VoiceAssistantProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : localIsOpen;
  const setIsOpen = isControlled && controlledSetIsOpen ? controlledSetIsOpen : setLocalIsOpen;

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechSynthSupported, setSpeechSynthSupported] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("Click the microphone and speak your request.");
  const [lastCreatedTask, setLastCreatedTask] = useState<Task | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  // Manual typing override input
  const [manualInput, setManualInput] = useState("");

  // Speech Recognition setup
  useEffect(() => {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setIsListening(true);
          setTranscript("");
          setStatusMessage("Lumina is listening... Speak clearly.");
          setErrorMessage("");
        };

        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setTranscript(finalTranscript);
            handleVoiceCommand(finalTranscript);
          } else if (interimTranscript) {
            setTranscript(interimTranscript);
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            setErrorMessage("Microphone permission blocked. Please check your browser settings.");
            setStatusMessage("Microphone access is blocked.");
          } else if (event.error === "no-speech") {
            setErrorMessage("No speech detected. Speak clearly and close to your mic.");
            setStatusMessage("Click to try again.");
          } else {
            setErrorMessage(`Recognition failed: ${event.error}`);
            setStatusMessage("Error occurred. Please try again.");
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    } catch (e) {
      console.warn("SpeechRecognition is unsupported in this container/browser environment.", e);
    }

    try {
      if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
        setSpeechSynthSupported(true);
      }
    } catch (_) {}

    // Load mute preference
    const savedMute = safeLocalStorage.getItem("voice_assistant_muted");
    if (savedMute === "true") {
      setIsMuted(true);
    }
  }, []);

  // Speak voice confirmation back to the user
  const speakText = (text: string) => {
    if (isMuted || !speechSynthSupported) return;
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel(); // Stop any currently speaking audio

      const UtteranceClass = (window as any).SpeechSynthesisUtterance;
      if (!UtteranceClass) return;

      const utterance = new UtteranceClass(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05; // Slightly pleasant high pitch

      // Select a nice English voice if available
      const voices = synth.getVoices();
      const engVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB"));
      if (engVoice) {
        utterance.voice = engVoice;
      }

      synth.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis failed:", e);
    }
  };

  // Extract relative due date and format as YYYY-MM-DDTHH:MM
  const extractDueDate = (textLower: string): { isoString: string; label: string } => {
    const today = new Date();
    const resultDate = new Date();
    let label = "Tomorrow";

    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let foundDayIdx = -1;

    for (let i = 0; i < daysOfWeek.length; i++) {
      if (textLower.includes(daysOfWeek[i])) {
        foundDayIdx = i;
        break;
      }
    }

    if (foundDayIdx !== -1) {
      const currentDay = today.getDay();
      let daysToAdd = (foundDayIdx - currentDay + 7) % 7;
      if (daysToAdd === 0) {
        daysToAdd = 7; // Next week's same day
      }
      resultDate.setDate(today.getDate() + daysToAdd);
      resultDate.setHours(17, 0, 0, 0); // 5 PM
      label = daysOfWeek[foundDayIdx].charAt(0).toUpperCase() + daysOfWeek[foundDayIdx].slice(1);
    } else if (textLower.includes("tomorrow")) {
      resultDate.setDate(today.getDate() + 1);
      resultDate.setHours(17, 0, 0, 0);
      label = "Tomorrow";
    } else if (textLower.includes("today") || textLower.includes("tonight")) {
      resultDate.setHours(23, 59, 0, 0);
      label = "Today";
    } else {
      // Default fallback is tomorrow at 5:00 PM
      resultDate.setDate(today.getDate() + 1);
      resultDate.setHours(17, 0, 0, 0);
      label = "Tomorrow";
    }

    return {
      isoString: resultDate.toISOString().slice(0, 16),
      label
    };
  };

  // Master NLP voice command handler
  const handleVoiceCommand = (commandText: string) => {
    const textLower = commandText.toLowerCase().trim();
    if (!textLower) return;

    // Clean prefix fillers if present (increases conversational NLP efficiency)
    const prefixRegex = /^(please\s+)?(add|create|make|schedule|insert|todo|new|remind\s+me\s+to|remind\s+me|write\s+down|write|log|put|record|track)\s+/i;
    let titleDraft = commandText.replace(prefixRegex, "");

    // Get due date
    const { isoString: dueDate, label: dayLabel } = extractDueDate(textLower);

    // Strip relative date markers from the title
    const dateMarkers = [
      /due\s+on\s+\w+/i,
      /due\s+\w+/i,
      /by\s+\w+/i,
      /on\s+\w+/i,
      /due\s+tomorrow/i,
      /tomorrow/i,
      /due\s+today/i,
      /today/i,
      /tonight/i
    ];

    for (const marker of dateMarkers) {
      titleDraft = titleDraft.replace(marker, "");
    }

    // Clean punctuation
    titleDraft = titleDraft.replace(/[,.!?;:]/g, "").replace(/\s+/g, " ").trim();

    // If title becomes empty, fallback to the original commandText
    if (!titleDraft.trim()) {
      titleDraft = commandText.trim();
    }

    // Format title casing nicely
    const finalTitle = titleDraft
      ? titleDraft
          .split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      : "New Assignment Task";

    // Detect category
    let category: Task["category"] = "assignment";
    if (textLower.includes("bill") || textLower.includes("pay") || textLower.includes("rent") || textLower.includes("fees")) {
      category = "bill";
    } else if (textLower.includes("meeting") || textLower.includes("call") || textLower.includes("talk") || textLower.includes("zoom")) {
      category = "meeting";
    } else if (textLower.includes("interview") || textLower.includes("pitch") || textLower.includes("recruit")) {
      category = "interview";
    }

    // Detect importance level
    const importance: Task["importance"] = (textLower.includes("urgent") || textLower.includes("high") || textLower.includes("critical") || textLower.includes("asap")) ? "high" : "normal";

    // Detect duration
    let estimatedTime = 45;
    const timeMatch = textLower.match(/(\d+)\s*(min|hour|hr)/);
    if (timeMatch) {
      const value = parseInt(timeMatch[1], 10);
      const unit = timeMatch[2];
      estimatedTime = (unit.startsWith("hour") || unit.startsWith("hr")) ? value * 60 : value;
    }

    // Create new task object
    const createdTask: Task = {
      id: "voice-created-" + Date.now().toString(36),
      title: finalTitle,
      dueDate,
      importance,
      estimatedTime,
      notes: `Automatically created by Lumina Voice Assistant from vocal command: "${commandText}"`,
      completed: false,
      category
    };

    // Add task to array
    const newTasks = [...tasks, createdTask];
    onTasksChange(newTasks);
    setLastCreatedTask(createdTask);
    setStatusMessage("Commitment successfully created!");

    // Play vocal confirmation
    speakText(`Successfully added ${finalTitle} due on ${dayLabel} to your schedule.`);
  };

  const handleMicToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!recognition) {
      setErrorMessage("Microphone recognition is not fully configured on this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setErrorMessage("");
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to trigger start on recognition:", err);
      }
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    safeLocalStorage.setItem("voice_assistant_muted", nextMute ? "true" : "false");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setTranscript(manualInput);
    handleVoiceCommand(manualInput);
    setManualInput("");
  };

  return (
    <div className={isControlled ? "" : `fixed bottom-24 right-6 z-40 ${className}`}>
      {/* Floating Toggle Button */}
      {!isControlled && (
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setErrorMessage("");
          }}
          id="btn-voice-assistant-toggle"
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 relative border cursor-pointer hover:scale-105 active:scale-95 ${
            isOpen
              ? "bg-slate-900 border-slate-700 text-indigo-400"
              : "bg-gradient-to-tr from-indigo-650 to-violet-650 border-indigo-500 text-white hover:shadow-indigo-500/20"
          }`}
          title="Lumina Voice Assistant"
        >
          <span className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping opacity-40"></span>
          <Mic className="w-5 h-5 relative z-10 shrink-0" />
          {isListening && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-550 border-2 border-slate-950 rounded-full animate-pulse"></span>
          )}
        </button>
      )}

      {/* Expandable Assistant Card */}
      {isOpen && (
        <div
          id="panel-voice-assistant"
          className={isControlled 
            ? "fixed bottom-6 right-6 md:bottom-8 md:right-8 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 text-left animate-fade-in z-50"
            : "absolute bottom-16 right-0 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 text-left animate-fade-in z-50"
          }
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-950 text-indigo-400 rounded-lg">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </span>
              <div>
                <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                  Lumina Voice Assistant
                </h4>
                <p className="text-[10px] text-indigo-400 font-bold">
                  AUTONOMOUS VOICE-NLP ENGINE
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Close Panel Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice sound waves indicator */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
            {isListening ? (
              /* Live Waveform */
              <div className="flex items-center gap-1 h-8">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 5, 2, 4].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-indigo-500 rounded-full animate-pulse"
                    style={{
                      height: `${h * 5}px`,
                      animationDelay: `${i * 100}ms`
                    }}
                  ></span>
                ))}
              </div>
            ) : (
              /* Mic Status Display */
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Mic className="w-4 h-4" />
              </div>
            )}

            <span className="text-[11px] font-semibold text-slate-350 text-center block">
              {statusMessage}
            </span>
          </div>

          {/* Transcript Output Box */}
          {transcript && (
            <div className="bg-slate-950/60 p-3.5 border border-slate-850 rounded-xl space-y-1 relative">
              <button
                type="button"
                onClick={() => setTranscript("")}
                className="absolute top-2.5 right-2.5 p-1 text-slate-500 hover:text-slate-350 transition cursor-pointer"
                title="Clear transcript"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold pr-6">
                Spoken Input Recognized
              </span>
              <p className="text-xs text-slate-200 italic font-medium leading-relaxed pr-6">
                "{transcript}"
              </p>
            </div>
          )}

          {/* Task feedback box */}
          {lastCreatedTask && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2 relative">
              <button
                type="button"
                onClick={() => setLastCreatedTask(null)}
                className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 pr-6">
                <Check className="w-4 h-4 text-emerald-400" />
                Autonomously Logged!
              </div>
              <div className="space-y-1 pr-6">
                <p className="text-xs font-bold text-white leading-snug">
                  {lastCreatedTask.title}
                </p>
                <div className="flex items-center gap-2.5 text-[9.5px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Due Friday (June 26)
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    {lastCreatedTask.estimatedTime} mins
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions Pill list */}
          <div className="space-y-1.5 text-left text-slate-450">
            <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              General Voice Engine
            </span>
            <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl text-[11px] text-slate-400 italic leading-relaxed">
              "Lumina now understands <strong>any</strong> spoken instruction! Simply speak your task (e.g. <em>'Prepare for DSA test tomorrow'</em> or <em>'Finish reading assignment'</em>), and it will be captured instantly."
            </div>
          </div>

          {/* Action Trigger Block */}
          <div className="flex gap-2">
            <button
              onClick={handleMicToggle}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-550 border-rose-600 text-white animate-pulse"
                  : "bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 fill-white" />
                  Initiate Vocal Input
                </>
              )}
            </button>
          </div>

          {/* Manual Input typing support */}
          <form onSubmit={handleManualSubmit} className="flex gap-1.5 border-t border-slate-850 pt-3">
            <input
              type="text"
              placeholder="Or type voice command directly..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-[11px] font-bold rounded-lg border border-slate-700 transition cursor-pointer disabled:opacity-45"
            >
              Run
            </button>
          </form>

          {/* Error Message Indicator */}
          {errorMessage && (
            <div className="bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg flex items-center gap-1.5 text-[10px] text-rose-350">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
