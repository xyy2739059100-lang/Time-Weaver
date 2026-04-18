import React, { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Coffee } from "lucide-react";
import { useTasks, Task } from "@/context/TasksContext";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskModal } from "@/components/AddTaskModal";

const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_NAMES = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const PRIORITY_COLORS: Record<string, string> = { 高: "#B88A8A", 中: "#C4A882", 低: "#8FAF96" };

function fmt(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarView() {
  const { tasks, addTask, editTask, deleteTask, toggleTask } = useTasks();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const todayStr = fmt(now.getFullYear(), now.getMonth(), now.getDate());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [slideKey, setSlideKey] = useState(0);
  const prevDate = useRef(selectedDate);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
      if (!t.completed) {
        if (!map[t.date]) map[t.date] = [];
        map[t.date].push(t);
      }
    });
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(() =>
    tasks.filter(t => t.date === selectedDate).sort((a, b) => a.completed ? 1 : -1),
    [tasks, selectedDate]
  );

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectDate = (d: string) => {
    if (d === selectedDate) return;
    const dir = d > prevDate.current ? "left" : "right";
    prevDate.current = d;
    setSlideDir(dir);
    setSlideKey(k => k + 1);
    setSelectedDate(d);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const dateLabel = (() => {
    if (selectedDate === todayStr) return "今天";
    const d = new Date(selectedDate + "T12:00:00");
    const dayNames = ["周日","周一","周二","周三","周四","周五","周六"];
    return `${d.getMonth() + 1}月${d.getDate()}日　${dayNames[d.getDay()]}`;
  })();

  return (
    <div className="screen-enter flex flex-col h-full">
      <div className="overflow-y-auto no-scrollbar flex-1 pb-24">
        {/* Calendar card */}
        <div className="px-4 pt-5 pb-4" style={{ backgroundColor: "hsl(var(--card))", boxShadow: "0 2px 12px rgba(44,42,40,0.06)" }}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4 px-1">
            <button onClick={prevMonth} className="press-scale w-9 h-9 flex items-center justify-center rounded-full" style={{ backgroundColor: "hsl(var(--muted))" }}>
              <ChevronLeft size={18} style={{ color: "hsl(var(--foreground))" }} />
            </button>
            <div className="text-center">
              <p className="text-[20px] font-[800]" style={{ color: "hsl(var(--foreground))" }}>{MONTH_NAMES[month]}</p>
              <p className="text-[12px]" style={{ color: "hsl(var(--muted-foreground))" }}>{year}</p>
            </div>
            <button onClick={nextMonth} className="press-scale w-9 h-9 flex items-center justify-center rounded-full" style={{ backgroundColor: "hsl(var(--muted))" }}>
              <ChevronRight size={18} style={{ color: "hsl(var(--foreground))" }} />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[11px] font-medium py-1" style={{ color: "hsl(var(--muted-foreground))" }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="aspect-square" />;
              const dateStr = fmt(year, month, day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayTasks = tasksByDate[dateStr] ?? [];
              const topPriority = dayTasks[0]?.priority;
              const dotColor = topPriority ? PRIORITY_COLORS[topPriority] : "hsl(var(--primary))";

              return (
                <button
                  key={dateStr}
                  onClick={() => selectDate(dateStr)}
                  className="press-scale flex flex-col items-center justify-center aspect-square gap-0.5"
                >
                  <div
                    className="w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isSelected ? "hsl(var(--primary))" : isToday ? "#B88A8A" : "transparent",
                    }}
                  >
                    <span
                      className="text-[14px] transition-all"
                      style={{
                        color: (isSelected || isToday) ? "#fff" : "hsl(var(--foreground))",
                        fontWeight: (isSelected || isToday) ? "700" : "400",
                      }}
                    >
                      {day}
                    </span>
                  </div>
                  {dayTasks.length > 0 && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: isSelected ? "#ffffff88" : isToday ? "#fff" : dotColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task list */}
        <div
          key={slideKey}
          className={slideDir === "left" ? "slide-in-right" : slideDir === "right" ? "slide-in-left" : ""}
          style={{ padding: "20px 20px 0" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[18px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{dateLabel}</p>
              <p className="text-[12px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {selectedTasks.filter(t => !t.completed).length > 0
                  ? `${selectedTasks.filter(t => !t.completed).length} 项待完成`
                  : "暂无安排"}
              </p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="press-scale flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white text-[13px] font-semibold"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              <Plus size={14} />
              添加
            </button>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="rounded-2xl p-8 flex flex-col items-center gap-2" style={{ backgroundColor: "hsl(var(--card))" }}>
              <Coffee size={28} style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-[15px] font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>这天没有安排</p>
              <p className="text-[12px]" style={{ color: "hsl(var(--muted-foreground))" }}>享受轻松时光吧</p>
            </div>
          ) : (
            selectedTasks.map(t => (
              <TaskCard key={t.id} task={t}
                onComplete={() => toggleTask(t.id)}
                onPress={() => setEditingTask(t)}
                onDelete={() => deleteTask(t.id)}
              />
            ))
          )}
        </div>
      </div>

      <AddTaskModal visible={showAdd} onClose={() => setShowAdd(false)} onSave={t => addTask(t)} defaultDate={selectedDate} />
      <AddTaskModal
        visible={!!editingTask}
        editTask={editingTask}
        onClose={() => setEditingTask(undefined)}
        onSave={t => { if (editingTask) editTask(editingTask.id, t); }}
        onDelete={() => { if (editingTask) deleteTask(editingTask.id); }}
      />
    </div>
  );
}
