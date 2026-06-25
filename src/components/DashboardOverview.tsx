import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Compass, 
  BrainCircuit, 
  Sparkles, 
  Bot, 
  Timer, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Flame, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  User as UserIcon,
  CheckCircle2
} from "lucide-react";
import { Task, Habit, SmartReminder, TimeBlock, User } from "../types";

interface DashboardOverviewProps {
  tasks: Task[];
  habits: Habit[];
  reminders: SmartReminder[];
  timeBlocks: TimeBlock[];
  currentUser: User | null;
  setActiveNavTab: (tab: "home" | "priorities" | "scheduler" | "habits" | "coach" | "study-planner") => void;
  onAddTask: (task: Omit<Task, "id" | "completed">) => void;
}

export default function DashboardOverview({
  tasks,
  habits,
  reminders,
  timeBlocks,
  currentUser,
  setActiveNavTab,
  onAddTask,
}: DashboardOverviewProps) {
  // Local quick-add form state
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDueDate, setQuickDueDate] = useState("");
  const [quickImportance, setQuickImportance] = useState<"high" | "normal">("high");
  const [quickEstTime, setQuickEstTime] = useState(45);
  const [quickCategory, setQuickCategory] = useState<Task["category"]>("assignment");

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const highPriorityTasks = activeTasks.filter((t) => t.importance === "high");
  const totalWorkMinutes = activeTasks.reduce((sum, t) => sum + t.estimatedTime, 0);

  // Calculate highest habit streak
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;
  const unreadRemindersCount = reminders.filter((r) => !r.isRead).length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickDueDate) return;

    onAddTask({
      title: quickTitle.trim(),
      dueDate: quickDueDate,
      importance: quickImportance,
      estimatedTime: Number(quickEstTime) || 30,
      notes: "Created instantly from the Main Dashboard Hub.",
      category: quickCategory,
    });

    // Reset quick add state
    setQuickTitle("");
    setQuickDueDate("");
    setQuickImportance("high");
    setQuickEstTime(45);
    setQuickCategory("assignment");
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/10">
              Live Control Hub
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 font-sans tracking-tight">
            Greetings, {currentUser?.name || "Academic Warrior"}!
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Welcome to your student nerve-center. Tackle impending deadlines, trigger micro-sprints, track streaks, and orchestrate time-blocks seamlessly.
          </p>
        </div>

        {/* Dynamic micro stats bar */}
        <div className="flex items-center gap-4 bg-slate-950/60 p-3 border border-slate-850 rounded-xl shrink-0">
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Completed</span>
            <span className="font-mono text-base font-extrabold text-emerald-400">{completedTasks.length}</span>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Remaining</span>
            <span className="font-mono text-base font-extrabold text-indigo-400">{activeTasks.length}</span>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Est. Load</span>
            <span className="font-mono text-base font-extrabold text-amber-400">
              {totalWorkMinutes > 60 ? `${Math.round(totalWorkMinutes / 60 * 10) / 10}h` : `${totalWorkMinutes}m`}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Live KPI widgets and Quick Add commitment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Dynamic KPIs & Quick view */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Operational Health Indicators</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* KPI 1 */}
            <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">Immediate Threat</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold font-mono text-rose-500 block">
                  {highPriorityTasks.length}
                </span>
                <span className="text-[9px] text-slate-500 leading-none">critical tasks pending</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">Habit Momentum</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold font-mono text-amber-500 block">
                  {maxStreak}
                </span>
                <span className="text-[9px] text-slate-500 leading-none">longest active streak</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">Time-Block Slots</span>
                <Timer className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold font-mono text-emerald-400 block">
                  {timeBlocks.length}
                </span>
                <span className="text-[9px] text-slate-500 leading-none">intervals mapped today</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">Smart Alerts</span>
                <AlertTriangle className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold font-mono text-indigo-500 block">
                  {unreadRemindersCount}
                </span>
                <span className="text-[9px] text-slate-500 leading-none">active risk notices</span>
              </div>
            </div>
          </div>

          {/* Quick-look next items */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4.5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Highest Urgency Stack</span>
              <button 
                onClick={() => setActiveNavTab("priorities")}
                className="text-[9.5px] text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                Go to Agenda <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {highPriorityTasks.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-[11px] italic">
                No high-urgency tasks found! Use the quick-add widget to insert a task.
              </div>
            ) : (
              <div className="space-y-2">
                {highPriorityTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex justify-between items-center p-2.5 bg-slate-950/60 border border-slate-850/60 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                      <span className="text-[11px] font-bold text-slate-200 truncate">{task.title}</span>
                    </div>
                    <span className="text-[9.5px] font-mono text-rose-400 bg-rose-950/30 border border-rose-900/30 px-2 py-0.5 rounded-md shrink-0">
                      Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Quick-Add Form */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Dashboard Fast-Track</span>
            <h4 className="font-bold text-slate-100 text-xs">Quickly Commit Task</h4>
          </div>

          <form onSubmit={handleQuickAdd} className="space-y-2.5">
            <div className="space-y-1">
              <input
                type="text"
                required
                placeholder="What assignment is hovering?"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-[11px] border border-slate-800 bg-slate-950 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={quickDueDate}
                  onChange={(e) => setQuickDueDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-[10px] border border-slate-800 bg-slate-950 text-slate-200 rounded-xl focus:outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Est. Minutes</label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  required
                  value={quickEstTime}
                  onChange={(e) => setQuickEstTime(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-[10px] border border-slate-800 bg-slate-950 text-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value as Task["category"])}
                  className="w-full px-2 py-1.5 text-[10px] border border-slate-800 bg-slate-950 text-slate-200 rounded-xl focus:outline-none cursor-pointer"
                >
                  <option value="assignment">Assignment</option>
                  <option value="meeting">Meeting</option>
                  <option value="bill">Bill/Fee</option>
                  <option value="interview">Interview</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Threat Rating</label>
                <div className="flex gap-1.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setQuickImportance("high")}
                    className={`flex-1 py-1 text-[9.5px] font-bold rounded-lg transition border ${
                      quickImportance === "high"
                        ? "bg-rose-950/40 text-rose-400 border-rose-800"
                        : "bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-850"
                    }`}
                  >
                    Urgent
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickImportance("normal")}
                    className={`flex-1 py-1 text-[9.5px] font-bold rounded-lg transition border ${
                      quickImportance === "normal"
                        ? "bg-slate-800 text-slate-200 border-slate-700"
                        : "bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-850"
                    }`}
                  >
                    Normal
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10.5px] font-extrabold transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register & Schedule</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
