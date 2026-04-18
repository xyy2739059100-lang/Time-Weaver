import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const SUBJECT_COLORS: Record<string, string> = {
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

export const SUBJECT_TEXT_COLORS: Record<string, string> = {
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

export interface Task {
  id: string;
  title: string;
  subject: string;
  date: string;
  completed: boolean;
  priority: "低" | "中" | "高";
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
