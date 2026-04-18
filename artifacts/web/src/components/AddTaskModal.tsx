import React, { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import { Task, Subject, Priority, SUBJECT_COLORS, SUBJECT_TEXT_COLORS } from "@/context/TasksContext";

const SUBJECTS: Subject[] = ["数学", "英语", "历史", "理科", "艺术", "体育", "音乐", "计算机", "其他"];
const PRIORITIES: Priority[] = ["低", "中", "高"];
const PRIORITY_COLORS: Record<Priority, string> = { 高: "#B88A8A", 中: "#C4A882", 低: "#8FAF96" };

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (t: Omit<Task, "id" | "completed">) => void;
  onDelete?: () => void;
  editTask?: Task;
  defaultDate?: string;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function AddTaskModal({ visible, onClose, onSave, onDelete, editTask, defaultDate }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate ?? todayStr());
  const [subject, setSubject] = useState<Subject>("其他");
  const [priority, setPriority] = useState<Priority>("中");
  const [note, setNote] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      setTitle(editTask?.title ?? "");
      setDate(editTask?.date ?? defaultDate ?? todayStr());
      setSubject(editTask?.subject ?? "其他");
      setPriority(editTask?.priority ?? "中");
      setNote(editTask?.note ?? "");
    }
  }, [visible, editTask, defaultDate]);

  if (!visible) return null;

  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ title: title.trim(), date, subject, priority, note });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ backgroundColor: "rgba(44,42,40,0.35)" }}>
      <div
        ref={overlayRef}
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className="relative z-10 rounded-t-[22px] px-5 pt-3 pb-8"
        style={{ backgroundColor: "hsl(var(--card))" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "hsl(var(--border))" }} />

        {/* Title */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
            {editTask ? "编辑任务" : "添加任务"}
          </h2>
          <button onClick={onClose} className="press-scale p-1.5 rounded-full" style={{ backgroundColor: "hsl(var(--muted))" }}>
            <X size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {/* Task name */}
        <input
          className="w-full rounded-xl px-4 py-3.5 text-[16px] outline-none border"
          style={{
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--foreground))",
            borderColor: "hsl(var(--border))",
          }}
          placeholder="任务名称..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          autoFocus
        />

        {/* Date */}
        <div className="mt-4">
          <label className="text-[12px] font-semibold mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>日期</label>
          <input
            type="date"
            className="w-full rounded-xl px-4 py-3 text-[15px] outline-none border"
            style={{
              backgroundColor: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
              borderColor: "hsl(var(--border))",
            }}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Subject */}
        <div className="mt-4">
          <label className="text-[12px] font-semibold mb-2 block" style={{ color: "hsl(var(--muted-foreground))" }}>学科</label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map(s => {
              const active = subject === s;
              return (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className="press-scale text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-all"
                  style={{
                    backgroundColor: active ? SUBJECT_COLORS[s] : "transparent",
                    color: active ? SUBJECT_TEXT_COLORS[s] : "hsl(var(--muted-foreground))",
                    borderColor: active ? SUBJECT_COLORS[s] : "hsl(var(--border))",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div className="mt-4">
          <label className="text-[12px] font-semibold mb-2 block" style={{ color: "hsl(var(--muted-foreground))" }}>优先级</label>
          <div className="flex gap-2">
            {PRIORITIES.map(p => {
              const active = priority === p;
              return (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="press-scale flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all"
                  style={{
                    backgroundColor: active ? PRIORITY_COLORS[p] : "transparent",
                    color: active ? "#fff" : "hsl(var(--muted-foreground))",
                    borderColor: active ? PRIORITY_COLORS[p] : "hsl(var(--border))",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="mt-4">
          <label className="text-[12px] font-semibold mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>备注（可选）</label>
          <textarea
            className="w-full rounded-xl px-4 py-3 text-[15px] outline-none border resize-none"
            rows={2}
            style={{
              backgroundColor: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
              borderColor: "hsl(var(--border))",
            }}
            placeholder="添加备注..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          {editTask && onDelete && (
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="press-scale py-4 px-4 rounded-xl border text-[14px] font-semibold"
              style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--border))" }}
            >
              删除
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="press-scale flex-1 py-4 rounded-xl text-[14px] font-bold text-white transition-opacity"
            style={{
              backgroundColor: canSave ? "hsl(var(--primary))" : "hsl(var(--border))",
            }}
          >
            {editTask ? "保存修改" : "添加任务"}
          </button>
        </div>
      </div>
    </div>
  );
}
