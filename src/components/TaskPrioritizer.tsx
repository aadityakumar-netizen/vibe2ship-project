import React, { useState, useRef } from "react";
import { Task } from "../types";
import VoiceInput from "./VoiceInput";
import {
  Sparkles,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Circle,
  Clock,
  Grid2X2,
  ChevronRight,
  TrendingUp,
  Brain,
  Zap,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface TaskPrioritizerProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onStartRescue: (task: Task) => void;
  isAiLoading: boolean;
  setIsAiLoading: (loading: boolean) => void;
}

export default function TaskPrioritizer({
  tasks,
  onTasksChange,
  onStartRescue,
  isAiLoading,
  setIsAiLoading,
}: TaskPrioritizerProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  // Task input state
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [importance, setImportance] = useState<"high" | "normal">("high");
  const [estimatedTime, setEstimatedTime] = useState(45);
  const [category, setCategory] = useState<Task["category"]>("assignment");
  const [activeTab, setActiveTab] = useState<"list" | "matrix">(
    "list",
  );

  // AI prioritized details
  const [coachInsight, setCoachInsight] = useState<string>("");
  const [stressFactor, setStressFactor] = useState<number | null>(null);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    // Use selected date, or combine
    const newTask: Task = {
      id: "raw_" + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      notes: notes.trim(),
      dueDate,
      importance,
      estimatedTime: Number(estimatedTime) || 30,
      completed: false,
      category,
    };

    onTasksChange([...tasks, newTask]);

    // Reset form
    setTitle("");
    setNotes("");
    setDueDate("");
    setImportance("high");
    setEstimatedTime(45);
    setCategory("assignment");
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );
    onTasksChange(updated);
  };

  const deleteTask = (id: string) => {
    onTasksChange(tasks.filter((t) => t.id !== id));
  };

  const requestAiPrioritization = async () => {
    if (tasks.filter((t) => !t.completed).length === 0) return;
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/gemini/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: tasks.filter((t) => !t.completed) }),
      });
      const data = await response.json();
      if (data.prioritizedTasks) {
        // Merge AI scores back to main tasks list
        const updated = tasks.map((t) => {
          const matched = data.prioritizedTasks.find(
            (pt: any) => pt.id === t.id,
          );
          if (matched) {
            return {
              ...t,
              priorityScore: matched.priorityScore,
              quadrant: matched.quadrant,
              explanation: matched.explanation,
            };
          }
          return t;
        });
        onTasksChange(updated);
        setCoachInsight(data.coachInsight);
        setStressFactor(data.estimatedFrustrationFactor);
        setActiveTab("list");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Groups and values helper
  const getQuadrantColor = (q: number) => {
    switch (q) {
      case 1:
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/60";
      case 2:
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/60";
      case 3:
        return "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/60";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/60";
    }
  };

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Sorting for tabs
  const getSortedTasks = () => {
    if (activeTab === "list") {
      // If tasks have priorityScore, sort primarily by priorityScore desc
      if (activeTasks.some((t) => t.priorityScore !== undefined)) {
        return [...activeTasks].sort(
          (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0),
        );
      }
    }
    return activeTasks;
  };

  return (
    <div id="prioritizer-section" className="space-y-6">
      {/* Tab Switcher and Trigger UI with Professional Accent */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
          <button
            id="tab-btn-list"
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === "list"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Agenda Grid ({activeTasks.length})
          </button>
          <button
            id="tab-btn-matrix"
            onClick={() => {
              setActiveTab("matrix");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === "matrix"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <Grid2X2 className="w-3.5 h-3.5 text-blue-500" />
            Decision Matrix
          </button>
        </div>

        <button
          id="btn-ai-sort"
          onClick={requestAiPrioritization}
          disabled={activeTasks.length === 0 || isAiLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-55 cursor-pointer"
        >
          {isAiLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
              <span>Formulating Risk Matrix...</span>
            </>
          ) : (
            <>
              <Brain className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>AI Risk Evaluation</span>
            </>
          )}
        </button>
      </div>

      {stressFactor !== null && activeTab === "list" && (
        <div className="bg-slate-900 text-white border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 shadow-lg">
          <div className="flex items-start gap-4">
            <span className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0 flex items-center justify-center">
              <Zap className="w-5 h-5 animate-pulse" />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                  Companion Strategy Guidance
                </h4>
              </div>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed italic">
                "
                {coachInsight ||
                  "We've aligned your schedule to target the highest urgency threats first. Tackle your Top Priority to build sudden unstoppable momentum!"}
                "
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 px-5 py-3 rounded-lg min-w-[140px] shrink-0">
            <span className="text-indigo-400 font-extrabold text-3xl tracking-tight">
              {stressFactor}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Urgency Panic Rating
            </span>
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Add task form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5 h-fit sticky top-24">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-500 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
              Quick Deadline Logger
            </h3>
          </div>

          <form onSubmit={addTask} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                What's due?
              </label>
              <div className="flex gap-2 items-center">
                <input
                  id="input-task-title"
                  type="text"
                  required
                  placeholder="e.g. Physics homework, utility payment..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition font-medium bg-white dark:bg-slate-800 border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
                <VoiceInput
                  onTranscript={(text) =>
                    setTitle((prev) => (prev ? prev + " " + text : text))
                  }
                  placeholder="Listening for task..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Category
                </label>
                <select
                  id="select-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as Task["category"])
                  }
                  className="w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition font-medium bg-white dark:bg-slate-800 border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="assignment"
                  >
                    Assignment
                  </option>
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="meeting"
                  >
                    Meeting
                  </option>
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="bill"
                  >
                    Bill Payment
                  </option>
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="interview"
                  >
                    Interview
                  </option>
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="other"
                  >
                    Other
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Priority
                </label>
                <select
                  id="select-importance"
                  value={importance}
                  onChange={(e) =>
                    setImportance(e.target.value as "high" | "normal")
                  }
                  className="w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition font-medium bg-white dark:bg-slate-800 border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="high"
                  >
                    🔥 Essential
                  </option>
                  <option
                    className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    value="normal"
                  >
                    ☕ Optional / Normal
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Deadline Time
                </label>
                <div className="relative flex items-center group">
                  <span className="absolute left-3 text-indigo-500 dark:text-indigo-400 pointer-events-none flex items-center justify-center z-10">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  <input
                    id="input-due-date"
                    ref={dateInputRef}
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition font-medium bg-white dark:bg-slate-800 border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Est. Work Minutes
                </label>
                <input
                  id="input-est-time"
                  type="number"
                  min="5"
                  max="480"
                  required
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition font-medium bg-white dark:bg-slate-800 border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Support Details (Notes / Link)
              </label>
              <textarea
                id="input-task-notes"
                placeholder="e.g. Turn in to portal link; portal closes exactly at 5 PM."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition resize-none font-medium bg-white dark:bg-slate-800 border-slate-350 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              ></textarea>
            </div>

            <button
              id="btn-add-task"
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Save to Core Planner
            </button>
          </form>
        </div>

        {/* Right column / Center zone: Lists or Matrix */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "matrix" ? (
            /* Eisenhower Matrix Layout */
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
                  AI Calculated Decision Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Calculated automatically based on your deadlines, priority
                  markers, and estimated work burden.
                </p>
              </div>

              {/* 2x2 Grid display */}
              <div className="grid grid-cols-2 gap-4">
                {/* Quadrant 1 */}
                <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-4 rounded-xl min-h-[170px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        Q1: Do First (Urgent & Imp)
                      </span>
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {activeTasks
                        .filter(
                          (t) =>
                            t.quadrant === 1 ||
                            (!t.quadrant && t.importance === "high"),
                        )
                        .slice(0, 3)
                        .map((t) => (
                          <li
                            key={t.id}
                            className="truncate flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{t.title}</span>
                          </li>
                        ))}
                      {activeTasks.filter(
                        (t) =>
                          t.quadrant === 1 ||
                          (!t.quadrant && t.importance === "high"),
                      ).length === 0 && (
                        <span className="text-slate-400 dark:text-slate-500 italic">
                          Clear skies here!
                        </span>
                      )}
                    </ul>
                  </div>
                  {activeTasks.filter(
                    (t) =>
                      t.quadrant === 1 ||
                      (!t.quadrant && t.importance === "high"),
                  ).length > 0 && (
                    <div className="relative p-[1.5px] rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 shadow-md shadow-rose-950/30 hover:scale-[1.03] transition-all duration-300 self-start mt-2 shrink-0">
                      <button
                        onClick={() => {
                          const topTask = activeTasks.find(
                            (t) =>
                              t.quadrant === 1 ||
                              (!t.quadrant && t.importance === "high"),
                          );
                          if (topTask) onStartRescue(topTask);
                        }}
                        className="w-full min-w-[130px] h-[36px] px-3.5 bg-slate-900 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-bold rounded-[10.5px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Zap className="w-3.5 h-3.5 text-rose-500 group-hover:text-white shrink-0 fill-amber-300/30" />
                        Instant AI Rescue
                      </button>
                    </div>
                  )}
                </div>

                {/* Quadrant 2 */}
                <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-4 rounded-xl min-h-[170px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Q2: Schedule (Plan & Guard)
                      </span>
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {activeTasks
                        .filter(
                          (t) =>
                            t.quadrant === 2 ||
                            (!t.quadrant &&
                              t.importance === "normal" &&
                              !t.dueDate),
                        )
                        .slice(0, 3)
                        .map((t) => (
                          <li
                            key={t.id}
                            className="truncate flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{t.title}</span>
                          </li>
                        ))}
                      {activeTasks.filter(
                        (t) =>
                          t.quadrant === 2 ||
                          (!t.quadrant &&
                            t.importance === "normal" &&
                            !t.dueDate),
                      ).length === 0 && (
                        <span className="text-slate-400 dark:text-slate-500 italic">
                          No scheduled priorities parsed yet.
                        </span>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Quadrant 3 */}
                <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl min-h-[170px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        Q3: Delegate / Batch (Urgent but Normal)
                      </span>
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {activeTasks
                        .filter((t) => t.quadrant === 3)
                        .slice(0, 3)
                        .map((t) => (
                          <li
                            key={t.id}
                            className="truncate flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>{t.title}</span>
                          </li>
                        ))}
                      {activeTasks.filter((t) => t.quadrant === 3).length ===
                        0 && (
                        <span className="text-slate-400 dark:text-slate-500 italic">
                          No low-impact urgent stuff.
                        </span>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Quadrant 4 */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl min-h-[170px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Q4: Eliminate (Trivial Loops)
                      </span>
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {activeTasks
                        .filter((t) => t.quadrant === 4)
                        .slice(0, 3)
                        .map((t) => (
                          <li key={t.id} className="truncate list-disc pl-3">
                            <span>{t.title}</span>
                          </li>
                        ))}
                      {activeTasks.filter((t) => t.quadrant === 4).length ===
                        0 && (
                        <span className="text-slate-400 dark:text-slate-500 italic">
                          Clean matrix of fluff!
                        </span>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {!tasks.some((t) => t.quadrant) && (
                <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="text-center">
                    <Sparkles className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      No Quadrants calculated yet
                    </p>
                    <button
                      onClick={requestAiPrioritization}
                      disabled={activeTasks.length === 0 || isAiLoading}
                      className="mt-2 text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline cursor-pointer"
                    >
                      Click "AI Risk Evaluation" above to arrange tasks!
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Agenda List or Priority Matrix lists */
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                      {activeTasks.some((t) => t.priorityScore !== undefined)
                        ? "🧠 AI-Sequenced Focus Deck"
                        : "📋 Planned Commitments"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeTasks.some((t) => t.priorityScore !== undefined)
                        ? "Ordered by immediate systemic threat and energy depletion calculations. Tick checkboxes to mark accomplishment."
                        : "Your active tracking ledger. Tick checkboxes to mark accomplishment."}
                    </p>
                  </div>
                  {completedTasks.length > 0 && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md">
                      ✓ {completedTasks.length} Completed
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {getSortedTasks().length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                      <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        No active tasks logged
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Excellent job! Breathe or log an upcoming deadline.
                      </p>
                    </div>
                  ) : (
                    getSortedTasks().map((task) => {
                      const isOverdue =
                        new Date(task.dueDate).getTime() < new Date().getTime();
                      const timeString = new Date(
                        task.dueDate,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const dateString = new Date(
                        task.dueDate,
                      ).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <div
                          key={task.id}
                          className={`relative group p-4 border rounded-2xl transition-all shadow-sm ${
                            task.importance === "high"
                              ? "bg-rose-50/20 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/50 hover:border-rose-300/80 dark:hover:border-rose-850"
                              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300/80 dark:hover:border-slate-700"
                          }`}
                        >

                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <button
                                onClick={() => toggleTask(task.id)}
                                className="mt-1 transition hover:scale-115"
                              >
                                {task.completed ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-emerald-500 dark:hover:text-emerald-400 shrink-0" />
                                )}
                              </button>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4
                                    className={`font-semibold text-slate-900 dark:text-slate-100 text-sm ${task.completed ? "line-through text-slate-400 dark:text-slate-500" : ""}`}
                                  >
                                    {task.title}
                                  </h4>
                                  <span
                                    className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${
                                      task.category === "assignment"
                                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                                        : task.category === "meeting"
                                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                                          : task.category === "bill"
                                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                            : task.category === "interview"
                                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                              : "bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    {task.category}
                                  </span>
                                  {task.importance === "high" && (
                                    <span className="text-[10px] font-semibold bg-rose-500 text-white px-1.5 py-0.2 rounded">
                                      CRITICAL
                                    </span>
                                  )}
                                </div>
                                {task.notes && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal line-clamp-1">
                                    {task.notes}
                                  </p>
                                )}

                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  <div
                                    className={`flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ${isOverdue ? "text-rose-600 dark:text-rose-400 font-medium" : ""}`}
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                      {dateString} at {timeString}
                                      {isOverdue && " (Overdue!)"}
                                    </span>
                                  </div>
                                  <div className="text-slate-300 dark:text-slate-700">
                                    •
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {task.estimatedTime} mins required
                                  </div>
                                </div>

                                {task.delayRisk !== undefined && (
                                  <div className="mt-3 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/10 dark:bg-rose-950/10 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                      <span className="text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1 text-[9px] font-black">
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                                        AI Delay Slip Prediction
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tight ${
                                          task.delayRisk > 75
                                            ? "bg-red-100 text-red-800 animate-pulse"
                                            : task.delayRisk > 40
                                              ? "bg-amber-100 text-amber-800"
                                              : "bg-emerald-100 text-emerald-800"
                                        }`}
                                      >
                                        {task.delayRisk}% RISK INDEX
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          task.delayRisk > 75
                                            ? "bg-red-500"
                                            : task.delayRisk > 40
                                              ? "bg-amber-500"
                                              : "bg-emerald-500"
                                        }`}
                                        style={{ width: `${task.delayRisk}%` }}
                                      ></div>
                                    </div>
                                    {task.delayReasoning && (
                                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed italic font-medium">
                                        "Lumina Prediction:{" "}
                                        {task.delayReasoning}"
                                      </p>
                                    )}
                                  </div>
                                )}

                                {task.explanation && (
                                  <div className="mt-2.5 p-2.5 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100/60 dark:border-violet-900/40 rounded-xl flex items-start gap-1.5">
                                    <Brain className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                      {task.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Rescue CTA */}
                            <div className="flex items-center gap-1.5 self-center">
                              <div className="relative p-[1.5px] rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 shadow-lg shadow-rose-950/40 hover:scale-[1.03] transition-all duration-300 shrink-0">
                                <button
                                  onClick={() => onStartRescue(task)}
                                  className="w-full min-w-[130px] h-[36px] px-3.5 bg-slate-900 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-bold rounded-[10.5px] transition-all duration-200 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                                >
                                  <Zap className="w-3.5 h-3.5 text-rose-500 group-hover:text-white shrink-0 fill-amber-300/30" />
                                  Rescue Mode
                                </button>
                              </div>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Completed tasks slide if they exist & in common view */}
              {activeTab === "list" && completedTasks.length > 0 && (
                <div className="bg-slate-50/70 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Recently Rescued & Completed
                  </h4>
                  <div className="space-y-1.5">
                    {completedTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="line-through">{task.title}</span>
                        </div>
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
                        >
                          Undo
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
