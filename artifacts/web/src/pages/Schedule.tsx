import React, { useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTasks, TimeBlock } from "@/context/TasksContext";
import { AddTimeBlockModal } from "@/components/AddTimeBlockModal";

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const START_HOUR = 8;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

const BASE_CELL = 52;
const MIN_CELL = 28;
const MAX_CELL = 90;
const TIME_COL = 36;

function getTimeOffset(cellH: number): number | null {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  if (h < START_HOUR || h >= END_HOUR) return null;
  return (h - START_HOUR + m / 60) * cellH;
}

function getTodayIdx() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export function Schedule() {
  const { timeBlocks, addTimeBlock, editTimeBlock, deleteTimeBlock } = useTasks();
  const [cellH, setCellH] = useState(BASE_CELL);
  const [showAdd, setShowAdd] = useState(false);
  const [selDay, setSelDay] = useState(0);
  const [selHour, setSelHour] = useState(9);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>();
  const pinchRef = useRef<{ startDist: number; startCell: number } | null>(null);

  const todayIdx = getTodayIdx();
  const timeOffset = getTimeOffset(cellH);

  const blocksByDay = useMemo(() => {
    const map: Record<number, TimeBlock[]> = {};
    timeBlocks.forEach(b => {
      if (!map[b.dayOfWeek]) map[b.dayOfWeek] = [];
      map[b.dayOfWeek].push(b);
    });
    return map;
  }, [timeBlocks]);

  const handleGridTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pinchRef.current = { startDist: dist, startCell: cellH };
    }
  };

  const handleGridTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchRef.current.startDist;
      const newH = Math.min(MAX_CELL, Math.max(MIN_CELL, pinchRef.current.startCell * scale));
      setCellH(Math.round(newH));
    }
  };

  const handleGridTouchEnd = () => { pinchRef.current = null; };

  const showLabel = cellH >= 36;
  const showBlockTime = cellH >= 42;
  const zoomPct = Math.round((cellH - MIN_CELL) / (MAX_CELL - MIN_CELL) * 100);

  const totalH = HOURS.length * cellH;

  return (
    <div className="screen-enter flex flex-col h-full">
      {/* Top bar */}
      <div
        className="px-4 pt-4 pb-3 flex items-center justify-between border-b"
        style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
      >
        <span className="text-[20px] font-bold" style={{ color: "hsl(var(--foreground))" }}>课程表</span>
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div
            className="flex items-center rounded-full overflow-hidden"
            style={{ backgroundColor: "hsl(var(--muted))" }}
          >
            <button
              className="press-scale w-8 h-8 flex items-center justify-center"
              onClick={() => setCellH(h => Math.max(MIN_CELL, h - 14))}
              disabled={cellH <= MIN_CELL}
            >
              <Minus size={13} style={{ color: cellH <= MIN_CELL ? "hsl(var(--border))" : "hsl(var(--foreground))" }} />
            </button>
            <button
              onClick={() => setCellH(BASE_CELL)}
              className="text-[11px] font-semibold w-9 text-center"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {zoomPct}%
            </button>
            <button
              className="press-scale w-8 h-8 flex items-center justify-center"
              onClick={() => setCellH(h => Math.min(MAX_CELL, h + 14))}
              disabled={cellH >= MAX_CELL}
            >
              <Plus size={13} style={{ color: cellH >= MAX_CELL ? "hsl(var(--border))" : "hsl(var(--foreground))" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div
        className="flex border-b"
        style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
      >
        <div style={{ width: TIME_COL, flexShrink: 0 }} />
        {DAYS.map((d, i) => (
          <div key={d} className="flex-1 flex flex-col items-center py-2 gap-1">
            <span
              className="text-[10px] font-medium"
              style={{ color: i === todayIdx ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", fontWeight: i === todayIdx ? "700" : "500" }}
            >
              {d}
            </span>
            {i === todayIdx && (
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }} />
            )}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar"
        onTouchStart={handleGridTouchStart}
        onTouchMove={handleGridTouchMove}
        onTouchEnd={handleGridTouchEnd}
      >
        <div className="flex" style={{ minHeight: totalH }}>
          {/* Time labels */}
          <div style={{ width: TIME_COL, flexShrink: 0 }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="flex items-start justify-end pr-1.5 pt-0.5"
                style={{ height: cellH }}
              >
                {showLabel && (
                  <span className="text-[9px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {h}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((d, dayIdx) => (
            <div key={d} className="flex-1 relative" style={{ borderLeft: "0.5px solid hsl(var(--border))" }}>
              {/* Hour cells */}
              {HOURS.map(h => (
                <div
                  key={h}
                  style={{
                    height: cellH,
                    borderTop: "0.5px solid hsl(var(--border))",
                    backgroundColor: dayIdx === todayIdx ? "hsl(var(--primary) / 0.03)" : "transparent",
                  }}
                  onClick={() => {
                    setSelDay(dayIdx);
                    setSelHour(h);
                    setShowAdd(true);
                  }}
                />
              ))}

              {/* Time blocks */}
              {(blocksByDay[dayIdx] ?? []).map(block => {
                const top = (block.startHour - START_HOUR) * cellH;
                const height = Math.max(block.durationHours * cellH - 2, 14);
                return (
                  <div
                    key={block.id}
                    className="absolute inset-x-px rounded overflow-hidden cursor-pointer"
                    style={{
                      top,
                      height,
                      backgroundColor: block.color,
                      borderLeft: `2.5px solid ${block.textColor}`,
                      padding: "3px 4px",
                    }}
                    onClick={e => { e.stopPropagation(); setEditingBlock(block); }}
                  >
                    <p className="text-[9px] font-bold leading-tight truncate" style={{ color: block.textColor }}>
                      {block.title}
                    </p>
                    {showBlockTime && block.durationHours >= 1 && (
                      <p className="text-[8px] leading-tight" style={{ color: block.textColor, opacity: 0.8 }}>
                        {block.startHour}–{block.startHour + block.durationHours}时
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Current time line */}
              {dayIdx === todayIdx && timeOffset !== null && (
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: timeOffset, height: 1.5, backgroundColor: "#B88A8A" }}
                >
                  <div
                    className="absolute w-[7px] h-[7px] rounded-full"
                    style={{ backgroundColor: "#B88A8A", top: -2.5, left: -3 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AddTimeBlockModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={b => addTimeBlock(b)}
        defaultDay={selDay}
        defaultHour={selHour}
      />
      <AddTimeBlockModal
        visible={!!editingBlock}
        editBlock={editingBlock}
        onClose={() => setEditingBlock(undefined)}
        onSave={b => { if (editingBlock) editTimeBlock(editingBlock.id, b); }}
        onDelete={() => { if (editingBlock) deleteTimeBlock(editingBlock.id); }}
      />
    </div>
  );
}
