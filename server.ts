import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely inside routes or lazily to avoid crash on load
let aiClient: any = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST endpoints
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString()
  });
});

// API 1: Prioritize Tasks
app.post("/api/gemini/prioritize", async (req, res) => {
  const { tasks } = req.body;
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: "Missing or invalid tasks array" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant fallback simulation
    console.log("No GEMINI_API_KEY found, returning simulated prioritized results");
    const prioritizedTasks = tasks.map((t, idx) => {
      // Basic heuristic prioritization
      const dueHours = (new Date(t.dueDate).getTime() - new Date().getTime()) / 3600000;
      let priorityScore = 50;
      if (dueHours < 24) priorityScore += 40;
      else if (dueHours < 72) priorityScore += 20;
      if (t.importance === "high") priorityScore += 10;
      
      let quadrant = 3;
      if (t.importance === "high" && dueHours < 48) quadrant = 1; // Urgent/Important
      else if (t.importance === "high") quadrant = 2; // Not Urgent/Important
      else if (dueHours < 48) quadrant = 3; // Urgent/Not Important
      else quadrant = 4; // Not Urgent/Not Important

      const calculatedRisk = Math.min(95, Math.max(10, Math.round(90 - Math.max(0, dueHours) * 1.5 + (t.estimatedTime > 60 ? 15 : 0))));

      return {
        id: t.id,
        priorityScore: Math.min(100, Math.max(0, priorityScore)),
        quadrant,
        explanation: `Scheduled based on due date relative to today and its high importance marker. (Fallback Mode)`,
        delayRisk: calculatedRisk,
        delayReasoning: dueHours < 24 
          ? `High risk (${calculatedRisk}%): The extreme proximity to the deadline (only ${Math.max(1, Math.round(dueHours))} hours left!) coupled with natural starting friction makes deadline slip highly probable without structured Pomodoro blocks.`
          : `Moderate risk (${calculatedRisk}%): You have some breathing room, but the lack of an active scheduled slot means you're prone to putting this off until it becomes a last-minute crisis.`
      };
    });

    return res.json({
      prioritizedTasks: prioritizedTasks.sort((a, b) => b.priorityScore - a.priorityScore),
      coachInsight: "Hey! I've calculated a plan using local prioritizer heuristics. Configure your GEMINI_API_KEY in Settings > Secrets to unlock personalized cognitive reasoning and rescue strategies!",
      estimatedFrustrationFactor: 45
    });
  }

  try {
    const prompt = `You are the core prioritization matrix of 'The Last-Minute Life Saver' productivity app.
Given this list of upcoming tasks:
${JSON.stringify(tasks, null, 2)}

Analyze each task using these parameters:
1. Proximity to deadline (tasks due in <24 hours are critical threats!).
2. Stated Importance (high vs normal).
3. Practical Estimated Duration.
4. Calculated energy penalty.

Execute a smart sort. Return a JSON object with:
1. "prioritizedTasks": An array of objects matching each task's exact ID, assigning:
   - "priorityScore" (number 1-100 indicating critical risk & need to do first).
   - "quadrant" (number 1-4 for the Eisenhower Matrix: 1=Urgent+Important, 2=Not Urgent but Important, 3=Urgent but Not Important, 4=Neither).
   - "explanation" (a supportive, extremely specific micro-insight explaining exactly WHY this needs to be tackled in this order to save their skin).
   - "delayRisk" (number 1 to 100 indicating percentage probability that they will fail to submit or finish this task before its deadline without active intervention).
   - "delayReasoning" (a sharp, empathetic, highly personalized mini behavioral analysis of exactly what obstacle or custom psychological reason will cause them to delay or slip, e.g. "Stalling due to dread of initial drafting friction" or "Due to severe time-compression with only N hours left to complete a large task").
2. "coachInsight": A concise, empowering 2-sentence summary/strategy (from Lumina, the AI productivity coach) focusing on reducing panic, stopping procrastination, and highlighting the highest risk.
3. "estimatedFrustrationFactor": A rating from 1-100 of current schedule threat/stress.

Return strictly raw JSON format matching this schema:
{
  "prioritizedTasks": [
    { "id": "task_id_here", "priorityScore": 95, "quadrant": 1, "explanation": "...", "delayRisk": 82, "delayReasoning": "..." }
  ],
  "coachInsight": "...",
  "estimatedFrustrationFactor": 65
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini prioritize error (safely falling back to heuristics):", error);
    const prioritizedTasks = tasks.map((t, idx) => {
      const dueHours = (new Date(t.dueDate).getTime() - new Date().getTime()) / 3600000;
      let priorityScore = 50;
      if (dueHours < 24) priorityScore += 40;
      else if (dueHours < 72) priorityScore += 20;
      if (t.importance === "high") priorityScore += 10;
      
      let quadrant = 3;
      if (t.importance === "high" && dueHours < 48) quadrant = 1;
      else if (t.importance === "high") quadrant = 2;
      else if (dueHours < 48) quadrant = 3;
      else quadrant = 4;

      const calculatedRisk = Math.min(95, Math.max(10, Math.round(85 - Math.max(0, dueHours) * 1.2)));

      return {
        id: t.id,
        priorityScore: Math.min(100, Math.max(0, priorityScore)),
        quadrant,
        explanation: `Prioritized dynamically to target deadline proximity. (Level-Headed Alignment Fallback)`,
        delayRisk: calculatedRisk,
        delayReasoning: `Local prediction model estimates a ${calculatedRisk}% risk of procrastination due to upcoming deadline congestion combined with standard cognitive activation barriers.`
      };
    });

    res.json({
      prioritizedTasks: prioritizedTasks.sort((a, b) => b.priorityScore - a.priorityScore),
      coachInsight: "Lumina has aligned your agenda using local backup heuristic scores. The high demand is temporary, but your execution remains fully operational!",
      estimatedFrustrationFactor: 55,
      isFallback: true
    });
  }
});

// API 2: Generate Actionable Micro Rescue Plan
app.post("/api/gemini/rescue-plan", async (req, res) => {
  const { task } = req.body;
  if (!task) {
    return res.status(400).json({ error: "Missing task details" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Beautiful local mockup
    return res.json({
      steps: [
        {
          id: "step1",
          title: "Initial Setup and Zero Distraction prep",
          duration: 5,
          description: "Close all other browser tabs, set your phone on silent, grab a glass of water, and take 3 deep breaths.",
          mentalFocus: "Friction removal. Just get starting."
        },
        {
          id: "step2",
          title: `Tackle the absolute first core section of: ${task.title}`,
          duration: Math.max(10, Math.floor(task.estimatedTime * 0.4)),
          description: "Write down the skeletal structure or review key requirements. Focus purely on writing words or completing the primary task block without self-criticism.",
          mentalFocus: "Done is better than perfect."
        },
        {
          id: "step3",
          title: "Rapid Assembly and Drafting",
          duration: Math.max(10, Math.floor(task.estimatedTime * 0.4)),
          description: "Connect the dots, flesh out the details, review the rubric, or complete the visual layout.",
          mentalFocus: "High momentum."
        },
        {
          id: "step4",
          title: "Sloppy-Polish and Submission Prep",
          duration: Math.max(5, Math.floor(task.estimatedTime * 0.2)),
          description: "Double check main criteria points, ignore beautiful formatting unless graded, and press submit/complete right away.",
          mentalFocus: "Closure."
        }
      ],
      motivationalQuote: "You don't need perfect conditions to start, you just need a starting point. Let's do this!",
      estimatedSuccessChance: 85
    });
  }

  try {
    const prompt = `You are a high-performance productivity coach. Your job is to rescue a user who is in a high-stress, near-deadline panic.
They need to complete this task:
${JSON.stringify(task, null, 2)}

Generate an exact minutes-by-minutes "Last-Minute Micro-Rescue Plan".
Do NOT give generic or long plans. Break this down into 3-5 hyper-actionable, frictionless, sequential sub-steps. Each step must have:
- "id": a unique string (e.g. step_1, step_2)
- "title": very direct command (e.g. "Draft Outline", "Pay minimum amount")
- "duration": integer minute allocation
- "description": specific concrete action details explaining exactly how to execute without delay
- "mentalFocus": 4-word max mantra to keep focus

The total durational minutes should roughly fit their estimated time or scale it down if they are in an urgent pinch.
Also generate:
- "motivationalQuote": a powerful, calming, ultra-positive quote to break paralysis.
- "estimatedSuccessChance": an estimated percentage score (e.g., 90) of finishing if they start immediately.

Return strictly raw JSON format matching this schema:
{
  "steps": [
    { "id": "...", "title": "...", "duration": 15, "description": "...", "mentalFocus": "..." }
  ],
  "motivationalQuote": "...",
  "estimatedSuccessChance": 88
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini rescue plan error (safely falling back to live simulator):", error);
    res.json({
      steps: [
        {
          id: "step1",
          title: "Eliminate Local Distractions",
          duration: 5,
          description: "Mute your phone notifications, close extra tabs, fetch a drink, and state your target out loud to prime your attention.",
          mentalFocus: "Set the focus stage."
        },
        {
          id: "step2",
          title: `Outline & Complete Section One of "${task.title}"`,
          duration: Math.max(10, Math.floor((task.estimatedTime || 60) * 0.4)),
          description: "Get words down or start compiling elements immediately. Do not self-edit; simply build the baseline layout or answers.",
          mentalFocus: "Action overrides perfect planning."
        },
        {
          id: "step3",
          title: "Flesh Out and Connect Critical Parts",
          duration: Math.max(10, Math.floor((task.estimatedTime || 60) * 0.4)),
          description: "Synthesize findings, fill in the major requirements, and link separate items together. Run a quick checklist pass.",
          mentalFocus: "Relentless momentum, keep pushing."
        },
        {
          id: "step4",
          title: "Verify Core Goals & Submit",
          duration: Math.max(5, Math.floor((task.estimatedTime || 60) * 0.2)),
          description: "Confirm target requirements are fulfilled, resolve obvious flaws, and click submit/complete without hesitation.",
          mentalFocus: "Done is pure victory."
        }
      ],
      motivationalQuote: "Demand on our model is high, but your execution will not falter. Let's tackle this task piece by piece!",
      estimatedSuccessChance: 82,
      isFallback: true
    });
  }
});

// API 3: Schedule Time-Blocks
app.post("/api/gemini/auto-schedule", async (req, res) => {
  const { tasks, startHour, endHour } = req.body;
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "Invalid tasks" });
  }

  const activeStart = startHour || 9; // e.g. 9 AM
  const activeEnd = endHour || 21;   // e.g. 9 PM

  const ai = getGeminiClient();
  if (!ai) {
    // Beautiful mock-up allocator
    const blocks: any[] = [];
    let currentHour = activeStart;
    
    // Simple mock allocation
    tasks.forEach((task, index) => {
      if (currentHour < activeEnd) {
        const dur = Math.min(60, task.estimatedTime || 45);
        blocks.push({
          time: `${String(currentHour).padStart(2, '0')}:00`,
          duration: dur,
          taskId: task.id,
          activityName: task.title,
          type: "task"
        });
        currentHour += Math.ceil(dur / 60);

        // Add break
        if (currentHour < activeEnd) {
          blocks.push({
            time: `${String(currentHour).padStart(2, '0')}:00`,
            duration: 15,
            taskId: "rest",
            activityName: "Cognitive Breath & Hydration",
            type: "rest"
          });
          currentHour += 1;
        }
      }
    });

    return res.json({
      timeBlocks: blocks,
      scheduleInsight: "Automatic scheduling applied using high-efficiencyPomodoro pacing. (Offline Fallback Mode)"
    });
  }

  try {
    const prompt = `You are a scheduling AI assistant. Given a set of tasks:
${JSON.stringify(tasks, null, 2)}

Create an optimal hourly time-block plan for today, scheduling strictly between ${activeStart}:00 and ${activeEnd}:00.
Rule 1: Prioritize tasks with approaching deadlines.
Rule 2: Do not pile up more than 2 hours of heavy task loads without a 15-minute rest block.
Rule 3: Keep task blocks to realistic chunks (30-90 minutes).
Rule 4: Create brief rest or administrative blocks as needed.

Return a JSON object with:
- "timeBlocks": Array of block objects, each having:
  - "time": target string (HH:MM)
  - "duration": minutes (integer)
  - "taskId": id of the task relative to the input array (or "rest" for dynamic physical breaks, or "admin" for emails/general sorting)
  - "activityName": title of the task or name of break activity
  - "type": "task" | "rest" | "admin"
- "scheduleInsight": A 1-sentence analytical reason for why this layout helps avoid mental fatigue.

Return strictly raw JSON format matching this schema:
{
  "timeBlocks": [
    { "time": "09:00", "duration": 60, "taskId": "...", "activityName": "...", "type": "task" }
  ],
  "scheduleInsight": "..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini schedule error (safely falling back to local block allocator):", error);
    const blocks: any[] = [];
    let currentHour = activeStart;
    
    tasks.forEach((task, index) => {
      if (currentHour < activeEnd) {
        const dur = Math.min(60, task.estimatedTime || 45);
        blocks.push({
          time: `${String(currentHour).padStart(2, '0')}:00`,
          duration: dur,
          taskId: task.id,
          activityName: task.title,
          type: "task"
        });
        currentHour += Math.ceil(dur / 60);

        if (currentHour < activeEnd) {
          blocks.push({
            time: `${String(currentHour).padStart(2, '0')}:00`,
            duration: 15,
            taskId: "rest",
            activityName: "Cognitive Breath & Hydration",
            type: "rest"
          });
          currentHour += 1;
        }
      }
    });

    res.json({
      timeBlocks: blocks,
      scheduleInsight: "Lumina has balanced your daily routine using healthy pacing heuristics due to a temporary high demand constraint."
    });
  }
});

// API 4: Companion Chat with Smart Command Extractor
app.post("/api/gemini/chat", async (req, res) => {
  const { message, chatHistory, currentTasks } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message text" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Simulated coach response
    const normalizedMsg = message.toLowerCase();
    let reply = "I'm with you! I can hear your determination. Once you register your Gemini API Key in AI Studio Secrets, I'll be able to parse your messages into automatic calendar blocks and customized panic schedules. Until then, you can manually log tasks using the 'Add Task' button above!";
    let action = null;

    if (normalizedMsg.includes("todo") || normalizedMsg.includes("add") || normalizedMsg.includes("task")) {
      reply = "Hey! It looks like you're trying to add or plan a task. Since I am in offline simulation mode, please use the '+ Quick Add Task' form. To let me automatically extract deadlines, files, and verbal updates into live task lists, please configure your Gemini API Key in Settings > Secrets!";
    }

    return res.json({
      reply,
      action: null
    });
  }

  try {
    const prompt = `You are Lumina, the hyper-intelligent, calming, and proactive AI Companion inside 'The Last-Minute Life Saver' productivity app.
Your goals:
1. Provide highly reassuring, ultra-practical counsel to students, entrepreneurs, or professionals who are feeling overwhelmed or suffering from procrastination loops.
2. Be direct, solution-focused, and calming. Never say long preambles.
3. Keep answers under 3 sentences unless giving a specific rapid blueprint recipe.
4. IMPORTANT: Parse their statement to see if they are telling you about a NEW task or deadline they want to add, or if they are complaining about a specific current task.
   - If they describe a task like "Add math study session tomorrow at 4pm" or "I have a presentation due tomorrow morning, estimate 2 hours", extract it.
   - Set the response "action" to:
     - "add_task": if they want to add a task. In this case, populate "taskData" with:
       { "id": "generated_temp_id", "title": "parsed title", "notes": "parsed details", "dueDate": "YYYY-MM-DD or dynamic estimate", "importance": "high|normal", "estimatedTime": duration_in_minutes_integer }
     - "focus_task": if they want comfort or direction for an existing task. Identify the taskId in "taskId" and select a step suggestion.
     - null: if it's general advice or standard chat.

Current user tasks context:
${JSON.stringify(currentTasks || [], null, 2)}

Chat history:
${JSON.stringify(chatHistory || [], null, 2)}

User's message:
"${message}"

Return strictly raw JSON format matching this schema:
{
  "reply": " calming, supportive message here... ",
  "action": "add_task | focus_task | null",
  "taskData": { ... },
  "taskId": "..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini chat error (safely falling back to live simulator):", error);
    const normalizedMsg = message.toLowerCase();
    let reply = "I am with you. High server load on our AI engine won't block our progress! I'm here to support you in sorting out this crunch. What's the biggest bottleneck holding you back right now?";
    let action = null;

    if (normalizedMsg.includes("todo") || normalizedMsg.includes("add") || normalizedMsg.includes("task")) {
      reply = "I understand you're trying to schedule or register a task. While server demand is high, please use the '+ Emergency Task' button at the top header to manually secure your agenda, and we can immediately launch a custom rescue plan!";
    }

    res.json({
      reply,
      action: null,
      isFallback: true
    });
  }
});

// Configure Vite or Static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Last-Minute Life Saver dev server launched on http://localhost:${PORT}`);
  });
}

startServer();
