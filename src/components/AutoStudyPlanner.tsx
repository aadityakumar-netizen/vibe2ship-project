import React, { useState, useEffect } from "react";
import { Task } from "../types";
import {
  BrainCircuit,
  Sparkles,
  BookOpen,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Award,
  Volume2,
  VolumeX,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  PlusCircle,
  Timer,
} from "lucide-react";
import VoiceInput from "./VoiceInput";

interface AutoStudyPlannerProps {
  tasks: Task[];
  onAddTask: (
    title: string,
    duration: number,
    importance: "high" | "normal",
  ) => void;
}

interface StudySession {
  time: string;
  type: "study" | "break";
  duration: number;
  focusTopic: string;
  activeTechnique: string;
}

interface StudyDayPlan {
  dayNumber: number;
  title: string;
  topics: string[];
  technique: string;
  durationMinutes: number;
}

interface StudyBlueprint {
  subjectName: string;
  styleOverview: string;
  planType: "single" | "multi";
  sessions?: StudySession[];
  multiDayPlan?: StudyDayPlan[];
  milestones: string[];
}

export default function AutoStudyPlanner({
  tasks,
  onAddTask,
}: AutoStudyPlannerProps) {
  const [studySubject, setStudySubject] = useState("");
  const [studyProfile, setStudyProfile] = useState("Pomodoro (25/5)");
  const [cognitiveStyle, setCognitiveStyle] = useState("Active Recall");
  const [availableHours, setAvailableHours] = useState(2);
  const [blueprint, setBlueprint] = useState<StudyBlueprint | null>(null);
  const [planType, setPlanType] = useState<"single" | "multi">("single");
  const [targetDays, setTargetDays] = useState(10);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto-detect multi-day study keywords
  useEffect(() => {
    const match = studySubject.match(/(\d+)\s*days?/i);
    if (match) {
      setPlanType("multi");
      const dNum = parseInt(match[1], 10);
      if (dNum >= 1 && dNum <= 30) {
        setTargetDays(dNum);
      }
    }
  }, [studySubject]);

  // Timer states
  const [activeSessionIdx, setActiveSessionIdx] = useState<number>(-1);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Load from tasks helpers
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Safely speak text in sandboxed iframe environments
  const speakVoiceNotification = (text: string) => {
    if (!soundEnabled) return;
    try {
      if (typeof window === "undefined") return;

      let hasSpeech = false;
      try {
        hasSpeech =
          "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
      } catch (_) {}

      if (!hasSpeech) return;

      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const UtteranceClass = (window as any).SpeechSynthesisUtterance;
      if (!UtteranceClass) return;
      const utterance = new UtteranceClass(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      synth.speak(utterance);
    } catch (e) {
      console.log("SpeechSynthesis blocked or restricted:", e);
    }
  };

  const generateBlueprint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studySubject.trim()) return;

    setIsLoading(true);
    setIsTimerRunning(false);
    setActiveSessionIdx(-1);

    try {
      const response = await fetch("/api/gemini/study-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studySubject,
          studyProfile,
          cognitiveStyle,
          availableHours,
          planType,
          targetDays,
        }),
      });
      const data = await response.json();
      if (data) {
        setBlueprint(data);
        setCompletedDays([]);
        if (data.planType === "single" && data.sessions && data.sessions.length > 0) {
          setActiveSessionIdx(0);
          setTimeLeft(data.sessions[0].duration * 60);
          speakVoiceNotification(
            `Lumina Study Planner has calibrated your session blueprint for ${data.subjectName}. Ready to launch!`,
          );
        } else if (data.planType === "multi" && data.multiDayPlan) {
          speakVoiceNotification(
            `Lumina Study Planner has calibrated an autonomous ${data.multiDayPlan.length}-day preparatory roadmap for ${data.subjectName}!`,
          );
        }
      }
    } catch (err) {
      console.error("Blueprint compilation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false);
      // Trigger end of segment notification
      if (blueprint && activeSessionIdx !== -1) {
        const finishedSession = blueprint.sessions[activeSessionIdx];
        const nextIdx = activeSessionIdx + 1;

        if (nextIdx < blueprint.sessions.length) {
          const nextSession = blueprint.sessions[nextIdx];
          const typeStr =
            nextSession.type === "study" ? "study focus" : "rest and recovery";
          speakVoiceNotification(
            `Segment finished. Time to transition to your ${typeStr} block: ${nextSession.focusTopic}`,
          );
          setActiveSessionIdx(nextIdx);
          setTimeLeft(nextSession.duration * 60);
          setIsTimerRunning(true);
        } else {
          speakVoiceNotification(
            "Outstanding job! You have fully completed this customized study blueprint sprint.",
          );
          setActiveSessionIdx(-1);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, blueprint, activeSessionIdx]);

  const handleStartTimer = () => {
    if (activeSessionIdx === -1 && blueprint && blueprint.sessions.length > 0) {
      setActiveSessionIdx(0);
      setTimeLeft(blueprint.sessions[0].duration * 60);
    }
    setIsTimerRunning(true);
    speakVoiceNotification("Sprint timer started. Let's keep total focus.");
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    speakVoiceNotification("Timer paused.");
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (blueprint && activeSessionIdx !== -1) {
      setTimeLeft(blueprint.sessions[activeSessionIdx].duration * 60);
    }
  };

  const handleSkipSession = () => {
    if (!blueprint) return;
    const nextIdx = activeSessionIdx + 1;
    if (nextIdx < blueprint.sessions.length) {
      setActiveSessionIdx(nextIdx);
      setTimeLeft(blueprint.sessions[nextIdx].duration * 60);
      setIsTimerRunning(false);
      speakVoiceNotification(
        `Skipped to ${blueprint.sessions[nextIdx].focusTopic}`,
      );
    } else {
      setActiveSessionIdx(-1);
      setIsTimerRunning(false);
    }
  };

  const selectTaskAsSubject = (title: string, estimatedMinutes: number) => {
    setStudySubject(title);
    // Auto scale available hours based on estimated minutes
    const hours = Math.max(1, Math.min(4, Math.ceil(estimatedMinutes / 60)));
    setAvailableHours(hours);
  };

  const formatTimerString = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div id="study-planner-section" className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base flex items-center gap-1.5">
            <BrainCircuit className="w-5 h-5 text-emerald-500 animate-pulse" />
            AI Cognitive Study & Work Planner
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Structure high-intensity learning, research, or coding sprints
            backed by premium cognitive recall profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              speakVoiceNotification(
                soundEnabled ? "" : "Voice guidance activated!",
              );
            }}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              soundEnabled
                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-850 text-indigo-650 dark:text-indigo-400"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
            }`}
            title={
              soundEnabled
                ? "Disable voice notifications"
                : "Enable voice notifications"
            }
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Setup Forms & Active Tasks */}
        <div className="lg:col-span-4 space-y-5">
          {/* Blueprint Compiler Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Configure Study Sprint
            </h4>

            <form onSubmit={generateBlueprint} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Subject or Focus Objective
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. Organic Chemistry, Quantum Physics, React Refactor"
                    value={studySubject}
                    onChange={(e) => setStudySubject(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <VoiceInput
                    onTranscript={(text) => setStudySubject(text)}
                    placeholder="Subject dictation..."
                  />
                </div>
              </div>

              {/* Plan Type Selector Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Planning Mode
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-250/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPlanType("single")}
                    className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all duration-155 cursor-pointer ${
                      planType === "single"
                        ? "bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-800"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                    }`}
                  >
                    Focus Block
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanType("multi")}
                    className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all duration-155 cursor-pointer ${
                      planType === "multi"
                        ? "bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-800"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                    }`}
                  >
                    Prep Journey
                  </button>
                </div>
              </div>

              {planType === "single" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      Sprint Profile
                    </label>
                    <select
                      value={studyProfile}
                      onChange={(e) => setStudyProfile(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    >
                      <option
                        className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        value="Pomodoro (25/5)"
                      >
                        🍅 Pomodoro (25 min Focus / 5 min Rest)
                      </option>
                      <option
                        className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        value="Deep-Focus (50/10)"
                      >
                        🧠 Deep Focus (50 min Focus / 10 min Rest)
                      </option>
                      <option
                        className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        value="Ultradian (90/20)"
                      >
                        📊 Ultradian (90 min Focus / 20 min Rest)
                      </option>
                      <option
                        className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        value="Immersion"
                      >
                        🏊 Double Block (110 min Focus / 10 min Rest)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      Available Time Frame
                    </label>
                    <select
                      value={availableHours}
                      onChange={(e) => setAvailableHours(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    >
                      {[1, 2, 3, 4, 5].map((h) => (
                        <option
                          className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                          key={h}
                          value={h}
                        >
                          {h} Hour{h > 1 ? "s" : ""} Total Study
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Preparation Horizon
                  </label>
                  <select
                    value={targetDays}
                    onChange={(e) => setTargetDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  >
                    {[5, 7, 10, 14, 21, 30].map((d) => (
                      <option
                        className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        key={d}
                        value={d}
                      >
                        {d} Days Blueprint (Autonomous Planner)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Cognitive Learning Style
                </label>
                <select
                  value={cognitiveStyle}
                  onChange={(e) => setCognitiveStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                >
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="Feynman Technique"
                  >
                    💬 Feynman Method (Explain to a child)
                  </option>
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="Active Recall"
                  >
                    💡 Active Recall & Mental Retrieval Sprints
                  </option>
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="Creative Mind-mapping"
                  >
                    🗺️ Creative Mind-mapping & Synthesis
                  </option>
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="Exam Practice"
                  >
                    📝 High-Speed Mock Exam Problem-Solving
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!studySubject.trim() || isLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
                    <span>Calibrating learning style...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>Generate AI Study Blueprint</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick-import from pending tasks */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Load From Agenda Queue
            </h5>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {pendingTasks.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-2 text-center">
                  No outstanding tasks in queue.
                </p>
              ) : (
                pendingTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      selectTaskAsSubject(t.title, t.estimatedTime)
                    }
                    className="w-full text-left p-2.5 bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 rounded-xl transition flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 group cursor-pointer"
                  >
                    <span className="truncate max-w-[160px]">{t.title}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 shrink-0">
                      {t.estimatedTime}m
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-all ml-0.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Active Timer Dashboard & Generated Blueprint */}
        <div className="lg:col-span-8 space-y-6">
          {blueprint ? (
            blueprint.planType === "multi" ? (
              /* Render Multi-Day Prep Journey */
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 dark:border-slate-800 shadow-xl space-y-6 relative overflow-hidden text-left">
                {/* Abstract decorative ambient backing */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>

                {/* Header Info */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 self-start w-fit">
                      <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                      AUTONOMOUS MULTI-DAY PLANNER
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-2 tracking-tight text-left">
                      {blueprint.subjectName}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed text-left">
                      {blueprint.styleOverview}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black font-mono tracking-tight text-white block">
                      {blueprint.multiDayPlan?.length || 0} Days
                    </span>
                    <span className="text-[9.5px] text-indigo-450 font-bold uppercase tracking-wider block mt-0.5">
                      Total Prep Scope
                    </span>
                  </div>
                </div>

                {/* Multi-Day timeline cards */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Day-by-Day Preparation Roadmap
                  </h4>
                  
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {blueprint.multiDayPlan?.map((day, idx) => {
                      const isCompleted = completedDays.includes(day.dayNumber);
                      return (
                        <div
                          key={idx}
                          className={`p-4 border rounded-2xl transition-all duration-200 text-left ${
                            isCompleted
                              ? "bg-emerald-950/20 border-emerald-900/60 text-slate-350 opacity-75"
                              : "bg-slate-800/40 border-slate-750 hover:border-slate-700 text-white"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3 text-left">
                              {/* Complete check trigger */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCompleted) {
                                    setCompletedDays(completedDays.filter(d => d !== day.dayNumber));
                                    speakVoiceNotification(`Marked Day ${day.dayNumber} as incomplete`);
                                  } else {
                                    setCompletedDays([...completedDays, day.dayNumber]);
                                    speakVoiceNotification(`Outstanding! Day ${day.dayNumber} study block complete! Keep pushing forward.`);
                                  }
                                }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all border cursor-pointer mt-0.5 ${
                                  isCompleted
                                    ? "bg-emerald-600 border-emerald-500 text-white animate-bounce"
                                    : "bg-slate-800 border-slate-700 hover:border-indigo-500 text-slate-450 hover:text-white"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <span className="text-[10px] font-black">{day.dayNumber}</span>
                                )}
                              </button>

                              <div className="space-y-1.5 text-left">
                                <h5 className={`text-sm font-extrabold flex items-center gap-2 ${isCompleted ? "line-through text-slate-500" : "text-white"}`}>
                                  {day.title}
                                </h5>
                                
                                {/* Topics row */}
                                <div className="flex flex-wrap gap-1">
                                  {day.topics.map((t, tIdx) => (
                                    <span key={tIdx} className="text-[9.5px] bg-slate-900/80 border border-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded-md">
                                      {t}
                                    </span>
                                  ))}
                                </div>

                                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                                  <strong className="text-indigo-400">Recall Exercise:</strong> {day.technique}
                                </p>
                              </div>
                            </div>

                            {/* Actions / Info */}
                            <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 border-t border-slate-800 sm:border-0 pt-2 sm:pt-0">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md">
                                {day.durationMinutes} mins
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  // Switch to focus sprint
                                  setStudySubject(`${blueprint.subjectName} - Day ${day.dayNumber}: ${day.title.replace(/^Day \d+:\s*/i, "")}`);
                                  setPlanType("single");
                                  // Auto set style
                                  speakVoiceNotification(`Loading focus session for Day ${day.dayNumber}: ${day.title}`);
                                  // Trigger generate
                                  setTimeout(() => {
                                    const mockEvent = { preventDefault: () => {} } as React.FormEvent;
                                    generateBlueprint(mockEvent);
                                  }, 100);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap"
                                title="Instantly compile a deep focus Pomodoro segment for this day's content"
                              >
                                <Play className="w-3 h-3 fill-white" />
                                Launch Focus Block
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Autonomous Roadmap Progress
                    </span>
                    <p className="text-xs text-slate-350">
                      You have completed <strong className="text-emerald-400">{completedDays.length}</strong> of <strong className="text-white">{blueprint.multiDayPlan?.length || 0}</strong> days.
                    </p>
                  </div>

                  <div className="w-full sm:w-1/2 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${((completedDays.length) / (blueprint.multiDayPlan?.length || 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Milestones cards */}
                {blueprint.milestones && blueprint.milestones.length > 0 && (
                  <div className="border-t border-slate-800 pt-4 space-y-2.5 text-left">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-400" />
                      Milestones to Victory
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {blueprint.milestones.map((milestone, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-800/40 border border-slate-750 rounded-xl"
                        >
                          <span className="text-[9px] text-amber-400 font-black block uppercase mb-1">
                            Target Phase 0{idx + 1}
                          </span>
                          <p className="text-[10.5px] font-semibold text-slate-200 leading-snug">
                            {milestone}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeSessionIdx !== -1 ? (
              /* Original Active Timer Dashboard */
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 dark:border-slate-800 shadow-xl space-y-6 relative overflow-hidden text-left">
                {/* Abstract decorative ambient backing */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>

                {/* Header Info */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div className="text-left">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest w-fit block">
                      ACTIVE SPRINT BOARD
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-1.5 tracking-tight text-left">
                      {blueprint.subjectName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 text-left">
                      {blueprint.styleOverview}
                    </p>
                  </div>

                  {/* Visual Timer Display */}
                  <div className="text-right">
                    <div className="text-3xl font-black font-mono tracking-tight text-white flex items-center justify-end gap-1.5">
                      <Timer className="w-6 h-6 text-indigo-400 shrink-0" />
                      {formatTimerString(timeLeft)}
                    </div>
                    <span className="text-[9.5px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5 block">
                      Session {activeSessionIdx + 1} of{" "}
                      {blueprint.sessions?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Current Active Step Box */}
                {blueprint.sessions && blueprint.sessions[activeSessionIdx] && (
                  <div className="bg-slate-800/60 border border-slate-700 p-5 rounded-2xl space-y-3.5 text-left">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            blueprint.sessions[activeSessionIdx].type === "study"
                              ? "bg-indigo-500 animate-pulse"
                              : "bg-emerald-500 animate-pulse"
                          }`}
                        ></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Current:{" "}
                          {blueprint.sessions[activeSessionIdx].type === "study"
                            ? "Focus Sprint"
                            : "Recharging Interval"}
                        </span>
                      </div>
                      <span className="text-[10px] bg-slate-700 text-slate-200 font-mono px-2 py-0.5 rounded-md font-bold">
                        {blueprint.sessions[activeSessionIdx].duration} Minutes
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-white leading-snug text-left">
                        {blueprint.sessions[activeSessionIdx].focusTopic}
                      </h4>
                      <p className="text-xs text-slate-400 leading-normal text-left">
                        <strong className="text-indigo-400">Methodology:</strong>{" "}
                        {blueprint.sessions[activeSessionIdx].activeTechnique}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          blueprint.sessions[activeSessionIdx].type === "study"
                            ? "bg-indigo-500"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${((blueprint.sessions[activeSessionIdx].duration * 60 - timeLeft) / (blueprint.sessions[activeSessionIdx].duration * 60)) * 100}%`,
                        }}
                      ></div>
                    </div>

                    {/* Timer Controls bar */}
                    <div className="flex gap-3 justify-center pt-2">
                      <button
                        onClick={handleResetTimer}
                        className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                        title="Reset timer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {isTimerRunning ? (
                        <button
                          onClick={handlePauseTimer}
                          className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <Pause className="w-4 h-4 fill-slate-950" />
                          Pause Sprint
                        </button>
                      ) : (
                        <button
                          onClick={handleStartTimer}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs shadow-md"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          Initiate Focus
                        </button>
                      )}

                      <button
                        onClick={handleSkipSession}
                        className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Skip to next segment"
                      >
                        <span>Skip</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Entire Program Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">
                    Custom Sprint Blueprint segments
                  </h4>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {blueprint.sessions?.map((session, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 border rounded-2xl flex items-center justify-between transition-all ${
                          idx === activeSessionIdx
                            ? "bg-indigo-950/40 border-indigo-500/60 text-white"
                            : idx < activeSessionIdx
                              ? "bg-slate-800/30 border-slate-800/40 opacity-40 text-slate-500"
                              : "bg-slate-800/30 border-slate-800/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              idx === activeSessionIdx
                                ? "bg-indigo-600 text-white"
                                : idx < activeSessionIdx
                                  ? "bg-slate-800 text-slate-600"
                                  : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {idx < activeSessionIdx ? (
                              <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                              idx + 1
                            )}
                          </span>
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span className="capitalize">
                                {session.type} block
                              </span>
                              <span className="text-[9.5px] text-slate-500 font-mono">
                                {session.time}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed mt-0.5 line-clamp-1">
                              {session.focusTopic}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 pr-1">
                          {session.duration} mins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestones cards */}
                {blueprint.milestones && blueprint.milestones.length > 0 && (
                  <div className="border-t border-slate-800 pt-4 space-y-2.5 text-left">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-400" />
                      Focus Milestones
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {blueprint.milestones.map((milestone, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-800/40 border border-slate-700 rounded-xl"
                        >
                          <span className="text-[9px] text-amber-400 font-black block uppercase mb-1">
                            Target 0{idx + 1}
                          </span>
                          <p className="text-[10.5px] font-semibold text-slate-200 leading-snug">
                            {milestone}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ActiveSessionIdx is -1 or empty */
              <div className="bg-white/80 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-500 dark:text-emerald-400 animate-pulse border border-emerald-100 dark:border-emerald-900/40">
                  <BrainCircuit className="w-10 h-10" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    No active study block loaded
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    Select a Prep Journey day above and click <strong className="text-indigo-650 dark:text-indigo-400">"Launch Focus Block"</strong>, or configure a Single-Session Sprint on the left.
                  </p>
                </div>
              </div>
            )
          ) : (
            /* Prompt to compile blueprint */
            <div className="bg-white/80 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-500 dark:text-emerald-400 animate-pulse border border-emerald-100 dark:border-emerald-900/40">
                <BrainCircuit className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  No active Study Blueprint compiled
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed text-center">
                  Enter your study subject on the left (e.g. <strong className="text-indigo-655 dark:text-indigo-400">"AKTU DSA exam in 10 days"</strong>), or import an agenda task, and click{" "}
                  <strong className="text-emerald-600 dark:text-emerald-450">
                    "Generate AI Study Blueprint"
                  </strong>{" "}
                  to have Lumina custom-design your learning flow.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
