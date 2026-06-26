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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-700 p-8 md:p-10 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-600/20 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/10">
              Live Control Hub
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-100 font-sans tracking-tight">
            Greetings, {currentUser?.name || "Academic Warrior"}!
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Welcome to your student nerve-center. Tackle impending deadlines, trigger micro-sprints, track streaks, and orchestrate time-blocks seamlessly.
          </p>
        </div>

        {/* Dynamic micro stats bar */}
        <div className="flex items-center gap-6 bg-slate-950/80 p-5 border border-slate-700 rounded-2xl shrink-0 relative z-10 w-full lg:w-auto justify-around lg:justify-start">
          <div className="text-center px-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Completed</span>
            <span className="font-mono text-2xl font-black text-emerald-400">{completedTasks.length}</span>
          </div>
          <div className="w-px h-12 bg-slate-700"></div>
          <div className="text-center px-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Remaining</span>
            <span className="font-mono text-2xl font-black text-indigo-400">{activeTasks.length}</span>
          </div>
          <div className="w-px h-12 bg-slate-700"></div>
          <div className="text-center px-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Est. Load</span>
            <span className="font-mono text-2xl font-black text-amber-400">
              {totalWorkMinutes > 60 ? `${Math.round(totalWorkMinutes / 60 * 10) / 10}h` : `${totalWorkMinutes}m`}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Health Indicators Grid (Expanded to Full-Width) */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Operational Health Indicators</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 hover:bg-slate-850/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Immediate Threat</span>
              <ShieldAlert className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-4">
              <span className="text-4xl font-black font-mono text-rose-550 block">
                {highPriorityTasks.length}
              </span>
              <span className="text-xs text-slate-400 leading-none">critical tasks pending</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 hover:bg-slate-850/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Habit Momentum</span>
              <Flame className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-4">
              <span className="text-4xl font-black font-mono text-amber-500 block">
                {maxStreak}
              </span>
              <span className="text-xs text-slate-400 leading-none">longest active streak</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 hover:bg-slate-850/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Time-Block Slots</span>
              <Timer className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-4">
              <span className="text-4xl font-black font-mono text-emerald-400 block">
                {timeBlocks.length}
              </span>
              <span className="text-xs text-slate-400 leading-none">intervals mapped today</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 hover:bg-slate-850/40 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Smart Alerts</span>
              <AlertTriangle className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-4">
              <span className="text-4xl font-black font-mono text-indigo-500 block">
                {unreadRemindersCount}
              </span>
              <span className="text-xs text-slate-400 leading-none">active risk notices</span>
            </div>
          </div>
        </div>
      </div>

      {/* Highest Urgency Stack (Now glorious and wide) */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-4 shadow-md">
        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
          <div className="space-y-1">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">Task Prioritization Panel</span>
            <h4 className="font-extrabold text-slate-100 text-lg">Highest Urgency Stack</h4>
          </div>
        </div>

        {highPriorityTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm italic">
            No high-urgency tasks found! All clear.
          </div>
        ) : (
          <div className="space-y-3">
            {highPriorityTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-700 rounded-xl transition duration-200 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse"></span>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-100 block truncate">{task.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">{task.category}</span>
                      <span className="text-[10px] text-slate-400">• {task.estimatedTime} mins estimated</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-rose-450 bg-rose-950/30 border border-rose-900/40 px-3 py-1 rounded-lg shrink-0 self-stretch sm:self-auto text-center">
                  Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
