import React, { useState } from "react";
import { Task, TimeBlock } from "../types";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Coffee, 
  Briefcase, 
  Brain, 
  Compass, 
  CalendarCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface TimeBlockSchedulerProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  onBlocksChange: (blocks: TimeBlock[]) => void;
  isAiLoading: boolean;
  setIsAiLoading: (loading: boolean) => void;
}

export default function TimeBlockScheduler({
  tasks,
  timeBlocks,
  onBlocksChange,
  isAiLoading,
  setIsAiLoading,
}: TimeBlockSchedulerProps) {
  
  const [scheduleInsight, setScheduleInsight] = useState<string>("");
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(20);

  const activeTasks = tasks.filter(t => !t.completed);

  const generateOptimalAiBlocks = async () => {
    if (activeTasks.length === 0) return;
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/gemini/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tasks: activeTasks,
          startHour,
          endHour
        }),
      });
      const data = await response.json();
      if (data.timeBlocks) {
        onBlocksChange(data.timeBlocks);
        setScheduleInsight(data.scheduleInsight);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const getBlockStyle = (type: TimeBlock["type"]) => {
    switch (type) {
      case "task":
        return "bg-indigo-50 border-indigo-200 text-indigo-900 border-l-4 border-l-indigo-500 hover:bg-indigo-100/60";
      case "rest":
        return "bg-emerald-50 border-emerald-100 text-emerald-950 border-l-4 border-l-emerald-500 hover:bg-emerald-100/60";
      case "admin":
        return "bg-amber-50 border-amber-200 text-amber-900 border-l-4 border-l-amber-500 hover:bg-amber-100/60";
      default:
        return "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/60";
    }
  };

  const getBlockIcon = (type: TimeBlock["type"]) => {
    switch (type) {
      case "task":
        return <CalendarCheck className="w-4 h-4 text-indigo-500" />;
      case "rest":
        return <Coffee className="w-4 h-4 text-emerald-500 animate-pulse" />;
      case "admin":
        return <Briefcase className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Helper lists representing hours range for visual feedback
  const hoursRange = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <div id="scheduler-section" className="space-y-6">
      
      {/* Configuration grid */}
      <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-emerald-500" />
            AI Day-Structuring Optimizer
          </h3>
          <p className="text-xs text-slate-500">
            Automatically slot tasks into active daylight segments with dynamic restorative loops.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Hour selectors */}
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
            <span>Range:</span>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              {[6,7,8,9,10,11,12].map(h => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00 AM</option>
              ))}
            </select>
            <span>to</span>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              {[15,16,17,18,19,20,21,22,23,24].map(h => (
                <option key={h} value={h}>
                  {h > 12 ? `${h - 12}:00 PM` : `${h}:00 PM`}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-ai-schedule"
            onClick={generateOptimalAiBlocks}
            disabled={activeTasks.length === 0 || isAiLoading}
            className="w-full md:w-auto ml-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isAiLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                <span>Mapping cognitive load...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>AI Time-Blocking Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>

      {scheduleInsight && (
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-start gap-2.5 shadow-sm">
          <Brain className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 leading-relaxed font-medium">
            <span className="font-bold">Lumina's Timing Insight:</span> {scheduleInsight}
          </p>
        </div>
      )}

      {/* Scheduler main display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left column: Visual hourly blocks timeline */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-slate-800 text-sm">Today's Segmented Grid</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {String(hoursRange.length)} Active Hours planned
            </span>
          </div>

          {timeBlocks.length === 0 ? (
            /* Blank state prompting AI click */
            <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-100 rounded-2xl">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Chronological calendar is un-blocked</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Click <span className="font-semibold text-violet-600">"AI Time-Blocking Schedule"</span> to let the companion distribute tasks into high-performance bursts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeBlocks.map((block, idx) => (
                <div
                  key={block.taskId + idx}
                  className={`flex items-stretch gap-4 p-3.5 border rounded-2xl transition-all ${getBlockStyle(block.type)}`}
                >
                  {/* Time label column */}
                  <div className="w-16 flex flex-col justify-center shrink-0 border-r border-slate-200/50 pr-2">
                    <span className="text-xs font-bold tracking-tight font-mono text-slate-700">
                      {block.time}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                      {block.duration} MIN
                    </span>
                  </div>

                  {/* Icon + Title body */}
                  <div className="flex items-center gap-3 w-full justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-white rounded-xl shadow-xs border border-slate-100/40">
                        {getBlockIcon(block.type)}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-850">
                          {block.activityName}
                        </h4>
                        <span className="text-[10px] font-medium opacity-70 uppercase tracking-widest">
                          {block.type} segment
                        </span>
                      </div>
                    </div>

                    {block.type === "rest" && (
                      <span className="text-[10px] bg-emerald-100/50 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Recharge Wave
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Task checklist card for quick status check */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm sticky top-24">
            <h4 className="font-semibold text-slate-800 text-sm mb-3">Tasks requiring focus slots</h4>
            <div className="space-y-2.5">
              {activeTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No pending duties logged.
                </div>
              ) : (
                activeTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/60">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block truncate max-w-[170px]">{t.title}</span>
                      <span className="text-[10px] text-slate-400">{t.estimatedTime} mins total</span>
                    </div>
                    {t.importance === "high" && (
                      <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase">
                        CRITICAL
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Backups info line */}
            <div className="mt-5 p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl flex gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-indigo-800 leading-normal font-medium">
                AI scheduler calculates optimal blocks based on priority matrices. Try to complete rest periods in sequence to retain peak cognitive execution.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
