import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTaskModal } from "@/components/AddTaskModal";
import { TaskCard } from "@/components/TaskCard";
import { Task, useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, addTask, editTask, deleteTask, toggleTask } = useTasks();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    toDateStr(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const taskDates = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      if (!t.completed) {
        map[t.date] = (map[t.date] ?? 0) + 1;
      }
    });
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(
    () => tasks.filter((t) => t.date === selectedDate).sort((a, b) => a.completed ? 1 : -1),
    [tasks, selectedDate]
  );

  const goToPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const goToNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const topPaddingWeb = Platform.OS === "web" ? 67 : insets.top;

  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100,
        }}
      >
        {/* Calendar Header */}
        <View
          style={[
            styles.calendarSection,
            { paddingTop: topPaddingWeb + 16, backgroundColor: colors.card },
          ]}
        >
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPrevMonth} hitSlop={12}>
              <Feather name="chevron-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.foreground }]}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} hitSlop={12}>
              <Feather name="chevron-right" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={styles.dayLabels}>
            {DAY_NAMES.map((d) => (
              <Text key={d} style={[styles.dayLabel, { color: colors.mutedForeground }]}>
                {d}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {calendarCells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={styles.cell} />;
              const dateStr = toDateStr(year, month, day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasTasks = !!taskDates[dateStr];

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={styles.cell}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedDate(dateStr);
                  }}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected && { backgroundColor: colors.selectedDay },
                      isToday && !isSelected && { backgroundColor: colors.today },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        { color: colors.foreground },
                        (isSelected || isToday) && { color: "#fff", fontWeight: "700" },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {hasTasks && !isSelected && (
                    <View
                      style={[
                        styles.eventDot,
                        {
                          backgroundColor: isToday ? "#fff" : colors.primary,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Tasks */}
        <View style={[styles.listSection, { paddingHorizontal: 20 }]}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.foreground }]}>
              {selectedDate === todayStr
                ? "Today"
                : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
            </Text>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAdd(true);
              }}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Add</Text>
            </TouchableOpacity>
          </View>

          {selectedTasks.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Feather name="coffee" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Nothing planned here.
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                Enjoy the free time!
              </Text>
            </View>
          ) : (
            selectedTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onComplete={() => toggleTask(t.id)}
                onPress={() => setEditingTask(t)}
                onDelete={() => deleteTask(t.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddTaskModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(t) => addTask(t)}
        defaultDate={selectedDate}
      />
      <AddTaskModal
        visible={!!editingTask}
        editTask={editingTask}
        onClose={() => setEditingTask(undefined)}
        onSave={(t) => {
          if (editingTask) editTask(editingTask.id, t);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendarSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  monthTitle: { fontSize: 18, fontWeight: "700" },
  dayLabels: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%` as `${number}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontSize: 14 },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  listSection: { paddingTop: 20, gap: 0 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  listTitle: { fontSize: 18, fontWeight: "700" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyState: {
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubtext: { fontSize: 13 },
});
