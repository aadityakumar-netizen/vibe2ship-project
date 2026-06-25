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
    console.log("Gemini prioritize - activating robust local scheduler fallback strategy:", error?.message || error);
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
    console.log("Gemini rescue plan - activating beautiful offline micro-steps advisor simulator:", error?.message || error);
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
    console.log("Gemini schedule - activating smart offline Pomodoro blocks allocator fallback:", error?.message || error);
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

// Helper to parse chat messages offline and extract structures dynamically
function parseOfflineChatMessage(message: string, currentTasks: any[] = []) {
  const normalizedMsg = message.toLowerCase().trim();
  let reply = "";
  let action: string | null = null;
  let taskData: any = null;

  // Helper to strip common conversational fillers and extract the main focus topic
  const extractTopic = (msg: string) => {
    const fillers = [
      "how do i", "can you help me with", "what is", "i need to", "i want to",
      "how to", "please", "explain", "tell me about", "about", "the", "a", "an",
      "for", "to", "of", "in", "on", "at", "with", "can you", "could you",
      "do you know", "what is a", "what are", "why is", "why does", "define",
      "tell me", "suggest", "some", "any", "help", "with", "for", "study", "prep",
      "learn", "understand", "create", "write", "make", "build", "do"
    ];
    let words = msg.split(/\s+/);
    let clean = words.filter(w => !fillers.includes(w.toLowerCase()) && w.replace(/[^a-zA-Z0-9]/g, "").length > 1);
    if (clean.length > 0) {
      // Capitalize first letter of each word to look polished
      return clean.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ").replace(/[^a-zA-Z0-9\s]/g, "");
    }
    return "";
  };

  const topic = extractTopic(message);

  // 1. Check for Procrastination / Motivation request
  if (normalizedMsg.includes("procrastinat") || normalizedMsg.includes("motivation") || normalizedMsg.includes("get started") || normalizedMsg.includes("inertia") || normalizedMsg.includes("lazy")) {
    const topicContext = topic ? ` on "${topic}"` : "";
    reply = `Overcoming procrastination${topicContext} is less about willpower and more about managing your emotional resistance. Let's break that friction and build momentum:
    
• ⏱️ **The 2-Minute Rule**: Commit to working on your priority for just 120 seconds. Once you cross the friction of starting, momentum usually takes over.
• 🎯 **Micro-Sizing**: Break your tasks down until the next step is so small it feels almost ridiculous (e.g., "Open the document and write just one line").
• 🔇 **Distraction Quarantine**: Put your phone in another room and close all browser tabs unrelated to this specific action.

You have the power to break the inertia. What's the smallest step you can take right now?`;
    return { reply, action, taskData };
  }

  // 2. Check for Exam Stress / Anxiety / Grounding
  if (normalizedMsg.includes("stress") || normalizedMsg.includes("anxiety") || normalizedMsg.includes("calm") || normalizedMsg.includes("exam") || normalizedMsg.includes("test") || normalizedMsg.includes("panic") || normalizedMsg.includes("overwhelmed")) {
    const topicContext = topic ? ` regarding "${topic}"` : "";
    reply = `When stress is high and exams are looming, your brain's working memory gets crowded by anxiety. Let's run a cognitive cooling routine${topicContext}:

• 🌬️ **4-7-8 Breathing**: Inhale for 4 seconds, hold for 7, and exhale completely for 8. Repeat this 3 times to trigger your body's relaxation response.
• 📝 **The Brain Dump**: Spend 5 minutes writing down every single worry or formula swirling in your head onto a blank sheet of paper to clear mental bandwidth.
• 🔬 **High-Yield Practice**: Focus exclusively on active recall (testing yourself with quick questions) rather than passive, stressful rereading.

Take a deep breath. You are fully capable of handling this. How can we make your preparation feel more manageable?`;
    return { reply, action, taskData };
  }

  // 3. Check for Time Management / Prioritizing / Multiple Deadlines
  if (normalizedMsg.includes("priorit") || normalizedMsg.includes("multiple") || normalizedMsg.includes("deadline") || normalizedMsg.includes("time") || normalizedMsg.includes("manage")) {
    reply = `Facing multiple overlapping deadlines can feel paralyzing. Let's run a rapid triage strategy to organize your time:

• 🚨 **Urgency-Importance Triage**: Isolate your tasks by their true deadlines and impact. Put out the absolute biggest fires first, and defer the rest.
• 📦 **Time-Blocking**: Allocate distinct, non-overlapping 30-minute focus blocks for a single task. Multitasking is a myth that drains cognitive energy.
• 🛑 **Rule of Three**: Select exactly 3 critical accomplishments for today. Ignore everything else until those are ticked off.

Let's prioritize right now. Which of your current deadlines is putting the most pressure on you?`;
    return { reply, action, taskData };
  }

  // 3. Check for specific subject study / prep help (Math, Science, Coding, etc.)
  const isStudy = normalizedMsg.includes("study") || normalizedMsg.includes("prep") || normalizedMsg.includes("learn") || normalizedMsg.includes("understand") || normalizedMsg.includes("explain") || normalizedMsg.includes("how do") || normalizedMsg.includes("what is");
  
  if (isStudy || normalizedMsg.includes("break down") || normalizedMsg.includes("blueprint") || normalizedMsg.includes("quiz") || normalizedMsg.includes("test") || normalizedMsg.includes("exam")) {
    const focusSubject = topic ? topic : "your current focus";
    
    // Customize study blueprints based on keywords!
    if (normalizedMsg.includes("code") || normalizedMsg.includes("coding") || normalizedMsg.includes("program") || normalizedMsg.includes("software") || normalizedMsg.includes("javascript") || normalizedMsg.includes("python") || normalizedMsg.includes("html") || normalizedMsg.includes("css") || normalizedMsg.includes("react")) {
      reply = `Let's get you locked into learning and mastering **${focusSubject}**! For software and programming, hands-on debugging beats passive reading every time. Here is your tactical sprint blueprint:

• 💻 Block 1 (40 mins) - Practice-Driven Learning: Open your editor. Write the smallest possible working prototype of the concept you are learning. Intentionally break it to see the error output.
• ☕ Block 2 (10 mins) - Cognitive Cooling: Step away from all screens. Hydrate and let your brain's diffuse mode process the logic.
• 🔍 Block 3 (40 mins) - Iterative Upgrade: Refactor your code. Add comments explaining *how* it works to reinforce understanding.
• 🚀 Block 4 (10 mins) - Mini-Review: Commit or save your work. You are building real momentum!`;
    } else if (normalizedMsg.includes("math") || normalizedMsg.includes("calculus") || normalizedMsg.includes("algebra") || normalizedMsg.includes("physics") || normalizedMsg.includes("stats") || normalizedMsg.includes("statistics") || normalizedMsg.includes("chemistry")) {
      reply = `Let's tackle **${focusSubject}** step-by-step! Quantitative subjects require high-bandwidth problem solving rather than simple memorization. Here is your custom formula-busting sprint:

• 📝 Block 1 (45 mins) - Active Recall: Go straight to practice questions or past quizzes. Highlight key formulas or mistakes immediately.
• 💧 Block 2 (15 mins) - Brain Rehydration: Stand up, stretch, and let your brain consolidate the formulas.
• ⚡ Block 3 (45 mins) - Targeted Review: Focus exclusively on the weak formulas or concepts discovered in Block 1. Break them down into basic steps.
• 🧠 Block 4 (15 mins) - Brain Dump: On a blank sheet of paper, write everything you remember about the formulas from memory.`;
    } else if (normalizedMsg.includes("write") || normalizedMsg.includes("essay") || normalizedMsg.includes("history") || normalizedMsg.includes("english") || normalizedMsg.includes("literature") || normalizedMsg.includes("paper") || normalizedMsg.includes("read") || normalizedMsg.includes("reading")) {
      reply = `Let's conquer your writing and analytical prep for **${focusSubject}**! The hardest part of writing is the blank page syndrome. Here is your frictionless writing roadmap:

• 🗺️ Block 1 (30 mins) - Structural Outline: Write down your thesis statement and 3 supporting bullet points. Do not write full paragraphs yet.
• 🚶 Block 2 (10 mins) - Physical Reset: Walk around, stretch. Disconnect from the screen to let your narrative flow.
• ✍️ Block 3 (50 mins) - The Vomit Draft: Write as fast as you can without looking back, erasing, or editing. Just get the words down!
• ✂️ Block 4 (15 mins) - Sculpting and Polish: Now read it aloud and trim the fluff. You've broken the friction!`;
    } else {
      reply = `I would love to help you understand and master **${focusSubject}**! When working under a deadline, high-efficiency learning techniques are essential. Here is your custom tactical blueprint:

• 🧠 Block 1 (35 mins) - Active Recall: Test yourself with flashcards or practice questions immediately to find where your gaps are.
• 🍃 Block 2 (10 mins) - Decompression: Take a short break, stretch your shoulders, and breathe deeply.
• 🎯 Block 3 (45 mins) - High-Yield Review: Study only the parts you got wrong or don't understand, explaining them aloud to yourself (the Feynman Technique).
• 📝 Block 4 (10 mins) - Reflection: Write down the top 3 key takeaways from memory.`;
    }
    
    return { reply, action, taskData };
  }

  // 4. Check if they are trying to ADD a task (Autonomous Deadline Extraction NLP)
  const addKeywords = ["add", "new", "create", "todo", "task", "deadline", "session", "have to", "need to", "got to", "due", "schedule", "register", "insert"];
  const matchesAdd = addKeywords.some(keyword => normalizedMsg.includes(keyword));

  if (matchesAdd) {
    // Basic NLP extraction
    let title = topic ? topic : "Custom Urgent Chore";
    let estimatedTime = 45;
    let importance: "high" | "normal" = "normal";
    let category: "assignment" | "meeting" | "bill" | "interview" | "other" = "assignment";

    // Extract title more specifically if possible
    const words = message.split(" ");
    const cleanWords = words.filter(w => !addKeywords.includes(w.toLowerCase()) && w.toLowerCase() !== "a" && w.toLowerCase() !== "the" && w.toLowerCase() !== "for" && w.toLowerCase() !== "to" && w.toLowerCase() !== "i");
    if (cleanWords.length > 0) {
      title = cleanWords.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }

    // Extract duration estimation
    const timeMatch = normalizedMsg.match(/(\d+)\s*(min|hour|hr)/);
    if (timeMatch) {
      const val = parseInt(timeMatch[1]);
      const unit = timeMatch[2];
      estimatedTime = (unit.startsWith("hour") || unit.startsWith("hr")) ? val * 60 : val;
    } else if (normalizedMsg.includes("quick")) {
      estimatedTime = 15;
    } else if (normalizedMsg.includes("long")) {
      estimatedTime = 120;
    }

    // Extract risk/importance
    if (normalizedMsg.includes("urgent") || normalizedMsg.includes("critical") || normalizedMsg.includes("panic") || normalizedMsg.includes("important") || normalizedMsg.includes("high") || normalizedMsg.includes("danger") || normalizedMsg.includes("risk")) {
      importance = "high";
    }

    // Extract category
    if (normalizedMsg.includes("bill") || normalizedMsg.includes("pay") || normalizedMsg.includes("rent")) {
      category = "bill";
    } else if (normalizedMsg.includes("meeting") || normalizedMsg.includes("talk") || normalizedMsg.includes("call")) {
      category = "meeting";
    } else if (normalizedMsg.includes("interview") || normalizedMsg.includes("pitch") || normalizedMsg.includes("job")) {
      category = "interview";
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    const dueDateStr = tomorrow.toISOString().slice(0, 16);

    action = "add_task";
    taskData = {
      id: "offline_parsed_" + Math.random().toString(36).substring(2, 9),
      title,
      notes: `Autonomous NLP structured by Lumina Coach from: "${message}"`,
      dueDate: dueDateStr,
      importance,
      estimatedTime,
      category
    };

    reply = `I've successfully processed your request to add a commitment! I detected "${title}" as a ${importance === "high" ? "high-priority" : "regular-priority"} task with an estimated time of ${estimatedTime} minutes. 

Confirm this autonomous envelope below to add it directly to your agenda!`;

    return { reply, action, taskData };
  }

  // 5. Default friendly chat coaching response (dynamic, mirrors the user's focus topic)
  if (topic && topic.length > 2) {
    const motivationalOpeners = [
      `I hear you loud and clear on **${topic}**. Procrastination usually isn't about laziness—it's about emotional resistance to the task. Let's make the entry point as tiny and friction-free as possible.`,
      `Let's talk about **${topic}**. When deadlines are looming, our brains try to escape into busywork. What is the single absolute smallest step you can take right now to break the inertia?`,
      `Focusing on **${topic}** can feel like a mountain, but we don't have to climb it all at once. Let's carve out a quick 15-minute high-momentum sprint.`,
      `Ah, **${topic}**! A classic high-leverage objective. Let's bypass the mental debate. What is a 5-minute action you can take on this right now without worrying about it being perfect?`
    ];
    // Select deterministic response based on length of topic to make it feel natural but reproducible
    const index = topic.length % motivationalOpeners.length;
    reply = `${motivationalOpeners[index]}

To make progress immediately:
• Type **"break down ${topic}"** to get a custom learning/execution sprint.
• Or tell me to **"add task ${topic}"** to log this directly to your core agenda!`;
  } else {
    reply = `I am listening, and I've got your back! When stress is high, our working memory shrinks, making everything feel twice as hard. Let's tackle your priorities one at a time.

To get started, tell me what you're working on:
• Tell me what you need help with, like **"procrastination"** or **"exam stress"**.
• Ask me to **"break down [subject]"** for a tailored study blueprint.
• Or tell me to **"add task [your commitment]"** to structure your schedule instantly!`;
  }

  return { reply, action, taskData };
}

// API 4: Companion Chat with Smart Command Extractor
app.post("/api/gemini/chat", async (req, res) => {
  const { message, chatHistory, currentTasks } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message text" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Beautiful local brain fallback simulation
    console.log("No GEMINI_API_KEY found, running beautiful smart rule-based parser fallback");
    const offlineResult = parseOfflineChatMessage(message, currentTasks);
    return res.json({
      reply: offlineResult.reply,
      action: offlineResult.action,
      taskData: offlineResult.taskData
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
    console.log("Gemini chat - activating beautiful offline AI counselor simulator fallback:", error?.message || error);
    const offlineResult = parseOfflineChatMessage(message, currentTasks);
    res.json({
      reply: offlineResult.reply,
      action: offlineResult.action,
      taskData: offlineResult.taskData,
      isFallback: true
    });
  }
});

// Helper for offline Study Planner fallbacks
function generateLocalBlueprint(subject: string, profile: string, style: string, hours: number) {
  const mins = (hours || 1) * 60;
  const sessions: any[] = [];
  
  let currentMin = 0;
  let index = 1;
  
  let studyLen = 25;
  let breakLen = 5;
  
  if (profile === "Ultradian (90/20)") {
    studyLen = 90;
    breakLen = 20;
  } else if (profile === "Deep-Focus (50/10)") {
    studyLen = 50;
    breakLen = 10;
  } else if (profile === "Immersion") {
    studyLen = 110;
    breakLen = 10;
  }

  while (currentMin < mins) {
    // Add study block
    const actualStudy = Math.min(studyLen, mins - currentMin);
    if (actualStudy > 0) {
      const startStr = `${Math.floor(currentMin / 60)}h ${currentMin % 60}m`;
      const endStr = `${Math.floor((currentMin + actualStudy) / 60)}h ${(currentMin + actualStudy) % 60}m`;
      sessions.push({
        time: `${startStr} - ${endStr}`,
        type: "study",
        duration: actualStudy,
        focusTopic: `Deep Focus Segment #${index}: Mastering core parts of ${subject || "General Study"}`,
        activeTechnique: `Active absorption using ${style || "Feynman active explanation"}`
      });
      currentMin += actualStudy;
    }

    // Add break block
    const actualBreak = Math.min(breakLen, mins - currentMin);
    if (actualBreak > 0) {
      const startStr = `${Math.floor(currentMin / 60)}h ${currentMin % 60}m`;
      const endStr = `${Math.floor((currentMin + actualBreak) / 60)}h ${(currentMin + actualBreak) % 60}m`;
      sessions.push({
        time: `${startStr} - ${endStr}`,
        type: "break",
        duration: actualBreak,
        focusTopic: "Restorative Cognitive Reset & Stretch Break",
        activeTechnique: "Hydrate, release eye strain, perform box breathing"
      });
      currentMin += actualBreak;
      index++;
    }
  }

  return {
    subjectName: subject || "Custom Study Sprint",
    styleOverview: `Synchronized ${profile || "Pomodoro"} schedule utilizing ${style || "Active Recall"} for high-retention performance.`,
    sessions,
    milestones: [
      `Absorb and outline first major concept of ${subject || "study module"}`,
      `Test recall and resolve gaps in understanding during active intervals`,
      `Synthesize focus outcomes into a summary sheet`
    ]
  };
}

// Helper for offline Multi-Day study planner fallback
function generateLocalMultiDayBlueprint(subject: string, style: string, targetDaysNum?: number) {
  const normalized = subject.toLowerCase();
  
  // Try to parse days from subject name (e.g. "DSA exam in 10 days")
  let days = targetDaysNum || 10;
  const match = subject.match(/(\d+)\s*days?/i);
  if (match) {
    days = parseInt(match[1], 10);
  }
  
  // Bound days to realistic range
  if (days < 1) days = 5;
  if (days > 30) days = 30;

  const multiDayPlan: any[] = [];
  
  // Check for common subjects to make local plan highly accurate
  const isDSA = normalized.includes("dsa") || normalized.includes("data structure") || normalized.includes("algorithm") || normalized.includes("aktu");
  const isMath = normalized.includes("math") || normalized.includes("calculus") || normalized.includes("algebra") || normalized.includes("physics");
  const isCoding = normalized.includes("code") || normalized.includes("coding") || normalized.includes("react") || normalized.includes("javascript") || normalized.includes("web") || normalized.includes("python");
  const isWeb = normalized.includes("web") || normalized.includes("html") || normalized.includes("css") || normalized.includes("development");

  // Base topic generation
  for (let d = 1; d <= days; d++) {
    let title = "";
    let topics: string[] = [];
    let technique = "";
    
    if (isDSA) {
      const pct = (d - 1) / (days - 1 || 1);
      if (pct < 0.1) {
        title = "Arrays & Memory Layout";
        topics = ["1D and 2D Arrays", "Dynamic Sizing", "Address Calculation"];
        technique = "Solve 3 basic array reversal and search questions.";
      } else if (pct < 0.2) {
        title = "Linked Lists";
        topics = ["Singly Linked List", "Doubly Linked List", "Pointer Manipulation"];
        technique = "Draw list mutations on paper before translating to code.";
      } else if (pct < 0.3) {
        title = "Stacks & Expressions";
        topics = ["Stack Push/Pop", "Infix to Postfix", "Parenthesis Matching"];
        technique = "Dry-run a recursion stack mentally to visualize LIFO.";
      } else if (pct < 0.4) {
        title = "Queues & Priority Queues";
        topics = ["Circular Queue", "Deque", "Priority Queue Implementation"];
        technique = "Simulate sliding window queue elements.";
      } else if (pct < 0.5) {
        title = "Binary Trees";
        topics = ["Tree Traversals (Pre/In/Post)", "Height of Tree", "Leaf Count"];
        technique = "Write down recursive tree relations carefully.";
      } else if (pct < 0.6) {
        title = "Binary Search Trees (BST)";
        topics = ["BST Insertion/Deletion", "Inorder Successor", "Search Efficiency"];
        technique = "Implement standard BST insert function.";
      } else if (pct < 0.7) {
        title = "Heaps & Balanced Trees";
        topics = ["Min/Max Heap", "Heapify Algorithm", "AVL Trees intro"];
        technique = "Verify heap property after every insert operation.";
      } else if (pct < 0.8) {
        title = "Graphs & Representations";
        topics = ["Adjacency Matrix/List", "BFS Traversal", "DFS Traversal"];
        technique = "Trace graph traversals using a visited set.";
      } else if (pct < 0.9) {
        title = "Greedy & Dynamic Programming";
        topics = ["Overlapping Subproblems", "Memoization", "Knapsack/Fibonacci"];
        technique = "Build tabular states sequentially for DP.";
      } else {
        title = "Sorting, Searching & Final Review";
        topics = ["QuickSort/MergeSort", "Binary Search", "Mock Exam Problems"];
        technique = "Time yourself on 3 standard exam challenges.";
      }
    } else if (isMath) {
      const pct = (d - 1) / (days - 1 || 1);
      if (pct < 0.2) {
        title = "Foundational Formulas & Axioms";
        topics = ["Basic Definitions", "Formula Derivations", "Initial Practice Sets"];
        technique = "Active derivation of key equations without looking.";
      } else if (pct < 0.5) {
        title = "Core Problem-Solving Sprint";
        topics = ["Intermediate Equations", "Special Cases", "Boundary Conditions"];
        technique = "Solve 5 problems with increasing complexity.";
      } else if (pct < 0.8) {
        title = "Advanced Techniques & Proofs";
        topics = ["Theorems Application", "Analytical Proofs", "Complex Scenarios"];
        technique = "Explain the logic of a complex proof to an imaginary student.";
      } else {
        title = "Syllabus Review & Cheat Sheet Dump";
        topics = ["Past Exam Quizzes", "Time-Constrained Test", "Formula Sheet Check"];
        technique = "Write down every major formula on a blank sheet in 10 minutes.";
      }
    } else if (isCoding || isWeb) {
      const pct = (d - 1) / (days - 1 || 1);
      if (pct < 0.2) {
        title = "Syntax & Environment Setup";
        topics = ["Core Statements", "Local Project Scaffolding", "Hello World Tests"];
        technique = "Intentionally create errors to see compiler message logs.";
      } else if (pct < 0.5) {
        title = "Logic Flow & Custom Modules";
        topics = ["State Handling", "Reusable Helpers", "Component Architecture"];
        technique = "Build a micro-project applying the component pattern.";
      } else if (pct < 0.8) {
        title = "Integration & Data Flow";
        topics = ["API Requests", "State Synchronization", "Form Validations"];
        technique = "Construct a secure mockup endpoint to test responses.";
      } else {
        title = "Refactoring, Optimization & Deploy";
        topics = ["Performance Tuning", "Linter Cleanups", "Production Builds"];
        technique = "Run production builds locally and resolve warnings.";
      }
    } else {
      const pct = (d - 1) / (days - 1 || 1);
      if (pct < 0.25) {
        title = "Overview & Key Terms";
        topics = ["Core Vocabulary", "Introductory Material", "Context Mapping"];
        technique = "Feynman Technique: Define 5 terms in simple sentences.";
      } else if (pct < 0.5) {
        title = "Deep Concepts Analysis";
        topics = ["Primary Mechanics", "Historical Context", "Causal Relationships"];
        technique = "Mindmap the connections between the major entities.";
      } else if (pct < 0.75) {
        title = "Secondary Content & Gaps Review";
        topics = ["Niche Sub-categories", "Supporting Arguments", "Contrasting Theories"];
        technique = "Answer practice questions focusing on secondary items.";
      } else {
        title = "Syllabus Recall & Summary Sheets";
        topics = ["Full Syllabus Recap", "High-Yield Summary", "Simulated Quiz"];
        technique = "Perform a 15-minute complete brain-dump of all topics.";
      }
    }

    multiDayPlan.push({
      dayNumber: d,
      title: `Day ${d}: ${title}`,
      topics,
      technique,
      durationMinutes: 120
    });
  }

  return {
    subjectName: subject,
    styleOverview: `Autonomous ${days}-Day Preparatory Blueprint custom tailored for high-retention mastery using ${style || "Active Recall"}.`,
    planType: "multi",
    multiDayPlan,
    milestones: [
      `Complete foundations (Days 1-${Math.ceil(days * 0.3)})`,
      `Consolidate core principles (Days ${Math.ceil(days * 0.3) + 1}-${Math.ceil(days * 0.7)})`,
      `Execute comprehensive review and simulated practice (Days ${Math.ceil(days * 0.7) + 1}-${days})`
    ]
  };
}

// Google OAuth callback endpoint (works flawlessly in sandboxed browser popups)
app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
  res.send(`
    <html>
      <head>
        <title>OAuth Completion</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; background: #fafafa; color: #333; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <p>Completing Google authentication...</p>
        <script>
          // Google sends token in the hash (#access_token=...)
          const hash = window.location.hash;
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const error = params.get('error');
          if (window.opener) {
            if (accessToken) {
              window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', accessToken }, '*');
            } else if (error) {
              window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error }, '*');
            }
            setTimeout(() => { window.close(); }, 1200);
          } else {
            // Fallback if opened directly
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// API 5: AI Study Blueprint Generator
app.post("/api/gemini/study-blueprint", async (req, res) => {
  const { studySubject, studyProfile, cognitiveStyle, availableHours, planType, targetDays } = req.body;
  
  const ai = getGeminiClient();
  const isMultiDay = planType === "multi" || /in\s+\d+\s+days/i.test(studySubject || "") || /\d+\s*days?/i.test(studySubject || "");

  if (!ai) {
    console.log("Gemini study blueprint - using robust offline compiler strategy");
    if (isMultiDay) {
      return res.json(generateLocalMultiDayBlueprint(studySubject, cognitiveStyle, targetDays));
    }
    return res.json(generateLocalBlueprint(studySubject, studyProfile, cognitiveStyle, availableHours));
  }

  try {
    let prompt = "";
    if (isMultiDay) {
      // Determine the target days from parameter or parse it from the string
      let days = targetDays || 10;
      const match = (studySubject || "").match(/(\d+)\s*days?/i);
      if (match) {
        days = parseInt(match[1], 10);
      }
      if (days < 1) days = 5;
      if (days > 30) days = 30;

      prompt = `You are Lumina, the AI Study & Focus Architecture Engine.
Create an optimized, day-by-day study/prep timeline for a multi-day focus:
- Subject/Goal: "${studySubject}" (e.g. "AKTU DSA exam in 10 days")
- Cognitive Style/Focus Strategy: "${cognitiveStyle}" (e.g. Active Recall, Feynman Technique)
- Duration: ${days} days

You must respond with a strictly valid JSON object matching this structure (no markdown code blocks, no backticks, only pure JSON):
{
  "subjectName": "string",
  "styleOverview": "string (1-2 sentences describing the overarching preparation strategy)",
  "planType": "multi",
  "multiDayPlan": [
    {
      "dayNumber": number (e.g. 1, 2, 3),
      "title": "string (e.g. Day 1: Arrays)",
      "topics": ["string (2-3 detailed subtopics to learn or review on this day)"],
      "technique": "string (highly specific active technique or task for today's topics)",
      "durationMinutes": number (estimated minutes of focus for today, e.g. 120)
    }
  ],
  "milestones": [
    "string (2-3 macro-milestones, e.g. Finish all linear collections by Day 4)"
  ]
}

Ensure you generate EXACTLY ${days} day-by-day plan entries in the "multiDayPlan" array (one for each day from Day 1 to Day ${days}). Ensure focus topics are highly relevant and logical (e.g. for DSA, cover Arrays, Linked Lists, Stack, Queue, Trees, BST, Graphs, Sorting, etc.).`;
    } else {
      prompt = `You are Lumina, the AI Study & Focus Architecture Engine. 
Create an optimized, minute-by-minute study or work blueprint for:
- Subject/Topic: "${studySubject}"
- Sprint Profile: "${studyProfile}" (e.g., Pomodoro, Ultradian 90/20, Deep Focus)
- Cognitive Style: "${cognitiveStyle}" (e.g., Feynman Technique, Active Recall, Creative Brainstorm, Spaced Repetition)
- Available Time: ${availableHours} hour(s)

You must respond with a strictly valid JSON object matching this structure (no markdown code blocks, no backticks, only pure JSON):
{
  "subjectName": "string",
  "styleOverview": "string (1-2 sentences describing the cognitive focus strategy)",
  "planType": "single",
  "sessions": [
    {
      "time": "string (e.g., 00:00 - 00:25)",
      "type": "study" | "break",
      "duration": number (minutes),
      "focusTopic": "string",
      "activeTechnique": "string"
    }
  ],
  "milestones": [
    "string (2-3 measurable micro-milestones for this sprint)"
  ]
}

Ensure the sessions sum up to exactly ${availableHours * 60} minutes. Include refreshing break sessions. Ensure the focus topics are realistic and active techniques are highly practical based on the selected cognitive style "${cognitiveStyle}".`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    if (isMultiDay) {
      parsed.planType = "multi";
    } else {
      parsed.planType = "single";
    }
    res.json(parsed);
  } catch (error: any) {
    console.log("Gemini study-blueprint error - activating fallback compiler:", error?.message || error);
    if (isMultiDay) {
      res.json(generateLocalMultiDayBlueprint(studySubject, cognitiveStyle, targetDays));
    } else {
      res.json(generateLocalBlueprint(studySubject, studyProfile, cognitiveStyle, availableHours));
    }
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
