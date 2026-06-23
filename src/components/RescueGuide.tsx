import React, { useState, useEffect, useRef } from "react";
import { ActiveRescue, Task, RescueStep } from "../types";
import { 
  Play, 
  Pause, 
  SkipForward, 
  StopCircle, 
  CheckCircle2, 
  Brain, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Volume2,
  VolumeX,
  Sparkles,
  Smile,
  LogOut,
  Clock
} from "lucide-react";

interface RescueGuideProps {
  activeRescue: ActiveRescue;
  onUpdateRescue: (rescue: ActiveRescue) => void;
  onExitRescue: (completed: boolean) => void;
}

export default function RescueGuide({
  activeRescue,
  onUpdateRescue,
  onExitRescue,
}: RescueGuideProps) {
  const { task, steps, currentStepIndex, timeRemaining, isRunning } = activeRescue;
  const currentStep = steps[currentStepIndex];
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Timer Reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger web voice text speech
  const speakText = (text: string) => {
    if (!soundEnabled) return;
    try {
      if (typeof window === "undefined") return;
      let hasSpeech = false;
      try {
        hasSpeech = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
      } catch (_) {}
      
      if (!hasSpeech) return;
      
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const UtteranceClass = (window as any).SpeechSynthesisUtterance;
      if (!UtteranceClass) return;
      const utterance = new UtteranceClass(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      synth.speak(utterance);
    } catch (e) {
      console.log("SpeechSynthesis is restricted or unsupported in this sandboxed environment:", e);
    }
  };

  // On Step Change, speak instruction
  useEffect(() => {
    if (currentStep) {
      speakText(`Step ${currentStepIndex + 1}: ${currentStep.title}. Mantra to focus: ${currentStep.mentalFocus}`);
    }
  }, [currentStepIndex]);

  // Main countdown logical effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (timeRemaining > 0) {
          onUpdateRescue({
            ...activeRescue,
            timeRemaining: timeRemaining - 1
          });
        } else {
          // Play buzzer, progress to next step automatically
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const ctx = new AudioContextClass();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(520, ctx.currentTime);
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              osc.start();
              osc.stop(ctx.currentTime + 0.3);
            }
          } catch (e) {}

          if (currentStepIndex < steps.length - 1) {
            const nextIdx = currentStepIndex + 1;
            speakText(`Great progress! Moving on to Step ${nextIdx + 1}: ${steps[nextIdx].title}`);
            onUpdateRescue({
              ...activeRescue,
              currentStepIndex: nextIdx,
              timeRemaining: steps[nextIdx].duration * 60,
              isRunning: true // keep running next block
            });
          } else {
            // End of plan reached
            speakText("Phenomenal work! You have finished all steps. Time to submit!");
            onUpdateRescue({
              ...activeRescue,
              isRunning: false,
              timeRemaining: 0
            });
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeRemaining, currentStepIndex]);

  const toggleTimer = () => {
    onUpdateRescue({
      ...activeRescue,
      isRunning: !isRunning
    });
  };

  const skipStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      onUpdateRescue({
        ...activeRescue,
        currentStepIndex: nextIdx,
        timeRemaining: steps[nextIdx].duration * 60,
        isRunning
      });
    } else {
      // Completed last step
      onUpdateRescue({
        ...activeRescue,
        isRunning: false,
        timeRemaining: 0
      });
    }
  };

  const finishTaskNow = () => {
    onExitRescue(true);
  };

  const quitRescue = () => {
    onExitRescue(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
  };

  // Calculations for step indicators and visual cues
  const progressRatio = currentStep 
    ? (currentStep.duration * 60 - timeRemaining) / (currentStep.duration * 60)
    : 1;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left pane: Active visual timer clock */}
        <div className="md:w-5/12 bg-slate-900 text-white p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
          
          {/* Top meta row */}
          <div className="w-full flex justify-between items-center z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/10">
              RESCUE ZONE ACTIVE
            </span>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition text-slate-300"
              title={soundEnabled ? "Disable AI voice cues" : "Enable AI voice cues"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Core high urgency timer progress visualization */}
          <div className="my-8 relative flex items-center justify-center">
            {/* Base SVG Ring */}
            <svg className="w-56 h-56 transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="95"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="112"
                cy="112"
                r="95"
                className="stroke-rose-500 transition-all duration-1000"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="596"
                strokeDashoffset={596 - (596 * (1 - progressRatio))}
                strokeLinecap="round"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-mono font-bold tracking-tight">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
                Block {currentStepIndex + 1} of {steps.length}
              </span>
              {isRunning ? (
                <span className="text-[9px] text-emerald-400 font-bold tracking-widest mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  LIVE ENGINE
                </span>
              ) : (
                <span className="text-[9px] text-amber-400 font-semibold tracking-widest mt-1.5">
                  IDLE MODE
                </span>
              )}
            </div>
          </div>

          {/* Lower focus mantra quote card */}
          <div className="w-full bg-white/5 border border-white/5 px-4 py-3.5 rounded-2xl">
            <span className="text-[9px] uppercase tracking-wider font-bold text-violet-400 block mb-1">
              Cognitive Mantra
            </span>
            <p className="font-medium text-slate-200 text-xs min-h-[32px] flex items-center justify-center">
              "{currentStep?.mentalFocus || "Just take the first physical step to break standard friction"}"
            </p>
          </div>

          {/* Left panel Footer */}
          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-4 mt-4 text-left">
            <div>
              <span className="block font-medium text-slate-300 truncate max-w-[200px]" title={task.title}>
                {task.title}
              </span>
              <span className="text-[10px]">Estimated: {task.estimatedTime} mins</span>
            </div>
            <button
              onClick={quitRescue}
              className="flex items-center gap-1 border border-white/10 hover:bg-white/5 px-2.5 py-1 rounded-lg transition"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              Exit Plan
            </button>
          </div>

        </div>

        {/* Right pane: Step breakdown checklists and actions */}
        <div className="md:w-7/12 p-8 flex flex-col justify-between overflow-y-auto">
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 mb-1">
                <Brain className="w-4 h-4" />
                Active Tactical Workroom
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-150">
                Action-Led Completion Strategy
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Friction-free, micro-steps suggested by cognitive sorting. Work only on the highlighted active step to avoid splitting attention.
              </p>
            </div>

            {/* Microstep interactive checklists */}
            <div className="space-y-3.5">
              {steps.map((st, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div
                    key={st.id}
                    className={`p-4 border rounded-2xl transition-all ${
                      isActive 
                        ? "bg-rose-50/55 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-sm" 
                        : isCompleted 
                        ? "bg-slate-50/50 dark:bg-slate-950/5 border-slate-100 dark:border-slate-850 opacity-60" 
                        : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-850 opacity-40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-[11px] font-bold">✓</span>
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                            isActive ? "border-rose-500 text-rose-600 bg-white dark:bg-slate-900" : "border-slate-300 dark:border-slate-750 text-slate-400 dark:text-slate-600"
                          }`}>
                            {index + 1}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-semibold ${
                            isActive ? "text-rose-900 dark:text-rose-200" : isCompleted ? "text-slate-600 dark:text-slate-400 line-through" : "text-slate-500 dark:text-slate-400"
                          }`}>
                            {st.title}
                          </h4>
                          <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                            isActive ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}>
                            {st.duration} mins
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                          {st.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Command controls bar below */}
          <div className="border-t border-slate-100 dark:border-slate-850 pt-6 mt-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={toggleTimer}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 cursor-pointer ${
                  isRunning 
                    ? "bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40" 
                    : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-100 dark:shadow-none"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-amber-800" />
                    Pause Plan
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Resume block
                  </>
                )}
              </button>

              <button
                onClick={skipStep}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
                Skip Step
              </button>
            </div>

            <button
              id="btn-rescue-complete"
              onClick={finishTaskNow}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100 dark:shadow-none cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              I'm Done! Submit Work
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
