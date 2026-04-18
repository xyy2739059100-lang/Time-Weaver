import React, { useRef, useState } from "react";
import { SUBJECT_COLORS, SUBJECT_TEXT_COLORS, Task } from "@/context/TasksContext";
import { Check, Trash2, ChevronRight } from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  高: "#B88A8A",
  中: "#C4A882",
  低: "#8FAF96",
};

interface Props {
  task: Task;
  onComplete: () => void;
  onPress: () => void;
  onDelete: () => void;
}

const ACTION_W = 76;
const SNAP_THRESHOLD = 60;

export function TaskCard({ task, onComplete, onPress, onDelete }: Props) {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const startX = useRef(0);
  const baseOffset = useRef(0);
  const dragging = useRef(false);

  const bgColor = SUBJECT_COLORS[task.subject as keyof typeof SUBJECT_COLORS] ?? "#D0CCCA";
  const textColor = SUBJECT_TEXT_COLORS[task.subject as keyof typeof SUBJECT_TEXT_COLORS] ?? "#5A5450";

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    baseOffset.current = offset;
    dragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const raw = baseOffset.current + dx;
    const clamped = Math.max(-ACTION_W * 2 - 8, Math.min(0, raw));
    setOffset(clamped);
  };

  const handleTouchEnd = () => {
    dragging.current = false;
    const base = revealed ? -ACTION_W * 2 : 0;
    const moved = offset - base;
    if (offset < -SNAP_THRESHOLD) {
      setOffset(-ACTION_W * 2);
      setRevealed(true);
    } else {
      setOffset(0);
      setRevealed(false);
    }
  };

  const exitCard = (cb: () => void) => {
    setExiting(true);
    setTimeout(cb, 250);
  };

  if (exiting) {
    return <div style={{ height: 0, marginBottom: 0, overflow: "hidden", transition: "height 0.25s ease" }} />;
  }

  return (
    <div className="relative mb-2 overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
      {/* Action buttons behind the card */}
      <div className="absolute inset-y-0 right-0 flex" style={{ borderRadius: "var(--radius)" }}>
        <button
          onClick={() => exitCard(onComplete)}
          className="flex flex-col items-center justify-center gap-1 text-white text-xs font-bold"
          style={{ width: ACTION_W, backgroundColor: "#8FAF96", borderRadius: 0 }}
        >
          <Check size={18} />
          <span>完成</span>
        </button>
        <button
          onClick={() => exitCard(onDelete)}
          className="flex flex-col items-center justify-center gap-1 text-white text-xs font-bold"
          style={{ width: ACTION_W, backgroundColor: "#B88A8A", borderRadius: `0 var(--radius) var(--radius) 0` }}
        >
          <Trash2 size={18} />
          <span>删除</span>
        </button>
      </div>

      {/* The card */}
      <div
        className="relative"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? "none" : "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          borderRadius: "var(--radius)",
          background: "hsl(var(--card))",
          boxShadow: "0 1px 6px rgba(44,42,40,0.05)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5 press-scale cursor-pointer"
          onClick={() => {
            if (revealed) { setOffset(0); setRevealed(false); return; }
            onPress();
          }}
        >
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (revealed) { setOffset(0); setRevealed(false); return; }
              onComplete();
            }}
            className="shrink-0 w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center transition-all"
            style={{
              borderColor: task.completed ? "#8FAF96" : "hsl(var(--border))",
              backgroundColor: task.completed ? "#8FAF96" : "transparent",
            }}
          >
            {task.completed && <Check size={11} color="white" strokeWidth={3} />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[15px] font-medium leading-snug truncate"
              style={{
                color: task.completed ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                textDecoration: task.completed ? "line-through" : "none",
              }}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                {task.subject}
              </span>
              <span
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] ?? "#ccc" }}
              />
              <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                {task.priority}优先
              </span>
              {task.date && (
                <>
                  <span className="text-[11px]" style={{ color: "hsl(var(--border))" }}>·</span>
                  <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {task.date.slice(5).replace("-", "/")}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Swipe hint */}
          {!revealed && (
            <ChevronRight size={14} style={{ color: "hsl(var(--border))", opacity: 0.6, transform: "scaleX(-1)" }} />
          )}
        </div>
      </div>
    </div>
  );
}
