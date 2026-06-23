import React, { useState } from "react";
import { Habit } from "../types";
import { 
  Sparkles, 
  Flame, 
  Plus, 
  Trash2, 
  Trophy, 
  Brain, 
  Heart, 
  Compass, 
  Lightbulb, 
  CheckCircle,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

interface HabitTrackerProps {
  habits: Habit[];
  onHabitsChange: (habits: Habit[]) => void;
  onAddReminder: (title: string, message: string, type: "warning" | "nudge" | "celebration" | "delay_alert") => void;
}

export default function HabitTracker({
  habits,
  onHabitsChange,
  onAddReminder
}: HabitTrackerProps) {
  const [habitTitle, setHabitTitle] = useState("");
  const [category, setCategory] = useState<Habit["category"]>("study");
  const [frequency, setFrequency] = useState<Habit["frequency"]>("daily");

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;

    // Generate dynamic AI tip based on category
    let aiCoachingTip = "";
    if (category === "mindset") {
      aiCoachingTip = "Neural activation occurs in the first 2 minutes. Focus purely on showing up to break default cognitive inertia.";
    } else if (category === "study") {
      aiCoachingTip = "Spaced repetition and active recall protect memory density. Sticking to this routine prevents last-minute cram stress by 70%.";
    } else if (category === "organization") {
      aiCoachingTip = "Organized environments act as an external working memory. Clearing clutter frees up to 15% more executive focus capacity.";
    } else {
      aiCoachingTip = "Physical hydration and breathing exercises supply oxygen directly to the frontal cortex, stabilizing focus during high-alert grinds.";
    }

    const newHabit: Habit = {
      id: "habit_" + Math.random().toString(36).substring(2, 9),
      title: habitTitle.trim(),
      frequency,
      completedDates: [],
      streak: 0,
      category,
      aiCoachingTip
    };

    onHabitsChange([...habits, newHabit]);
    setHabitTitle("");

    onAddReminder(
      "Habit Locked In",
      `The habit "${newHabit.title}" has been anchored to your daily safety routines!`,
      "nudge"
    );
  };

  const toggleHabitToday = (habitId: string) => {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;

      const completedDates = [...h.completedDates];
      const index = completedDates.indexOf(todayStr);
      let newStreak = h.streak;

      if (index > -1) {
        // Toggle off (Undo completion for today)
        completedDates.splice(index, 1);
        newStreak = Math.max(0, newStreak - 1);
      } else {
        // Toggle on (Complete for today)
        completedDates.push(todayStr);
        newStreak += 1;
        
        // Trigger smart celebratory sound & nudge
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(330, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          }
        } catch (e) {}

        // Add smart notification context
        if (newStreak % 3 === 0) {
          onAddReminder(
            "Unstoppable Streak!",
            `Phenomenal! You've maintained the habit "${h.title}" for ${newStreak} cycles. Lumina is proud of your consistency.`,
            "celebration"
          );
        }
      }

      return {
        ...h,
        completedDates,
        streak: newStreak
      };
    });

    onHabitsChange(updated);
  };

  const deleteHabit = (id: string) => {
    onHabitsChange(habits.filter(h => h.id !== id));
  };

  const adoptRecommendedHabit = (rec: { title: string; category: Habit["category"]; tip: string }) => {
    if (habits.some(h => h.title.toLowerCase() === rec.title.toLowerCase())) return;

    const newHabit: Habit = {
      id: "habit_rec_" + Math.random().toString(36).substring(2, 9),
      title: rec.title,
      frequency: "daily",
      completedDates: [],
      streak: 0,
      category: rec.category,
      aiCoachingTip: rec.tip
    };

    onHabitsChange([...habits, newHabit]);
    onAddReminder(
      "AI Recommended Habit Adopted",
      `Successfully subscribed to Lumina's suggested habit: "${rec.title}"`,
      "celebration"
    );
  };

  // Static recommendations that match our behavioral theme
  const recommendations = [
    {
      title: "The 30-Minute Focus Sprint",
      category: "study" as const,
      tip: "Commit to single-tasking for 30 minutes with zero notifications. This triggers psychological momentum."
    },
    {
      title: "Tactical Desk De-clutter",
      category: "organization" as const,
      tip: "Spend 2 minutes clearing your primary vision workspace before a task. Reduces visual attention dilution."
    },
    {
      title: "Daily Tactical Breath Reset",
      category: "health" as const,
      tip: "Perform 4-4-4 box breathing for 2 minutes to halt cortisol surges when deadlines approach."
    },
    {
      title: "Nightly 3-Chore Audit",
      category: "mindset" as const,
      tip: "List exactly three primary intentions for tomorrow before sleeping. Avoids early morning structural paralysis."
    }
  ];

  const categoryIcons = {
    study: <Brain className="w-4 h-4 text-indigo-500" />,
    health: <Heart className="w-4 h-4 text-emerald-500" />,
    organization: <Layers className="w-4 h-4 text-amber-500" />,
    mindset: <Compass className="w-4 h-4 text-violet-500" />
  };

  const categoryLabels = {
    study: "Study & Execution",
    health: "Vitals & Energy",
    organization: "Clutter Control",
    mindset: "Pacing & Mindfulness"
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div id="habits-section" className="space-y-6">
      
      {/* Header introduction banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold tracking-widest px-2.5 py-1 rounded-full border border-indigo-100 uppercase">
            Consistency Armor
          </span>
          <h3 className="font-extrabold text-slate-950 text-xl flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
            Lumina Habit Sanctuary
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Procrastination is often fueled by a lack of emotional self-regulation and startup friction. Building small, repeatable daily anchors constructs high behavioral momentum that protects you during final crunch times.
          </p>
        </div>

        {/* Global Streak Counter Widget */}
        <div className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 shrink-0">
          <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/15">
            <Flame className="w-5 h-5 fill-amber-500" />
          </span>
          <div>
            <div className="text-2xl font-black tracking-tight leading-none">
              {habits.reduce((acc, curr) => acc + (curr.streak > 0 ? 1 : 0), 0)}
            </div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mt-1">
              Active Armor Streaks
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left pane: Add and Manage habits list */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-800 text-sm">Your Active Anchors</h4>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Today is {new Date().toLocaleDateString([], { month: "short", day: "numeric" })}</span>
            </div>

            {habits.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-100 rounded-2xl">
                <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No habit anchors registered yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Register a custom routine using the sidebar form or adopt a suggested behavior below to start building your defense.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const isCompletedToday = habit.completedDates.includes(todayStr);

                  return (
                    <div
                      key={habit.id}
                      className={`p-4 border rounded-2xl transition-all shadow-xs flex items-center justify-between gap-4 ${
                        isCompletedToday
                          ? "bg-emerald-50/20 border-emerald-100 hover:border-emerald-250"
                          : "bg-white border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={() => toggleHabitToday(habit.id)}
                          className="mt-0.5"
                        >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isCompletedToday 
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-100 scale-105" 
                              : "border-slate-350 hover:border-indigo-500 bg-white"
                          }`}>
                            {isCompletedToday && <span className="text-[11px] font-extrabold">✓</span>}
                          </div>
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {habit.title}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1 uppercase">
                              {categoryIcons[habit.category]}
                              {categoryLabels[habit.category]}
                            </span>
                            
                            {habit.streak > 0 && (
                              <span className="animate-pulse flex items-center gap-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded">
                                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                                {habit.streak} DAYS
                              </span>
                            )}
                          </div>
                          
                          {habit.aiCoachingTip && (
                            <div className="flex gap-1.5 p-2 bg-slate-50/50 border border-slate-100 rounded-xl leading-normal">
                              <Lightbulb className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                              <p className="text-[10.5px] italic text-slate-600">
                                {habit.aiCoachingTip}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Recommended habits to adopt */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <h4 className="font-extrabold text-indigo-950 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Lumina Strategy Recommendations
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adopt these core high-leverage rituals recommended to preserve neurological energy and combat anxiety loops.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {recommendations.map((rec, idx) => {
                const isAdopted = habits.some(h => h.title.toLowerCase() === rec.title.toLowerCase());

                return (
                  <div
                    key={idx}
                    className={`p-4 border rounded-xl flex flex-col justify-between gap-3 transition-all ${
                      isAdopted
                        ? "bg-slate-50 border-slate-150 opacity-60"
                        : "bg-gradient-to-br from-indigo-50/20 to-slate-50/40 border-slate-200/50 hover:border-indigo-200"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                          {categoryLabels[rec.category]}
                        </span>
                        <span>{categoryIcons[rec.category]}</span>
                      </div>
                      <h5 className="font-bold text-slate-850 text-xs">{rec.title}</h5>
                      <p className="text-[10px] text-slate-500 leading-normal">{rec.tip}</p>
                    </div>

                    <button
                      disabled={isAdopted}
                      onClick={() => adoptRecommendedHabit(rec)}
                      className={`w-full py-1.5 rounded-lg text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                        isAdopted
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      }`}
                    >
                      <span>{isAdopted ? "Already Practicing" : "Adopt Anchoring Ritual"}</span>
                      {!isAdopted && <ArrowRight className="w-3 h-3 shrink-0" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right pane: Create custom habit anchor form */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-fit space-y-4">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Brain className="w-4.5 h-4.5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Anchor Creator</h4>
          </div>

          <form onSubmit={addHabit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Habit Anchor Title
              </label>
              <input
                id="input-habit-title"
                type="text"
                required
                placeholder="e.g. Inbox Zero Clear-out, Drink 1L Water..."
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-slate-450 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Cognitive Category
              </label>
              <select
                id="select-habit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Habit["category"])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-750 text-xs focus:outline-none focus:bg-white transition"
              >
                <option value="study">Study & Memory Integration</option>
                <option value="organization">Desk & Spatial Clutter Control</option>
                <option value="health">Vitals & Neuro-Hydration</option>
                <option value="mindset">Mindfulness & Proactive Overcoming</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Target Frequency
              </label>
              <select
                id="select-habit-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Habit["frequency"])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-750 text-xs focus:outline-none focus:bg-white transition"
              >
                <option value="daily">Every single day (Daily armor)</option>
                <option value="weekly">Every week (Weekly calibration)</option>
              </select>
            </div>

            <button
              id="btn-save-habit"
              type="submit"
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 text-center mt-2"
            >
              <Plus className="w-4 h-4" />
              Anchor Behavioral Habit
            </button>
          </form>

          {/* Theoretical focus card */}
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl border-l-4 border-l-amber-500">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-800 block mb-1">
              frontal lobe insight
            </span>
            <p className="text-[10px] text-slate-600 leading-normal">
              Habits form through consistent environmental triggers. Stack habits immediately before your main study slots (e.g., "Clear desk immediately before opening syllabus") to trigger the study mindset automatically.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
