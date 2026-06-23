/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  title: string;
  dueDate: string; // ISO String or YYYY-MM-DDTHH:MM
  importance: "high" | "normal";
  estimatedTime: number; // in minutes
  notes: string;
  completed: boolean;
  category: "assignment" | "meeting" | "bill" | "interview" | "other";
  priorityScore?: number; // 1 to 100 assigned by AI
  quadrant?: number; // 1 to 4 assigned by AI (Eisenhower quadrants)
  explanation?: string; // custom explanation by AI
  delayRisk?: number; // 0 to 100% estimated delay risk
  delayReasoning?: string; // AI analysis of delay probability
}

export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  completedDates: string[]; // ISO YYYY-MM-DD strings
  streak: number;
  category: "study" | "health" | "organization" | "mindset";
  aiCoachingTip?: string; // Lumina's dynamic advice for keeping this streak alive
}

export interface SmartReminder {
  id: string;
  taskId?: string; // Optional target task
  habitId?: string; // Optional target habit
  title: string;
  message: string;
  type: "warning" | "nudge" | "celebration" | "delay_alert";
  timestamp: string; // ISO string or human relative time
  isRead: boolean;
  actionLabel?: string; // e.g., "Enter Rescue Mode", "Complete Habit"
}

export interface RescueStep {
  id: string;
  title: string;
  duration: number; // in minutes
  description: string;
  mentalFocus: string;
  completed?: boolean;
}

export interface ActiveRescue {
  task: Task;
  steps: RescueStep[];
  currentStepIndex: number;
  timeRemaining: number; // in seconds
  isRunning: boolean;
}

export interface ChatMessage {
  sender: "user" | "coach";
  text: string;
  timestamp: string;
}

export interface TimeBlock {
  time: string; // HH:MM
  duration: number; // in minutes
  taskId: string; // Reference to task.id, or "rest", "admin"
  activityName: string;
  type: "task" | "rest" | "admin";
}

export interface User {
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

