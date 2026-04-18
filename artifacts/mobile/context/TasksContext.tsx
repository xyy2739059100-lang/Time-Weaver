import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SubjectColor = keyof typeof SUBJECT_COLORS;

export const SUBJECT_COLORS: Record<string, string> = {
  math: "#BFD7FF",
  english: "#D1F2D3",
  history: "#FFF3C4",
  science: "#F2D9FF",
  art: "#FFD9D9",
  pe: "#D9F2F2",
  music: "#FFE8CC",
  cs: "#CCE5FF",
  other: "#E8E8E8",
};

export const SUBJECT_TEXT_COLORS: Record<string, string> = {
  math: "#1A4DB3",
  english: "#1A6B28",
  history: "#7A5C00",
  science: "#6B1A9E",
  art: "#9E1A1A",
  pe: "#1A6B6B",
  music: "#9E5C00",
  cs: "#004DA3",
  other: "#555555",
};

export interface Task {
  id: string;
  title: string;
  subject: string;
  date: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  notes?: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  subject: string;
  dayOfWeek: number;
  startHour: number;
  durationHours: number;
  color: string;
  textColor: string;
}

interface TasksContextValue {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  addTask: (task: Omit<Task, "id" | "completed">) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addTimeBlock: (block: Omit<TimeBlock, "id">) => void;
  editTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteTimeBlock: (id: string) => void;
  copyLastWeekBlocks: () => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

const TASKS_KEY = "@timeflow_tasks";
const BLOCKS_KEY = "@timeflow_blocks";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const storedTasks = await AsyncStorage.getItem(TASKS_KEY);
        const storedBlocks = await AsyncStorage.getItem(BLOCKS_KEY);
        if (storedTasks) setTasks(JSON.parse(storedTasks));
        if (storedBlocks) setTimeBlocks(JSON.parse(storedBlocks));
      } catch {}
    })();
  }, []);

  const saveTasks = useCallback(async (newTasks: Task[]) => {
    setTasks(newTasks);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(newTasks));
  }, []);

  const saveBlocks = useCallback(async (newBlocks: TimeBlock[]) => {
    setTimeBlocks(newBlocks);
    await AsyncStorage.setItem(BLOCKS_KEY, JSON.stringify(newBlocks));
  }, []);

  const addTask = useCallback(
    (task: Omit<Task, "id" | "completed">) => {
      const newTask: Task = { ...task, id: generateId(), completed: false };
      saveTasks([...tasks, newTask]);
    },
    [tasks, saveTasks]
  );

  const editTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      saveTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    },
    [tasks, saveTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      saveTasks(tasks.filter((t) => t.id !== id));
    },
    [tasks, saveTasks]
  );

  const toggleTask = useCallback(
    (id: string) => {
      saveTasks(
        tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );
    },
    [tasks, saveTasks]
  );

  const addTimeBlock = useCallback(
    (block: Omit<TimeBlock, "id">) => {
      const newBlock: TimeBlock = { ...block, id: generateId() };
      saveBlocks([...timeBlocks, newBlock]);
    },
    [timeBlocks, saveBlocks]
  );

  const editTimeBlock = useCallback(
    (id: string, updates: Partial<TimeBlock>) => {
      saveBlocks(
        timeBlocks.map((b) => (b.id === id ? { ...b, ...updates } : b))
      );
    },
    [timeBlocks, saveBlocks]
  );

  const deleteTimeBlock = useCallback(
    (id: string) => {
      saveBlocks(timeBlocks.filter((b) => b.id !== id));
    },
    [timeBlocks, saveBlocks]
  );

  const copyLastWeekBlocks = useCallback(() => {
    saveBlocks([...timeBlocks]);
  }, [timeBlocks, saveBlocks]);

  return (
    <TasksContext.Provider
      value={{
        tasks,
        timeBlocks,
        addTask,
        editTask,
        deleteTask,
        toggleTask,
        addTimeBlock,
        editTimeBlock,
        deleteTimeBlock,
        copyLastWeekBlocks,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
