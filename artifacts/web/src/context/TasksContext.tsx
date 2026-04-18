import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Priority = "高" | "中" | "低";
export type Subject = "数学" | "英语" | "历史" | "理科" | "艺术" | "体育" | "音乐" | "计算机" | "其他";

export interface Task {
  id: string;
  title: string;
  date: string;
  subject: Subject;
  priority: Priority;
  completed: boolean;
  note?: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  dayOfWeek: number;
  startHour: number;
  durationHours: number;
  color: string;
  textColor: string;
}

export const SUBJECT_COLORS: Record<Subject, string> = {
  数学: "#C4CDD6",
  英语: "#C8D4C4",
  历史: "#D8CCBC",
  理科: "#D0C4D4",
  艺术: "#D4C4C4",
  体育: "#C8D0C8",
  音乐: "#D8CCBC",
  计算机: "#C4CCCC",
  其他: "#D0CCCA",
};

export const SUBJECT_TEXT_COLORS: Record<Subject, string> = {
  数学: "#4A6070",
  英语: "#3A5A42",
  历史: "#6A5040",
  理科: "#5A4A6A",
  艺术: "#6A4444",
  体育: "#3A5A44",
  音乐: "#6A5040",
  计算机: "#3A5060",
  其他: "#5A5450",
};

export const BLOCK_COLORS = [
  { bg: "#C4CDD6", text: "#4A6070" },
  { bg: "#C8D4C4", text: "#3A5A42" },
  { bg: "#D0C4D4", text: "#5A4A6A" },
  { bg: "#D4C4C4", text: "#6A4444" },
  { bg: "#D8CCBC", text: "#6A5040" },
  { bg: "#C8D0C8", text: "#3A5A44" },
  { bg: "#C4CCCC", text: "#3A5060" },
];

interface TasksContextValue {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  addTask: (t: Omit<Task, "id" | "completed">) => void;
  editTask: (id: string, t: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addTimeBlock: (b: Omit<TimeBlock, "id">) => void;
  editTimeBlock: (id: string, b: Partial<TimeBlock>) => void;
  deleteTimeBlock: (id: string) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

const TASKS_KEY = "@timeflow_tasks";
const BLOCKS_KEY = "@timeflow_blocks";

function load<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => load(TASKS_KEY, []));
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => load(BLOCKS_KEY, []));

  useEffect(() => { save(TASKS_KEY, tasks); }, [tasks]);
  useEffect(() => { save(BLOCKS_KEY, timeBlocks); }, [timeBlocks]);

  const addTask = useCallback((t: Omit<Task, "id" | "completed">) => {
    setTasks(prev => [...prev, { ...t, id: Date.now().toString(), completed: false }]);
  }, []);

  const editTask = useCallback((id: string, t: Partial<Task>) => {
    setTasks(prev => prev.map(x => x.id === id ? { ...x, ...t } : x));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(x => x.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(x => x.id === id ? { ...x, completed: !x.completed } : x));
  }, []);

  const addTimeBlock = useCallback((b: Omit<TimeBlock, "id">) => {
    setTimeBlocks(prev => [...prev, { ...b, id: Date.now().toString() }]);
  }, []);

  const editTimeBlock = useCallback((id: string, b: Partial<TimeBlock>) => {
    setTimeBlocks(prev => prev.map(x => x.id === id ? { ...x, ...b } : x));
  }, []);

  const deleteTimeBlock = useCallback((id: string) => {
    setTimeBlocks(prev => prev.filter(x => x.id !== id));
  }, []);

  return (
    <TasksContext.Provider value={{
      tasks, timeBlocks,
      addTask, editTask, deleteTask, toggleTask,
      addTimeBlock, editTimeBlock, deleteTimeBlock,
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be inside TasksProvider");
  return ctx;
}
