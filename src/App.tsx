import React, { useState, useEffect } from "react";
import { safeLocalStorage } from "./utils/safeStorage";
import { Task, RescueStep, ActiveRescue, ChatMessage, TimeBlock, Habit, SmartReminder, User } from "./types";
import TaskPrioritizer from "./components/TaskPrioritizer";
import TimeBlockScheduler from "./components/TimeBlockScheduler";
import AutoStudyPlanner from "./components/AutoStudyPlanner";
import RescueGuide from "./components/RescueGuide";
import CompanionChat from "./components/CompanionChat";
import HabitTracker from "./components/HabitTracker";
import AuthScreen from "./components/AuthScreen";
import VoiceAssistant from "./components/VoiceAssistant";
import DashboardOverview from "./components/DashboardOverview";
import { 
  Zap, 
  Hourglass, 
  Sparkles, 
  Bot, 
  Compass, 
  CheckCircle, 
  BrainCircuit, 
  AlertOctagon,
  TrendingDown,
  Timer,
  Play,
  HeartHandshake,
  Bell,
  AlertTriangle,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  LayoutDashboard,
  ChevronDown,
  Menu,
  Home,
  Mic
} from "lucide-react";

const featureTabs = [
  {
    id: "priorities",
    name: "Agenda & Priorities",
    desc: "Map imminent threats, prioritize commitments, and review decision matrix.",
    icon: Compass,
    colorClass: "text-indigo-400 bg-indigo-950/40 border-indigo-900/30",
    hoverBorder: "hover:border-indigo-500/30 hover:bg-indigo-950/20 text-indigo-500"
  },
  {
    id: "study-planner",
    name: "AI Study Planner",
    desc: "Algorithmic study block creation, break structures, and active learning guides.",
    icon: BrainCircuit,
    colorClass: "text-emerald-400 bg-emerald-950/40 border-emerald-900/30",
    hoverBorder: "hover:border-emerald-500/30 hover:bg-emerald-950/20 text-emerald-500"
  },
  {
    id: "habits",
    name: "Habit Tracker",
    desc: "Reinforce daily routines, track streaks, and master neural habits.",
    icon: Sparkles,
    colorClass: "text-amber-400 bg-amber-950/40 border-amber-900/30",
    hoverBorder: "hover:border-amber-500/30 hover:bg-amber-950/20 text-amber-500"
  },
  {
    id: "coach",
    name: "Lumina Coach",
    desc: "Converse with your cognitive AI strategy counselor and clear panic spikes.",
    icon: Bot,
    colorClass: "text-violet-400 bg-violet-950/40 border-violet-900/30",
    hoverBorder: "hover:border-violet-500/30 hover:bg-violet-950/20 text-violet-500"
  },
  {
    id: "scheduler",
    name: "Time-Blocking Calendar",
    desc: "Orchestrate your hours, protect deep rest, and audit daily execution.",
    icon: Timer,
    colorClass: "text-rose-400 bg-rose-950/40 border-rose-900/30",
    hoverBorder: "hover:border-rose-500/30 hover:bg-rose-950/20 text-rose-500"
  }
];

export default function App() {
  // Current user accounts states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [darkMode] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeRescue, setActiveRescue] = useState<ActiveRescue | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  
  // App navigation state
  const [activeNavTab, setActiveNavTab] = useState<"home" | "priorities" | "scheduler" | "habits" | "coach" | "study-planner">("home");
  const [showFeatureMenu, setShowFeatureMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  
  // Loading and helper state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [celebrateTask, setCelebrateTask] = useState<Task | null>(null);

  // Initialize and load auth + theme state on mount
  useEffect(() => {
    // 1. Theme Configuration - Permanently dark mode
    document.documentElement.classList.add("dark");
    safeLocalStorage.setItem("theme", "dark");

    // 2. User Authentication Check
    const cachedUserRaw = safeLocalStorage.getItem("saved_current_life_saver_user_v1");
    if (cachedUserRaw) {
      try {
        const parsedUser = JSON.parse(cachedUserRaw);
        setCurrentUser(parsedUser);
      } catch (err) {
        console.error("Failed to parse cached user:", err);
      }
    }
    setAuthChecked(true);
  }, []);

  // Update document dark class always
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Load user-specific cached data whenever currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setTimeBlocks([]);
      setChatHistory([]);
      setHabits([]);
      setReminders([]);
      return;
    }

    const emailKey = currentUser.email;
    const cachedTasks = safeLocalStorage.getItem(`saved_planner_tasks__v1_${emailKey}`);
    const cachedBlocks = safeLocalStorage.getItem(`saved_time_blocks__v1_${emailKey}`);
    const cachedChat = safeLocalStorage.getItem(`saved_coach_chat__v1_${emailKey}`);
    const cachedHabits = safeLocalStorage.getItem(`saved_planner_habits__v1_${emailKey}`);
    const cachedReminders = safeLocalStorage.getItem(`saved_planner_reminders__v1_${emailKey}`);

    const tomorrowString = new Date(Date.now() + 86450000).toISOString().slice(0, 16);
    const todayLaterString = new Date(Date.now() + 18000000).toISOString().slice(0, 16);
    
    const defaultTasks: Task[] = [
      {
        id: "def_1",
        title: "Urgent Lab Report Submission",
        dueDate: todayLaterString,
        importance: "high",
        estimatedTime: 120,
        completed: false,
        notes: "Need to structure discussion section and upload PDF to submission portal. Portal locks at exact time. Don't fall behind!",
        category: "assignment"
      },
      {
        id: "def_2",
        title: "Overdue Electricity & Server Bill",
        dueDate: tomorrowString,
        importance: "high",
        estimatedTime: 25,
        completed: false,
        notes: "Need to login online, copy payment confirmation code, and verify billing address details to avoid shutoff.",
        category: "bill"
      },
      {
        id: "def_3",
        title: "Prep Portfolio for Contract Pitch",
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16),
        importance: "normal",
        estimatedTime: 90,
        completed: false,
        notes: "Tidy up project slides and double check presentation deck link.",
        category: "interview"
      }
    ];

    const defaultHabits: Habit[] = [
      {
        id: "def_habit_1",
        title: "The 30-Minute Focus Sprint",
        frequency: "daily",
        completedDates: [],
        streak: 0,
        category: "study",
        aiCoachingTip: "Commit to single-tasking for 30 minutes with zero notifications. This triggers psychological momentum."
      },
      {
        id: "def_habit_2",
        title: "Personal Spatial De-clutter",
        frequency: "daily",
        completedDates: [],
        streak: 2,
        category: "organization",
        aiCoachingTip: "Spend 2 minutes clearing your primary vision workspace before a task. Reduces visual attention dilution."
      }
    ];

    const initialChat: ChatMessage[] = [
      {
        sender: "coach",
        text: `Greetings, ${currentUser.name}. I am Lumina, your proactive productivity guard. Deadlines can be high-stress and paralyzing, but we can navigate any time-crunch together. Log your commitments, click 'AI Risk Evaluation' to sort them by acute crisis risk, or trigger an active 'Rescue Plan' when you need step-by-step frictionless focus!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    const initialReminders: SmartReminder[] = [
      {
        id: "rem_1",
        title: "Acute Deadline Proximity Warn",
        message: "Urgent Lab Report Submission is due in less than 5 hours. Lumina predicts a 90% risk of rush anxiety. Trigger Rescue Mode now!",
        type: "warning",
        timestamp: "Just Now",
        isRead: false,
        actionLabel: "Enter Rescue Mode"
      },
      {
        id: "rem_2",
        title: "Consistent Shield Reminder",
        message: "Keep your 2-day desk de-clutter streak alive. Clean spaces anchor focused minds.",
        type: "nudge",
        timestamp: "2 Hours Ago",
        isRead: false,
        actionLabel: "Clear Desk"
      }
    ];

    // Load Tasks
    let tasksLoaded = false;
    if (cachedTasks) {
      try {
        setTasks(JSON.parse(cachedTasks));
        tasksLoaded = true;
      } catch (e) {
        console.error("Failed to parse cached tasks", e);
      }
    }
    if (!tasksLoaded) {
      setTasks(defaultTasks);
      safeLocalStorage.setItem(`saved_planner_tasks__v1_${emailKey}`, JSON.stringify(defaultTasks));
    }

    // Load Blocks
    let blocksLoaded = false;
    if (cachedBlocks) {
      try {
        setTimeBlocks(JSON.parse(cachedBlocks));
        blocksLoaded = true;
      } catch (e) {
        console.error("Failed to parse cached time blocks", e);
      }
    }
    if (!blocksLoaded) {
      setTimeBlocks([]);
    }

    // Load Chat
    let chatLoaded = false;
    if (cachedChat) {
      try {
        setChatHistory(JSON.parse(cachedChat));
        chatLoaded = true;
      } catch (e) {
        console.error("Failed to parse cached chat", e);
      }
    }
    if (!chatLoaded) {
      setChatHistory(initialChat);
      safeLocalStorage.setItem(`saved_coach_chat__v1_${emailKey}`, JSON.stringify(initialChat));
    }

    // Load Habits
    let habitsLoaded = false;
    if (cachedHabits) {
      try {
        setHabits(JSON.parse(cachedHabits));
        habitsLoaded = true;
      } catch (e) {
        console.error("Failed to parse cached habits", e);
      }
    }
    if (!habitsLoaded) {
      setHabits(defaultHabits);
      safeLocalStorage.setItem(`saved_planner_habits__v1_${emailKey}`, JSON.stringify(defaultHabits));
    }

    // Load Reminders
    let remindersLoaded = false;
    if (cachedReminders) {
      try {
        setReminders(JSON.parse(cachedReminders));
        remindersLoaded = true;
      } catch (e) {
        console.error("Failed to parse cached reminders", e);
      }
    }
    if (!remindersLoaded) {
      setReminders(initialReminders);
      safeLocalStorage.setItem(`saved_planner_reminders__v1_${emailKey}`, JSON.stringify(initialReminders));
    }
  }, [currentUser]);

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    safeLocalStorage.removeItem("saved_current_life_saver_user_v1");
  };

  // Save changes back to localStorage with user-specific isolation
  const handleTasksChange = (newTasks: Task[]) => {
    setTasks(newTasks);
    if (currentUser) {
      safeLocalStorage.setItem(`saved_planner_tasks__v1_${currentUser.email}`, JSON.stringify(newTasks));
    }
  };

  const handleHabitsChange = (newHabits: Habit[]) => {
    setHabits(newHabits);
    if (currentUser) {
      safeLocalStorage.setItem(`saved_planner_habits__v1_${currentUser.email}`, JSON.stringify(newHabits));
    }
  };

  const handleRemindersChange = (newReminders: SmartReminder[]) => {
    setReminders(newReminders);
    if (currentUser) {
      safeLocalStorage.setItem(`saved_planner_reminders__v1_${currentUser.email}`, JSON.stringify(newReminders));
    }
  };

  const handleAddReminder = (title: string, message: string, type: SmartReminder["type"]) => {
    const newRem: SmartReminder = {
      id: "rem_" + Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    const updated = [newRem, ...reminders];
    setReminders(updated);
    if (currentUser) {
      safeLocalStorage.setItem(`saved_planner_reminders__v1_${currentUser.email}`, JSON.stringify(updated));
    }
  };

  const handleBlocksChange = (newBlocks: TimeBlock[]) => {
    setTimeBlocks(newBlocks);
    if (currentUser) {
      safeLocalStorage.setItem(`saved_time_blocks__v1_${currentUser.email}`, JSON.stringify(newBlocks));
    }
  };

  const handleChatHistoryChange = (newChat: ChatMessage[]) => {
    setChatHistory(newChat);
    if (currentUser) {
      safeLocalStorage.setItem(`saved_coach_chat__v1_${currentUser.email}`, JSON.stringify(newChat));
    }
  };


  // Launch AI Rescue plan
  const triggerRescuePlan = async (taskToRescue: Task) => {
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/gemini/rescue-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskToRescue }),
      });
      const data = await response.json();
      if (data.steps && data.steps.length > 0) {
        setActiveRescue({
          task: taskToRescue,
          steps: data.steps,
          currentStepIndex: 0,
          timeRemaining: data.steps[0].duration * 60,
          isRunning: true,
        });
      }
    } catch (err) {
      console.error("Failed to generate rescue steps:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Exit Rescue Plan flow
  const completeRescuePlan = (completedSuccessfully: boolean) => {
    if (!activeRescue) return;
    
    if (completedSuccessfully) {
      // Set the task as completed in planner
      const updated = tasks.map(t => t.id === activeRescue.task.id ? { ...t, completed: true } : t);
      handleTasksChange(updated);
      setCelebrateTask(activeRescue.task);
    }

    setActiveRescue(null);
  };

  // Computed state calculations for dashboard indicators
  const pendingCount = tasks.filter(t => !t.completed).length;
  const criticalUrgentCount = tasks.filter(t => {
    if (t.completed) return false;
    // Check if due in less than 24 hours
    const dueTime = new Date(t.dueDate).getTime();
    const hoursLeft = (dueTime - Date.now()) / 3600000;
    return hoursLeft > 0 && hoursLeft <= 24 && t.importance === "high";
  }).length;

  const currentFrustrationFactor = Math.min(
    100,
    Math.max(
      15,
      tasks.filter(t => !t.completed).reduce((acc, current) => {
        let score = 20;
        if (current.importance === "high") score += 25;
        const hoursLeft = (new Date(current.dueDate).getTime() - Date.now()) / 3600000;
        if (hoursLeft < 12) score += 35;
        else if (hoursLeft < 24) score += 20;
        return acc + score;
      }, 0) / Math.max(1, tasks.filter(t => !t.completed).length)
    )
  );

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-925 transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          safeLocalStorage.setItem("saved_current_life_saver_user_v1", JSON.stringify(user));
        }}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col antialiased ${
      darkMode ? "bg-slate-925 text-slate-100" : "bg-slate-50 text-slate-800"
    }`}>
      
      {/* Upper Navigation & Title Container with Professional Polish */}
      <header className="h-16 border-b px-4 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs bg-slate-950 border-slate-700 text-slate-100 transition-colors duration-300">
        <div className="flex items-center gap-2">
          {/* Hamburger menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* YouTube-style Clickable Logo & Title */}
          <button
            onClick={() => {
              setActiveNavTab("home");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 text-left focus:outline-none hover:opacity-90 transition group cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 rounded-xl text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/10 shrink-0 group-hover:scale-[1.03] transition-transform">
              <ShieldAlert className="w-5 h-5 text-indigo-100 opacity-40 absolute" />
              <span className="font-black text-sm tracking-tight font-display text-white relative z-10">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight leading-tight text-white font-display">
                The Last-Minute Life Saver
              </span>
              <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-widest font-sans leading-none mt-1">
                Crisis AI Strategy
              </span>
            </div>
          </button>
          <div className="h-4 w-px bg-slate-800 hidden lg:block ml-2"></div>
          <span className="text-slate-400 font-semibold text-xs hidden lg:inline-block ml-1">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Quick Metrics & Actions Bar */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5 border border-slate-800 bg-slate-900/60 px-2.5 py-1 rounded-lg text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span className="text-slate-300 font-medium">{pendingCount} active duties</span>
            </div>

            <div className="flex items-center gap-1.5 border border-slate-800 bg-slate-900/60 px-2.5 py-1 rounded-lg text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping"></span>
              <span className="text-slate-300 font-medium">{Math.round(currentFrustrationFactor)}% Stress Index</span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowVoiceAssistant(!showVoiceAssistant);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5 shrink-0 ${
              showVoiceAssistant
                ? "bg-slate-800 text-indigo-400 border border-slate-700"
                : "bg-gradient-to-r from-indigo-600 to-violet-650 text-white hover:from-indigo-500 hover:to-violet-550"
            }`}
            title="Lumina Voice Assistant"
          >
            <Mic className={`w-3.5 h-3.5 shrink-0 ${showVoiceAssistant ? "text-indigo-400 font-bold" : "fill-white text-white"}`} />
            <span>Lumina Voice Assistant</span>
          </button>

          {/* Proactive Smart Alerts Icon */}
          <div id="smart-reminders-trigger" className="relative">
            <button
              onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              className="p-2 cursor-pointer transition-all border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl flex items-center justify-center relative"
              title="Proactive AI Warnings"
            >
              <Bell className="w-4 h-4 shrink-0" />
              {reminders.filter(r => !r.isRead).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse">
                  {reminders.filter(r => !r.isRead).length}
                </span>
              )}
            </button>
          </div>



          {/* User Account Avatar / Information */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500/30 shadow-sm relative group bg-slate-900 shrink-0" title={`Logged in as ${currentUser.name}`}>
              {currentUser.avatarUrl ? (
                <img referrerPolicy="no-referrer" src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-indigo-300 flex items-center justify-center text-white text-xs font-bold leading-none">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="hidden md:flex flex-col text-left text-xs">
              <span className="font-bold text-slate-200 truncate max-w-[100px] leading-tight">{currentUser.name}</span>
              <span className="text-[9px] text-slate-400 truncate max-w-[100px] leading-none">{currentUser.email}</span>
            </div>

            {/* Log Out Button */}
            <button
              onClick={handleLogout}
              className="p-2 cursor-pointer transition-all border border-rose-900/30 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 rounded-xl flex items-center justify-center shrink-0"
              title="Log Out of Planner"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* YouTube-style Dual Layout Wrapper */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Backdrop overlay for mobile drawer */}
        {sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity backdrop-blur-xs cursor-pointer w-full h-full text-left"
            aria-label="Close Sidebar backdrop"
          />
        )}

        {/* Left Navigation Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-30 
          ${sidebarOpen ? "translate-x-0 w-64 border-r border-slate-700" : "-translate-x-full md:-translate-x-full w-0 overflow-hidden border-r-0"} 
          transition-all duration-300 ease-in-out
          flex flex-col shrink-0 bg-slate-950 text-slate-100 h-[calc(100vh-4rem)] overflow-y-auto
        `}>
          <div className="p-3 space-y-1.5">
            {/* YouTube style Home Button */}
            <button
              onClick={() => {
                setActiveNavTab("home");
                if (window.innerWidth < 768) setSidebarOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`w-full flex ${sidebarOpen ? "flex-row gap-3.5 px-3.5 py-3 text-left" : "flex-col gap-1 items-center justify-center py-3 px-1 text-center"} text-xs font-bold rounded-xl transition duration-150 cursor-pointer ${
                activeNavTab === "home"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/80"
              }`}
            >
              <Home className={`w-5 h-5 ${activeNavTab === "home" ? "text-white" : "text-indigo-400"}`} />
              <span className={sidebarOpen ? "font-bold" : "text-[10px] text-slate-400 font-medium truncate w-full"}>
                Home
              </span>
            </button>

            <div className="h-px bg-slate-900 my-2" />

            {sidebarOpen && (
              <div className="px-3 py-1 text-[9px] font-black uppercase text-indigo-400/85 tracking-widest">
                Strategic Suite
              </div>
            )}

            {featureTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNavTab(item.id as any);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`w-full flex ${sidebarOpen ? "flex-row gap-3.5 px-3.5 py-3 text-left" : "flex-col gap-1 items-center justify-center py-3 px-1 text-center"} text-xs font-bold rounded-xl transition duration-150 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-550/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                  }`}
                  title={item.name}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-indigo-400"}`} />
                  <span className={sidebarOpen ? "font-bold truncate" : "text-[10px] text-slate-400 font-medium truncate w-full"}>
                    {sidebarOpen ? item.name : item.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>


        </aside>

        {/* Content Panel Area */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <main className="max-w-7xl w-full mx-auto p-6 space-y-6">

        {/* Dynamic Display components rendering */}
        <div className="transition-all duration-300">
          {activeNavTab === "home" && (
            <DashboardOverview
              tasks={tasks}
              habits={habits}
              reminders={reminders}
              timeBlocks={timeBlocks}
              currentUser={currentUser}
              setActiveNavTab={setActiveNavTab}
              onAddTask={(newTaskDetails) => {
                const newTask: Task = {
                  ...newTaskDetails,
                  id: "raw_" + Math.random().toString(36).substring(2, 9),
                  completed: false
                };
                handleTasksChange([...tasks, newTask]);
              }}
            />
          )}

          {activeNavTab === "priorities" &&
            (activeRescue ? (
              <RescueGuide
                activeRescue={activeRescue}
                onUpdateRescue={setActiveRescue}
                onExitRescue={completeRescuePlan}
              />
            ) : (
              <TaskPrioritizer
                tasks={tasks}
                onTasksChange={handleTasksChange}
                onStartRescue={triggerRescuePlan}
                isAiLoading={isAiLoading}
                setIsAiLoading={setIsAiLoading}
              />
            ))}

          {activeNavTab === "study-planner" && (
            <AutoStudyPlanner
              tasks={tasks}
              onAddTask={(title, duration, importance) => {
                const newTask: Task = {
                  id: "task-" + Date.now(),
                  title,
                  category: "assignment",
                  importance,
                  dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
                  estimatedTime: duration,
                  completed: false,
                  notes: "AI study planner generated task"
                };
                const updated = [...tasks, newTask];
                handleTasksChange(updated);
              }}
            />
          )}

          {activeNavTab === "coach" && (
            <CompanionChat
              tasks={tasks}
              onTasksChange={handleTasksChange}
              chatHistory={chatHistory}
              onChatHistoryChange={handleChatHistoryChange}
            />
          )}

          {activeNavTab === "scheduler" && (
            <TimeBlockScheduler
              tasks={tasks}
              timeBlocks={timeBlocks}
              onBlocksChange={handleBlocksChange}
              isAiLoading={isAiLoading}
              setIsAiLoading={setIsAiLoading}
            />
          )}

          {activeNavTab === "habits" && (
            <HabitTracker
              habits={habits}
              onHabitsChange={handleHabitsChange}
              onAddReminder={handleAddReminder}
            />
          )}
        </div>



          </main>
        </div>
      </div>

      {/* Proactive Smart Alerts Side-over drawer overlay */}
      {showNotificationCenter && (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-50 flex justify-end" onClick={() => setShowNotificationCenter(false)}>
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 rounded-lg">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <span className="font-extrabold text-slate-850 dark:text-slate-100 text-sm">Contextual Shield Warnings</span>
                </div>
                <button 
                  onClick={() => setShowNotificationCenter(false)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg text-xs font-bold leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
                {reminders.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-505 space-y-2">
                    <AlertTriangle className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">Shields Active & Silent</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal max-w-[200px] mx-auto">
                      Lumina hasn't flagged any looming deadline slips. Your schedule is currently operational!
                    </p>
                  </div>
                ) : (
                  reminders.map((rem) => (
                    <div 
                      key={rem.id}
                      className={`p-3.5 border rounded-2xl space-y-2.5 transition-all ${
                        rem.isRead 
                          ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850 opacity-60" 
                          : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              rem.type === "warning" ? "bg-red-500 animate-ping" : 
                              rem.type === "delay_alert" ? "bg-amber-500" : "bg-indigo-500"
                            }`}></span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-[11.5px] leading-tight">{rem.title}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase block">{rem.timestamp}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const updated = reminders.map(r => r.id === rem.id ? { ...r, isRead: true } : r);
                            handleRemindersChange(updated);
                          }}
                          className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase border transition shrink-0 ${
                            rem.isRead 
                              ? "bg-slate-105 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500" 
                              : "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white cursor-pointer"
                          }`}
                        >
                          {rem.isRead ? "archived" : "acknowledge"}
                        </button>
                      </div>
                      <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{rem.message}</p>
                      
                      {rem.actionLabel && !rem.isRead && (
                        <button
                          onClick={() => {
                            const updated = reminders.map(r => r.id === rem.id ? { ...r, isRead: true } : r);
                            handleRemindersChange(updated);
                            setShowNotificationCenter(false);
                            
                            if (rem.actionLabel === "Enter Rescue Mode") {
                              const highTask = tasks.find(t => !t.completed && t.importance === "high") || tasks.find(t => !t.completed);
                              if (highTask) {
                                triggerRescuePlan(highTask);
                              } else {
                                setActiveNavTab("priorities");
                              }
                            } else {
                              setActiveNavTab("habits");
                            }
                          }}
                          className="w-full py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-[9.5px] font-black hover:bg-slate-800 dark:hover:bg-slate-200 transition cursor-pointer"
                        >
                          {rem.actionLabel}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950">
              <button 
                onClick={() => {
                  const updated = reminders.map(r => ({ ...r, isRead: true }));
                  handleRemindersChange(updated);
                }}
                className="text-[9px] font-black text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 uppercase cursor-pointer"
              >
                Archive All
              </button>
              <button 
                onClick={() => {
                  handleRemindersChange([]);
                }}
                className="text-[9px] font-black text-rose-500 hover:text-rose-800 dark:hover:text-rose-400 uppercase cursor-pointer"
              >
                Clear warnings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Literal Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-4.5 px-6 text-center text-xs text-slate-400 dark:text-slate-500 font-normal shrink-0 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <span>The Last-Minute Life Saver • Empowering rapid execution under crisis.</span>
          <span className="font-sans text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
            CREATED BY ADITYA KUMAR
          </span>
        </div>
      </footer>

      <VoiceAssistant 
        tasks={tasks} 
        onTasksChange={handleTasksChange} 
        isOpen={showVoiceAssistant} 
        setIsOpen={setShowVoiceAssistant} 
      />

    </div>
  );
}
