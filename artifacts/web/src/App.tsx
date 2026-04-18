import { useState } from "react";
import { TasksProvider } from "@/context/TasksContext";
import { Dashboard } from "@/pages/Dashboard";
import { CalendarView } from "@/pages/Calendar";
import { Schedule } from "@/pages/Schedule";

type Tab = "today" | "calendar" | "schedule";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth={active ? 0 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function CalIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M16 2v4M8 2v4M3 10h18" />
      {active && <path d="M8 14h2v2H8zM11 14h2v2h-2zM14 14h2v2h-2z" fill="currentColor" stroke="none" />}
    </svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.3 : 0} />
      <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.3 : 0} />
      <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.3 : 0} />
      <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.3 : 0} />
    </svg>
  );
}

const TABS: { id: Tab; label: string; Icon: (props: { active: boolean }) => JSX.Element }[] = [
  { id: "today", label: "今天", Icon: HomeIcon },
  { id: "calendar", label: "日历", Icon: CalIcon },
  { id: "schedule", label: "课程表", Icon: GridIcon },
];

function AppContent() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Main content */}
      <div className="flex-1 overflow-hidden relative">
        {tab === "today" && <Dashboard key="today" />}
        {tab === "calendar" && <CalendarView key="calendar" />}
        {tab === "schedule" && <Schedule key="schedule" />}
      </div>

      {/* Bottom tab bar */}
      <div
        className="frosted shrink-0 border-t safe-area-bottom"
        style={{
          borderColor: "hsl(var(--border))",
          backgroundColor: "rgba(250,250,248,0.82)",
        }}
      >
        <div className="flex" style={{ height: 72 }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                className="press-scale flex-1 flex flex-col items-center justify-center gap-1"
                onClick={() => setTab(id)}
              >
                <span style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                  <Icon active={active} />
                </span>
                <span
                  className="text-[11px] font-semibold tracking-wide"
                  style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TasksProvider>
      <AppContent />
    </TasksProvider>
  );
}
