import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Sun, Calendar } from "lucide-react";
import { useTasks, Task } from "@/context/TasksContext";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskModal } from "@/components/AddTaskModal";

const GREETING_KEY = "@timeflow_greeting";
const DEFAULT_GREETINGS = [
  "今天的努力，明天的收获。",
  "好好努力，前途无量。",
  "专注当下，成就未来。",
  "每一步都算数。",
  "你比你想象的更强。",
  "静下心来，慢慢来。",
  "一分耕耘，一分收获。",
];

const WEEK_DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const MONTH_NAMES = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function getWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(monday), end: fmt(sunday) };
}
function getMonthRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

export function Dashboard() {
  const { tasks, addTask, editTask, deleteTask, toggleTask } = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [editingGreeting, setEditingGreeting] = useState(false);
  const [draftGreeting, setDraftGreeting] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(GREETING_KEY);
    if (saved) setGreeting(saved);
  }, []);

  const displayGreeting = greeting ?? DEFAULT_GREETINGS[new Date().getDay() % DEFAULT_GREETINGS.length];

  const now = new Date();
  const today = todayStr();
  const week = getWeekRange();
  const month = getMonthRange();

  const todayTasks = useMemo(() => tasks.filter(t => t.date === today && !t.completed), [tasks, today]);
  const completedToday = useMemo(() => tasks.filter(t => t.date === today && t.completed), [tasks, today]);
  const weekTasks = useMemo(() =>
    tasks.filter(t => t.date > today && t.date >= week.start && t.date <= week.end && !t.completed)
      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6),
    [tasks, today, week]
  );
  const monthCount = useMemo(() =>
    tasks.filter(t => t.date > week.end && t.date >= month.start && t.date <= month.end && !t.completed).length,
    [tasks, week, month]
  );

  const completionRate = todayTasks.length + completedToday.length > 0
    ? Math.round(completedToday.length / (todayTasks.length + completedToday.length) * 100)
    : 0;

  const saveGreeting = () => {
    const val = draftGreeting.trim();
    if (val) { setGreeting(val); localStorage.setItem(GREETING_KEY, val); }
    setEditingGreeting(false);
  };

  const resetGreeting = () => {
    setGreeting(null);
    localStorage.removeItem(GREETING_KEY);
    setEditingGreeting(false);
  };

  return (
    <div className="screen-enter flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-32">

        {/* Header */}
        <div className="flex items-start gap-3 mb-7">
          <div className="flex-1">
            <p className="text-[13px] mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {WEEK_DAYS[now.getDay()]}　{now.getFullYear()}年{MONTH_NAMES[now.getMonth()]}{now.getDate()}日
            </p>
            <button
              onClick={() => { setDraftGreeting(displayGreeting); setEditingGreeting(true); }}
              className="flex items-start gap-2 text-left press-scale w-full"
            >
              <span className="text-[21px] font-bold leading-tight flex-1" style={{ color: "hsl(var(--foreground))" }}>
                {displayGreeting}
              </span>
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                style={{ backgroundColor: "hsl(var(--muted))" }}
              >
                <Edit2 size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
              </span>
            </button>
          </div>

          {/* Progress ring */}
          <div
            className="shrink-0 w-14 h-14 rounded-full border-[2.5px] flex items-center justify-center"
            style={{ borderColor: completionRate === 100 ? "#8FAF96" : "hsl(var(--primary))" }}
          >
            <span className="text-[14px] font-bold" style={{ color: completionRate === 100 ? "#8FAF96" : "hsl(var(--primary))" }}>
              {completionRate}<span className="text-[9px] font-medium">%</span>
            </span>
          </div>
        </div>

        {/* Today section */}
        <div className="sticky-header py-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: "#B88A8A" }} />
            <span className="text-[16px] font-bold flex-1" style={{ color: "hsl(var(--foreground))" }}>今天</span>
            <span className="text-[12px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              {todayTasks.length > 0 ? `还剩 ${todayTasks.length} 项` : "全部完成"}
            </span>
          </div>
        </div>

        {todayTasks.length === 0 && completedToday.length === 0 ? (
          <div className="rounded-2xl p-8 flex flex-col items-center gap-2 mb-7" style={{ backgroundColor: "hsl(var(--card))" }}>
            <Sun size={28} style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="text-[15px] font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>今天没有安排</p>
            <p className="text-[12px]" style={{ color: "hsl(var(--muted-foreground))" }}>好好休息，或者计划点什么？</p>
          </div>
        ) : (
          <div className="mb-7">
            {todayTasks.map(t => (
              <TaskCard key={t.id} task={t} onComplete={() => toggleTask(t.id)} onPress={() => setEditingTask(t)} onDelete={() => deleteTask(t.id)} />
            ))}
            {completedToday.length > 0 && (
              <p className="text-[12px] mt-1 ml-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                已完成 {completedToday.length} 项
              </p>
            )}
          </div>
        )}

        {/* This Week */}
        <div className="sticky-header py-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: "hsl(var(--primary))" }} />
            <span className="text-[16px] font-bold flex-1" style={{ color: "hsl(var(--foreground))" }}>本周待办</span>
            <span className="text-[12px]" style={{ color: "hsl(var(--muted-foreground))" }}>{weekTasks.length} 项即将到来</span>
          </div>
        </div>

        {weekTasks.length === 0 ? (
          <div className="rounded-2xl p-8 flex flex-col items-center gap-2 mb-7" style={{ backgroundColor: "hsl(var(--card))" }}>
            <Calendar size={28} style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="text-[15px] font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>本周轻松无事</p>
            <p className="text-[12px]" style={{ color: "hsl(var(--muted-foreground))" }}>趁机规划一些学习目标吧</p>
          </div>
        ) : (
          <div className="mb-7">
            {weekTasks.map(t => (
              <TaskCard key={t.id} task={t} onComplete={() => toggleTask(t.id)} onPress={() => setEditingTask(t)} onDelete={() => deleteTask(t.id)} />
            ))}
          </div>
        )}

        {/* Monthly */}
        <div className="sticky-header py-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: "#C4A882" }} />
            <span className="text-[16px] font-bold flex-1" style={{ color: "hsl(var(--foreground))" }}>本月计划</span>
            <span className="text-[12px]" style={{ color: "hsl(var(--muted-foreground))" }}>共 {monthCount} 项</span>
          </div>
        </div>
        <div className="rounded-[18px] p-5 mb-7" style={{ backgroundColor: "hsl(var(--card))" }}>
          <p className="text-[52px] font-[800] leading-none tracking-tight mb-1" style={{ color: "hsl(var(--primary))" }}>
            {monthCount}
          </p>
          <p className="text-[14px]" style={{ color: "hsl(var(--muted-foreground))" }}>
            项任务安排在 {MONTH_NAMES[now.getMonth()]}
          </p>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed right-5 bottom-24 w-14 h-14 rounded-full flex items-center justify-center shadow-xl press-scale z-20"
        style={{ backgroundColor: "hsl(var(--primary))" }}
      >
        <Plus size={26} color="white" />
      </button>

      {/* Edit greeting modal */}
      {editingGreeting && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ backgroundColor: "rgba(44,42,40,0.35)" }}>
          <div className="absolute inset-0" onClick={() => setEditingGreeting(false)} />
          <div
            className="relative z-10 rounded-t-[22px] px-5 pt-3 pb-8"
            style={{ backgroundColor: "hsl(var(--card))" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "hsl(var(--border))" }} />
            <h2 className="text-[17px] font-bold mb-4" style={{ color: "hsl(var(--foreground))" }}>编辑激励语</h2>
            <textarea
              className="w-full rounded-xl px-4 py-3.5 text-[16px] outline-none border resize-none"
              rows={3}
              maxLength={60}
              style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" }}
              value={draftGreeting}
              onChange={e => setDraftGreeting(e.target.value)}
              autoFocus
            />
            <p className="text-[11px] text-right mt-1 mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
              {draftGreeting.length} / 60
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetGreeting}
                className="press-scale flex-1 py-4 rounded-xl border text-[14px] font-semibold"
                style={{ color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }}
              >
                恢复默认
              </button>
              <button
                onClick={saveGreeting}
                className="press-scale flex-[2] py-4 rounded-xl text-[14px] font-bold text-white"
                style={{ backgroundColor: draftGreeting.trim() ? "hsl(var(--primary))" : "hsl(var(--border))" }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <AddTaskModal visible={showAdd} onClose={() => setShowAdd(false)} onSave={t => addTask(t)} />
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
