import React, { useState, useEffect } from "react";
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
  AlertCircle,
  Check,
  LogOut,
  CalendarDays,
  ExternalLink,
  Lock,
  Plus,
  ArrowRight,
  RefreshCw,
  Copy
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

  // Google Calendar Integration States
  const [googleToken, setGoogleToken] = useState<string>("");
  const [googleClientId, setGoogleClientId] = useState<string>(
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || ""
  );
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncLog, setSyncLog] = useState<string>("");
  const [showClientInput, setShowClientInput] = useState<boolean>(false);
  const [confirmSyncModal, setConfirmSyncModal] = useState<boolean>(false);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);
  const [copiedRedirect, setCopiedRedirect] = useState<boolean>(false);

  const activeTasks = tasks.filter(t => !t.completed);

  // Listen for Google OAuth callback from the popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS' && event.data.accessToken) {
        const token = event.data.accessToken;
        setGoogleToken(token);
        fetchTodayEvents(token);
      } else if (event.data?.type === 'GOOGLE_OAUTH_ERROR') {
        setSyncStatus("error");
        setSyncLog(`Authentication failed: ${event.data.error}`);
      }
    };
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, []);

  const initiateGoogleAuth = () => {
    const trimmedClientId = googleClientId.trim();
    if (!trimmedClientId || trimmedClientId.includes("-example") || trimmedClientId === "") {
      setSyncLog("Authentication failed: Google OAuth Client ID is missing.");
      setSyncStatus("error");
      setShowSetupGuide(true);
      return;
    }
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scopes = "https://www.googleapis.com/auth/calendar.events";
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(trimmedClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&include_granted_scopes=true` +
      `&state=google_calendar_auth`;

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    let popup: Window | null = null;
    try {
      popup = window.open(
        authUrl,
        "google_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left}`
      );
    } catch (err: any) {
      console.error("Popup blocked or disallowed by sandbox:", err);
    }

    if (!popup) {
      setSyncLog("Popup blocked. Please enable popups for this app to authenticate.");
      setSyncStatus("error");
    } else {
      setSyncLog("Authenticating Google Account...");
      setSyncStatus("syncing");
    }
  };

  const fetchTodayEvents = async (token: string) => {
    setSyncStatus("syncing");
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` + 
        `timeMin=${encodeURIComponent(todayStart.toISOString())}` +
        `&timeMax=${encodeURIComponent(todayEnd.toISOString())}` +
        `&singleEvents=true` +
        `&orderBy=startTime`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Calendar API status: ${response.status}`);
      }
      const data = await response.json();
      setCalendarEvents(data.items || []);
      setSyncStatus("idle");
      setSyncLog("Successfully fetched Google Calendar events.");
    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      setSyncLog(`Fetch error: ${err.message || err}`);
    }
  };

  const handleSyncSubmit = async () => {
    if (timeBlocks.length === 0 || !googleToken) return;
    setSyncStatus("syncing");
    setSyncLog("Exporting segmented time blocks...");
    
    let successCount = 0;
    let failCount = 0;

    for (const block of timeBlocks) {
      try {
        const now = new Date();
        let hourVal = 8;
        let minVal = 0;

        const cleanedTime = block.time.trim();
        const match12 = cleanedTime.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
        const match24 = cleanedTime.match(/^(\d+):(\d+)$/);

        if (match12) {
          let hr = parseInt(match12[1], 10);
          const mn = parseInt(match12[2], 10);
          const ampm = match12[3].toUpperCase();
          if (ampm === "PM" && hr < 12) hr += 12;
          if (ampm === "AM" && hr === 12) hr = 0;
          hourVal = hr;
          minVal = mn;
        } else if (match24) {
          hourVal = parseInt(match24[1], 10);
          minVal = parseInt(match24[2], 10);
        }

        const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hourVal, minVal, 0);
        const endTime = new Date(startTime.getTime() + block.duration * 60 * 1000);

        const eventBody = {
          summary: `Lumina: ${block.activityName}`,
          description: `Automatically scheduled study/work focus segment.\nDuration: ${block.duration} minutes\nSegment Style: ${block.type}`,
          start: { dateTime: startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
          reminders: { useDefault: true }
        };

        const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(eventBody)
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    setConfirmSyncModal(false);
    setSyncStatus("success");
    setSyncLog(`Export finished. Added ${successCount} events to Google Calendar.`);
    
    // Refresh events list
    fetchTodayEvents(googleToken);
  };

  const handleDisconnect = () => {
    setGoogleToken("");
    setCalendarEvents([]);
    setSyncStatus("idle");
    setSyncLog("Google Calendar disconnected.");
  };

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
        return "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 border-l-4 border-l-indigo-500 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/50";
      case "rest":
        return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200 border-l-4 border-l-emerald-500 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/50";
      case "admin":
        return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-indigo-900/60 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500 hover:bg-amber-100/60 dark:hover:bg-amber-950/50";
      default:
        return "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 hover:bg-slate-100/60";
    }
  };

  const getBlockIcon = (type: TimeBlock["type"]) => {
    switch (type) {
      case "task":
        return <CalendarCheck className="w-4 h-4 text-indigo-500" />;
      case "rest":
        return <Coffee className="w-4 h-4 text-emerald-500" />;
      case "admin":
        return <Briefcase className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const hoursRange = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <div id="scheduler-section" className="space-y-6">
      
      {/* Configuration grid */}
      <div className="bg-white/70 dark:bg-slate-900/85 backdrop-blur-md p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-emerald-500" />
            AI Day-Structuring Optimizer
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automatically slot tasks into active daylight segments with dynamic restorative loops.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350 text-xs font-semibold">
            <span>Range:</span>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              {[6,7,8,9,10,11,12].map(h => (
                <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" key={h} value={h}>{String(h).padStart(2, "0")}:00 AM</option>
              ))}
            </select>
            <span>to</span>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              {[15,16,17,18,19,20,21,22,23,24].map(h => (
                <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" key={h} value={h}>
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
        <div className="bg-emerald-50/55 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl flex items-start gap-2.5 shadow-sm">
          <Brain className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
            <span className="font-bold">Lumina's Timing Insight:</span> {scheduleInsight}
          </p>
        </div>
      )}

      {/* Scheduler main display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left column: Visual hourly blocks timeline */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Today's Segmented Grid</h4>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {String(hoursRange.length)} Active Hours planned
            </span>
          </div>

          {timeBlocks.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
              <Compass className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chronological calendar is un-blocked</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Click <span className="font-semibold text-violet-600 dark:text-violet-400">"AI Time-Blocking Schedule"</span> to let the companion distribute tasks into high-performance bursts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeBlocks.map((block, idx) => (
                <div
                  key={block.taskId + idx}
                  className={`flex items-stretch gap-4 p-3.5 border rounded-2xl transition-all ${getBlockStyle(block.type)}`}
                >
                  <div className="w-16 flex flex-col justify-center shrink-0 border-r border-slate-200/50 dark:border-slate-850 pr-2">
                    <span className="text-xs font-bold tracking-tight font-mono text-slate-700 dark:text-slate-300">
                      {block.time}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase mt-0.5">
                      {block.duration} MIN
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-white dark:bg-slate-950 rounded-xl shadow-xs border border-slate-100/40 dark:border-slate-800/45">
                        {getBlockIcon(block.type)}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-200">
                          {block.activityName}
                        </h4>
                        <span className="text-[10px] font-medium opacity-70 uppercase tracking-widest">
                          {block.type} segment
                        </span>
                      </div>
                    </div>

                    {block.type === "rest" && (
                      <span className="text-[10px] bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Recharge Wave
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Task checklist & Google Calendar Integration */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Google Calendar Integration Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              Google Calendar Sync
            </h4>

            {googleToken ? (
              /* Connected State */
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-150 dark:border-emerald-900/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Connected to Google</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition"
                    title="Disconnect account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Batch Export Button */}
                <button
                  onClick={() => setConfirmSyncModal(true)}
                  disabled={timeBlocks.length === 0 || syncStatus === "syncing"}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Sync Plan to Google Calendar</span>
                </button>

                {/* Today's Google Calendar Events fetched */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Today's Live Events
                    </span>
                    <button 
                      onClick={() => fetchTodayEvents(googleToken)} 
                      className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Refresh
                    </button>
                  </div>
                  
                  <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {calendarEvents.length === 0 ? (
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-550 italic py-2 text-center">No conflicting events on Google today.</p>
                    ) : (
                      calendarEvents.map((event: any, idx: number) => {
                        const start = event.start?.dateTime || event.start?.date || "";
                        const formattedTime = start ? new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "All-day";
                        return (
                          <div key={event.id || idx} className="p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-lg flex justify-between items-center">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{event.summary || "(No Title)"}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium">{formattedTime}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            ) : (
              /* Disconnected State */
              <div className="space-y-3.5 text-center py-2">
                <p className="text-xs text-slate-400 dark:text-slate-450 max-w-sm mx-auto leading-relaxed">
                  Authenticate your Google Account to automatically sync today's study block events and identify timing conflicts.
                </p>

                {/* Google Sign-in material styling button */}
                <button 
                  onClick={initiateGoogleAuth}
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 24 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Connect Google Calendar</span>
                </button>

                {(!googleClientId || googleClientId.includes("-example") || showSetupGuide) && (
                  <div className="mt-4 p-4 text-left bg-indigo-50/50 dark:bg-slate-950/75 border border-indigo-100 dark:border-slate-850 rounded-xl space-y-3 text-xs leading-normal animate-fade-in">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Google Calendar API Setup Required</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      To successfully link your personal Google Calendar, please configure an OAuth Client ID for your applet instance:
                    </p>
                    <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 text-[11px] space-y-1.5 pl-0.5">
                      <li>
                        Go to the <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-bold">Google Cloud Console <ExternalLink className="w-2.5 h-2.5 inline" /></a>
                      </li>
                      <li>
                        Create an <strong>OAuth Client ID</strong> credential configured for a <strong>Web Application</strong>.
                      </li>
                      <li>
                        Add this exact <strong>Authorized Redirect URI</strong>:
                        <div className="mt-1 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 font-mono text-[9px] text-slate-800 dark:text-slate-200">
                          <span className="truncate flex-1 select-all">{`${window.location.origin}/auth/callback`}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/auth/callback`);
                              setCopiedRedirect(true);
                              setTimeout(() => setCopiedRedirect(false), 2000);
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-500 transition flex items-center justify-center cursor-pointer shrink-0"
                            title="Copy to clipboard"
                          >
                            {copiedRedirect ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </li>
                      <li>
                        In AI Studio, open <strong>Settings &gt; Secrets</strong>, add a secret named <code>VITE_GOOGLE_CLIENT_ID</code>, and paste your client ID there!
                      </li>
                    </ol>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 border border-amber-100 dark:border-amber-900/30 rounded-lg font-medium leading-normal">
                      💡 Once added, refresh the page and click the sign-in button to connect instantly!
                    </p>
                  </div>
                )}
              </div>
            )}

            {syncLog && (
              <div className="text-[10px] p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-lg font-mono text-slate-600 dark:text-slate-300 truncate">
                {syncLog}
              </div>
            )}
          </div>

          {/* Pending Tasks Focus Check List */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm sticky top-24">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3">Tasks requiring focus slots</h4>
            <div className="space-y-2.5">
              {activeTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-550 italic">
                  No pending duties logged.
                </div>
              ) : (
                activeTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100/60 dark:border-slate-850">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[170px]">{t.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{t.estimatedTime} mins total</span>
                    </div>
                    {t.importance === "high" && (
                      <span className="text-[9px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded uppercase">
                        CRITICAL
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 p-3.5 bg-indigo-50/15 dark:bg-indigo-950/15 border border-indigo-100/80 dark:border-indigo-900/30 rounded-xl flex gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-indigo-800 dark:text-indigo-300 leading-normal font-medium">
                AI scheduler calculates optimal blocks based on priority matrices. Try to complete rest periods in sequence to retain peak cognitive execution.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Elegant Google Calendar Sync Confirmation Modal Overlay */}
      {confirmSyncModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            
            <div className="flex gap-3 items-start">
              <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-650 dark:text-indigo-400 shrink-0">
                <CalendarDays className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Export Plan to Google Calendar?</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                  Lumina will create fresh event slots on your main Google Calendar for the following planned blocks:
                </p>
              </div>
            </div>

            {/* List of items that will be synced */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl max-h-[180px] overflow-y-auto space-y-1.5 border border-slate-100 dark:border-slate-850 text-xs">
              {timeBlocks.map((block, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100/50 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{block.activityName}</span>
                    <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{block.type} Segment</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-black text-slate-600 dark:text-slate-300 block">{block.time}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-550">{block.duration} mins</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setConfirmSyncModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSyncSubmit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Confirm & Sync Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
