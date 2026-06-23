import React, { useState, useEffect } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VoiceInput({ onTranscript, placeholder = "Listening...", className = "" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    try {
      // Check browser compatibility safely
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
          setErrorMsg("");
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText) {
            onTranscript(resultText);
          }
          setIsListening(false);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setErrorMsg("Permission blocked. Please allow microphone access.");
          } else {
            setErrorMsg(`Error: ${event.error}`);
          }
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    } catch (err) {
      console.warn("SpeechRecognition is restricted or unsupported in this sandbox:", err);
    }
  }, [onTranscript]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recognition) {
      setErrorMsg("Web Speech API is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setErrorMsg("");
      try {
        recognition.start();
      } catch (err: any) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  if (!recognition) return null;

  return (
    <div className={`relative flex items-center ${className}`}>
      <button
        onClick={toggleListening}
        type="button"
        className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
          isListening
            ? "bg-rose-550 border-rose-600 text-white animate-pulse"
            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-750"
        }`}
        title={isListening ? "Stop listening" : "Start voice dictation"}
      >
        {isListening ? (
          <MicOff className="w-4 h-4 shrink-0" />
        ) : (
          <Mic className="w-4 h-4 shrink-0" />
        )}
      </button>

      {isListening && (
        <span className="absolute left-10 ml-2 text-[10px] font-black text-rose-600 dark:text-rose-400 animate-pulse bg-rose-50/80 dark:bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900 z-10 whitespace-nowrap">
          ● {placeholder}
        </span>
      )}

      {errorMsg && (
        <div className="absolute top-10 right-0 mt-1 bg-rose-50 dark:bg-rose-950/95 border border-rose-150 dark:border-rose-900/50 text-rose-850 dark:text-rose-200 p-2 rounded-lg text-[9.5px] font-semibold flex items-center gap-1 shadow-md z-30 max-w-[220px]">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto text-rose-400 dark:text-rose-350 hover:text-rose-700 dark:hover:text-rose-100 font-bold">×</button>
        </div>
      )}
    </div>
  );
}
