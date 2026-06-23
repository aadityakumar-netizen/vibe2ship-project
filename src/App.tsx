import React, { useState, useEffect } from "react";
import { Task, RescueStep, ActiveRescue, ChatMessage, TimeBlock, Habit, SmartReminder } from "./types";
import TaskPrioritizer from "./components/TaskPrioritizer";
import TimeBlockScheduler from "./components/TimeBlockScheduler";
import RescueGuide from "./components/RescueGuide";
import CompanionChat from "./components/CompanionChat";
import HabitTracker from "./components/HabitTracker";
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
  AlertTriangle
} from "lucide-react";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeRescue, setActiveRescue] = useState<ActiveRescue | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  
  const userInitials = "A";
  
  // App navigation state
  const [activeNavTab, setActiveNavTab] = useState<"priorities" | "scheduler" | "habits" | "coach">("priorities");
  
  // Loading and helper state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [celebrateTask, setCelebrateTask] = useState<Task | null>(null);

  // Initialize and load from standard localStorage on mount
  useEffect(() => {
    const cachedTasks = localStorage.getItem("saved_planner_tasks__v1");
    const cachedBlocks = localStorage.getItem("saved_time_blocks__v1");
    const cachedChat = localStorage.getItem("saved_coach_chat__v1");

    if (cachedTasks) {
      setTasks(JSON.parse(cachedTasks));
    } else {
      // Pre-populate some stress points so the application is immediately satisfying to demo
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
      setTasks(defaultTasks);
      localStorage.setItem("saved_planner_tasks__v1", JSON.stringify(defaultTasks));
    }

    if (cachedBlocks) {
      setTimeBlocks(JSON.parse(cachedBlocks));
    }

    if (cachedChat) {
      setChatHistory(JSON.parse(cachedChat));
    } else {
      const initialChat: ChatMessage[] = [
        {
          sender: "coach",
          text: "Greetings. I am Lumina, your proactive productivity guard. Deadlines can be high-stress and paralyzing, but we can navigate any time-crunch together. Log your commitments, click 'AI Risk Evaluation' to sort them by acute crisis risk, or trigger an active 'Rescue Plan' when you need step-by-step frictionless focus!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setChatHistory(initialChat);
      localStorage.setItem("saved_coach_chat__v1", JSON.stringify(initialChat));
    }

    const cachedHabits = localStorage.getItem("saved_planner_habits__v1");
    const cachedReminders = localStorage.getItem("saved_planner_reminders__v1");

    if (cachedHabits) {
      setHabits(JSON.parse(cachedHabits));
    } else {
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
      setHabits(defaultHabits);
      localStorage.setItem("saved_planner_habits__v1", JSON.stringify(defaultHabits));
    }

    if (cachedReminders) {
      setReminders(JSON.parse(cachedReminders));
    } else {
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
      setReminders(initialReminders);
      localStorage.setItem("saved_planner_reminders__v1", JSON.stringify(initialReminders));
    }
  }, []);

  // Save changes back to localStorage
  const handleTasksChange = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("saved_planner_tasks__v1", JSON.stringify(newTasks));
  };

  const handleHabitsChange = (newHabits: Habit[]) => {
    setHabits(newHabits);
    localStorage.setItem("saved_planner_habits__v1", JSON.stringify(newHabits));
  };

  const handleRemindersChange = (newReminders: SmartReminder[]) => {
    setReminders(newReminders);
    localStorage.setItem("saved_planner_reminders__v1", JSON.stringify(newReminders));
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
    localStorage.setItem("saved_planner_reminders__v1", JSON.stringify(updated));
  };

  const handleBlocksChange = (newBlocks: TimeBlock[]) => {
    setTimeBlocks(newBlocks);
    localStorage.setItem("saved_time_blocks__v1", JSON.stringify(newBlocks));
  };

  const handleChatHistoryChange = (newChat: ChatMessage[]) => {
    setChatHistory(newChat);
    localStorage.setItem("saved_coach_chat__v1", JSON.stringify(newChat));
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      
      {/* Upper Navigation & Title Container with Professional Polish */}
      <header className="h-16 bg-white border-b border-slate-250 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold tracking-tight shadow-sm">
              S
            </span>
            <span className="text-slate-900 font-extrabold text-base tracking-tight hidden sm:inline-block">The Last-Minute Life Saver</span>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
          <span className="text-slate-500 font-medium text-xs hidden md:inline-block">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <span className="text-emerald-600 flex items-center gap-2 text-xs font-semibold bg-emerald-50/50 px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            AI Syncing: {Math.round(100 - (currentFrustrationFactor * 0.15))}% Reliable Schedule
          </span>
        </div>

        {/* Quick Metrics & Actions Bar */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span className="text-slate-500 font-medium">{pendingCount} active duties</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
              <span className="text-slate-500 font-medium">{Math.round(currentFrustrationFactor)}% Stress Index</span>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveNavTab("priorities");
              // Focus input title if it exists
              setTimeout(() => {
                const element = document.getElementById("input-task-title");
                if (element) element.focus();
              }, 100);
            }}
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition shadow-xs flex items-center gap-1 shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
            <span>+ Emergency Task</span>
          </button>

          {/* Proactive Smart Alerts Icon */}
          <div id="smart-reminders-trigger" className="relative">
            <button
              onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              className="p-2 cursor-pointer transition-all bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl flex items-center justify-center relative"
              title="Proactive AI Warnings"
            >
              <Bell className="w-4 h-4 shrink-0" />
              {reminders.filter(r => !r.isRead).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {reminders.filter(r => !r.isRead).length}
                </span>
              )}
            </button>
          </div>

          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer" title="Self-Care User Profile">
            <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-indigo-300 flex items-center justify-center text-white text-xs font-bold leading-none">
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Core App Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Navigation Tabs bar */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 max-w-xs sm:max-w-lg shadow-2xs">
          <button
            id="nav-btn-priorities"
            onClick={() => setActiveNavTab("priorities")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
              activeNavTab === "priorities"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-indigo-600 hover:bg-white"
            }`}
          >
            <Compass className={`w-4 h-4 ${activeNavTab === "priorities" ? "text-white" : "text-indigo-500"}`} />
            Agenda & Priorities
          </button>
          
          <button
            id="nav-btn-scheduler"
            onClick={() => setActiveNavTab("scheduler")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
              activeNavTab === "scheduler"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-indigo-800 hover:bg-white"
            }`}
          >
            <Timer className={`w-4 h-4 ${activeNavTab === "scheduler" ? "text-white" : "text-rose-500"}`} />
            Time-Blocking Calendar
          </button>

          <button
            id="nav-btn-habits"
            onClick={() => setActiveNavTab("habits")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
              activeNavTab === "habits"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-indigo-600 hover:bg-white"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeNavTab === "habits" ? "text-white" : "text-amber-500"}`} />
            Habit Sanctuary
          </button>

          <button
            id="nav-btn-coach"
            onClick={() => setActiveNavTab("coach")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
              activeNavTab === "coach"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-indigo-600 hover:bg-white"
            }`}
          >
            <Bot className={`w-4 h-4 ${activeNavTab === "coach" ? "text-white" : "text-violet-500"}`} />
            Lumina Coach Chat
          </button>
        </div>

        {/* Dynamic Display components rendering */}
        <div className="transition-all duration-300">
          {activeNavTab === "priorities" && (
            <TaskPrioritizer
              tasks={tasks}
              onTasksChange={handleTasksChange}
              onStartRescue={triggerRescuePlan}
              isAiLoading={isAiLoading}
              setIsAiLoading={setIsAiLoading}
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

          {activeNavTab === "coach" && (
            <CompanionChat
              tasks={tasks}
              onTasksChange={handleTasksChange}
              chatHistory={chatHistory}
              onChatHistoryChange={handleChatHistoryChange}
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

      {/* Persistent global spinner shield when AI loading operations occurs */}
      {isAiLoading && !activeRescue && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs z-50 flex flex-col items-center justify-center">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-xl flex items-center gap-3.5 border border-slate-100">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-violet-600 rounded-full animate-spin"></div>
            <span className="text-xs text-slate-700 font-semibold uppercase tracking-wider">
              AI Guardian formulating focus blueprint...
            </span>
          </div>
        </div>
      )}

      {/* Active Rescue overlay component rendering */}
      {activeRescue && (
        <RescueGuide
          activeRescue={activeRescue}
          onUpdateRescue={setActiveRescue}
          onExitRescue={completeRescuePlan}
        />
      )}

      {/* Task Completion Celebration Modal overlay */}
      {celebrateTask && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-5 text-center">
            
            <span className="p-4 bg-emerald-50 text-emerald-600 rounded-full inline-flex items-center justify-center">
              <CheckCircle className="w-10 h-10 shrink-0" />
            </span>

            <div className="space-y-1">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold tracking-widest px-2 py-0.5 rounded uppercase">
                CRITICAL TARGET SECURED
              </span>
              <h3 className="text-lg font-black text-slate-800">
                "{celebrateTask.title}" Rescued!
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You successfully broke through the procrastination loop, focused without split-attention, and marked complete. This is the momentum we need!
              </p>
            </div>

            <button
              onClick={() => setCelebrateTask(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition"
            >
              Secure next objective
            </button>
          </div>
        </div>
      )}

      {/* Proactive Smart Alerts Side-over drawer overlay */}
      {showNotificationCenter && (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-50 flex justify-end" onClick={() => setShowNotificationCenter(false)}>
          <div 
            className="w-full max-w-sm bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 text-rose-650 rounded-lg">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <span className="font-extrabold text-slate-850 text-sm">Contextual Shield Warnings</span>
                </div>
                <button 
                  onClick={() => setShowNotificationCenter(false)}
                  className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
                {reminders.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <AlertTriangle className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="font-semibold text-xs text-slate-600">Shields Active & Silent</p>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
                      Lumina hasn't flagged any looming deadline slips. Your schedule is currently operational!
                    </p>
                  </div>
                ) : (
                  reminders.map((rem) => (
                    <div 
                      key={rem.id}
                      className={`p-3.5 border rounded-2xl space-y-2.5 transition-all ${
                        rem.isRead 
                          ? "bg-slate-50/50 border-slate-100 opacity-60" 
                          : "bg-white border-slate-150 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              rem.type === "warning" ? "bg-red-500 animate-ping" : 
                              rem.type === "delay_alert" ? "bg-amber-500" : "bg-indigo-500"
                            }`}></span>
                            <span className="font-extrabold text-slate-900 text-[11.5px] leading-tight">{rem.title}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">{rem.timestamp}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const updated = reminders.map(r => r.id === rem.id ? { ...r, isRead: true } : r);
                            handleRemindersChange(updated);
                          }}
                          className={`text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase border transition shrink-0 ${
                            rem.isRead 
                              ? "bg-slate-105 border-slate-100 text-slate-400" 
                              : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white cursor-pointer"
                          }`}
                        >
                          {rem.isRead ? "archived" : "acknowledge"}
                        </button>
                      </div>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">{rem.message}</p>
                      
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
                          className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[9.5px] font-black hover:bg-slate-800 transition cursor-pointer"
                        >
                          {rem.actionLabel}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <button 
                onClick={() => {
                  const updated = reminders.map(r => ({ ...r, isRead: true }));
                  handleRemindersChange(updated);
                }}
                className="text-[9px] font-black text-slate-500 hover:text-slate-800 uppercase cursor-pointer"
              >
                Archive All
              </button>
              <button 
                onClick={() => {
                  handleRemindersChange([]);
                }}
                className="text-[9px] font-black text-rose-500 hover:text-rose-800 uppercase cursor-pointer"
              >
                Clear warnings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Literal Footer */}
      <footer className="bg-white border-t border-slate-100 py-4.5 px-6 text-center text-xs text-slate-400 font-normal shrink-0 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <span>The Last-Minute Life Saver • Empowering rapid execution under crisis.</span>
          <span className="font-mono text-[10px] text-slate-300">
            No system credit indicator • Built in absolute structural clarity
          </span>
        </div>
      </footer>

    </div>
  );
}
