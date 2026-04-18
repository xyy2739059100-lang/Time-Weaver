import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TimeBlock, BLOCK_COLORS } from "@/context/TasksContext";

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (b: Omit<TimeBlock, "id">) => void;
  onDelete?: () => void;
  editBlock?: TimeBlock;
  defaultDay?: number;
  defaultHour?: number;
}

export function AddTimeBlockModal({ visible, onClose, onSave, onDelete, editBlock, defaultDay = 0, defaultHour = 9 }: Props) {
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(defaultDay);
  const [startHour, setStartHour] = useState(defaultHour);
  const [duration, setDuration] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);

  useEffect(() => {
    if (visible) {
      setTitle(editBlock?.title ?? "");
      setDay(editBlock?.dayOfWeek ?? defaultDay);
      setStartHour(editBlock?.startHour ?? defaultHour);
      setDuration(editBlock?.durationHours ?? 1);
      const idx = editBlock
        ? BLOCK_COLORS.findIndex(c => c.bg === editBlock.color)
        : 0;
      setColorIdx(idx >= 0 ? idx : 0);
    }
  }, [visible, editBlock, defaultDay, defaultHour]);

  if (!visible) return null;

  const canSave = title.trim().length > 0;
  const color = BLOCK_COLORS[colorIdx];

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      dayOfWeek: day,
      startHour,
      durationHours: duration,
      color: color.bg,
      textColor: color.text,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ backgroundColor: "rgba(44,42,40,0.35)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative z-10 rounded-t-[22px] px-5 pt-3 pb-8"
        style={{ backgroundColor: "hsl(var(--card))" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "hsl(var(--border))" }} />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
            {editBlock ? "编辑时间块" : "添加时间块"}
          </h2>
          <button onClick={onClose} className="press-scale p-1.5 rounded-full" style={{ backgroundColor: "hsl(var(--muted))" }}>
            <X size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        <input
          className="w-full rounded-xl px-4 py-3.5 text-[16px] outline-none border"
          style={{
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--foreground))",
            borderColor: "hsl(var(--border))",
          }}
          placeholder="课程 / 任务名称..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />

        {/* Day picker */}
        <div className="mt-4">
          <label className="text-[12px] font-semibold mb-2 block" style={{ color: "hsl(var(--muted-foreground))" }}>星期</label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {DAYS.map((d, i) => (
              <button
                key={d}
                onClick={() => setDay(i)}
                className="press-scale shrink-0 w-10 py-2 rounded-xl text-[12px] font-semibold border transition-all"
                style={{
                  backgroundColor: day === i ? "hsl(var(--primary))" : "transparent",
                  color: day === i ? "#fff" : "hsl(var(--muted-foreground))",
                  borderColor: day === i ? "hsl(var(--primary))" : "hsl(var(--border))",
                }}
              >
                {d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Time & Duration */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1">
            <label className="text-[12px] font-semibold mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>开始时间</label>
            <select
              className="w-full rounded-xl px-3 py-3 text-[15px] outline-none border"
              style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" }}
              value={startHour}
              onChange={e => setStartHour(Number(e.target.value))}
            >
              {Array.from({ length: 15 }, (_, i) => i + 8).map(h => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[12px] font-semibold mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>时长（小时）</label>
            <select
              className="w-full rounded-xl px-3 py-3 text-[15px] outline-none border"
              style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" }}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
            >
              {DURATIONS.map(d => (
                <option key={d} value={d}>{d}小时</option>
              ))}
            </select>
          </div>
        </div>

        {/* Color picker */}
        <div className="mt-4">
          <label className="text-[12px] font-semibold mb-2 block" style={{ color: "hsl(var(--muted-foreground))" }}>颜色</label>
          <div className="flex gap-2">
            {BLOCK_COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => setColorIdx(i)}
                className="press-scale w-9 h-9 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c.bg,
                  borderColor: colorIdx === i ? c.text : "transparent",
                  transform: colorIdx === i ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div
          className="mt-4 px-3 py-2 rounded-lg border-l-[3px]"
          style={{ backgroundColor: color.bg, borderLeftColor: color.text }}
        >
          <p className="text-[12px] font-bold" style={{ color: color.text }}>
            {title || "预览"} · {DAYS[day]} {startHour}:00–{startHour + duration}:00
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          {editBlock && onDelete && (
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
            className="press-scale flex-1 py-4 rounded-xl text-[14px] font-bold text-white"
            style={{ backgroundColor: canSave ? "hsl(var(--primary))" : "hsl(var(--border))" }}
          >
            {editBlock ? "保存修改" : "添加时间块"}
          </button>
        </div>
      </div>
    </div>
  );
}
