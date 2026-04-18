import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddTaskModal } from "@/components/AddTaskModal";
import { TaskCard } from "@/components/TaskCard";
import { ScreenEnter } from "@/components/ScreenEnter";
import { DashboardSkeleton } from "@/components/SkeletonLoader";
import { Task, useTasks } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_NAMES = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

const PRIORITY_COLORS: Record<string, string> = {
  高: "#B88A8A",
  中: "#C4A882",
  低: "#8FAF96",
};

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const [loading] = useState(false);

  const prevSelectedDate = useRef(selectedDate);

  // Animated values for task list slide
  const listTranslateX = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.completed) {
        if (!map[t.date]) map[t.date] = [];
        map[t.date].push(t);
      }
    });
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === selectedDate)
        .sort((a, b) => (a.completed ? 1 : -1)),
    [tasks, selectedDate]
  );

  const animateListChange = (direction: "left" | "right") => {
    const fromX = direction === "left" ? SCREEN_WIDTH * 0.3 : -SCREEN_WIDTH * 0.3;
    listTranslateX.setValue(fromX);
    listOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(listTranslateX, {
        toValue: 0,
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectDate = (dateStr: string) => {
    if (dateStr === selectedDate) return;
    Haptics.selectionAsync();
    const direction = dateStr > prevSelectedDate.current ? "left" : "right";
    prevSelectedDate.current = dateStr;
    setSelectedDate(dateStr);
    animateListChange(direction);
  };

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

  const selectedDateLabel = (() => {
    if (selectedDate === todayStr) return "今天";
    const d = new Date(selectedDate + "T12:00:00");
    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return `${d.getMonth() + 1}月${d.getDate()}日　${dayNames[d.getDay()]}`;
  })();

  return (
    <ScreenEnter>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100,
          }}
        >
          {/* Calendar card */}
          <View
            style={[
              styles.calendarCard,
              {
                paddingTop: topPaddingWeb + 14,
                backgroundColor: colors.card,
              },
            ]}
          >
            {/* Month nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={goToPrevMonth}
                hitSlop={14}
                style={styles.navBtn}
              >
                <Feather name="chevron-left" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <View style={{ alignItems: "center", gap: 2 }}>
                <Text style={[styles.monthTitle, { color: colors.foreground }]}>
                  {MONTH_NAMES[month]}
                </Text>
                <Text style={[styles.yearLabel, { color: colors.mutedForeground }]}>
                  {year}
                </Text>
              </View>
              <TouchableOpacity
                onPress={goToNextMonth}
                hitSlop={14}
                style={styles.navBtn}
              >
                <Feather name="chevron-right" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={styles.dayLabels}>
              {DAY_NAMES.map((d) => (
                <Text
                  key={d}
                  style={[styles.dayLabel, { color: colors.mutedForeground }]}
                >
                  {d}
                </Text>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.grid}>
              {calendarCells.map((day, idx) => {
                if (!day) return <View key={`e-${idx}`} style={styles.cell} />;
                const dateStr = toDateStr(year, month, day);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayTasks = tasksByDate[dateStr] ?? [];
                const hasTasks = dayTasks.length > 0;

                // Dot colors based on top priority
                const topPriority = dayTasks[0]?.priority;
                const dotColor = topPriority
                  ? PRIORITY_COLORS[topPriority]
                  : colors.primary;

                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={styles.cell}
                    onPress={() => handleSelectDate(dateStr)}
                    activeOpacity={0.7}
                  >
                    <Animated.View
                      style={[
                        styles.dayCircle,
                        isSelected && { backgroundColor: colors.primary },
                        isToday && !isSelected && { backgroundColor: colors.today },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNum,
                          { color: colors.foreground },
                          (isSelected || isToday) && {
                            color: "#fff",
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </Animated.View>
                    {hasTasks && !isSelected && (
                      <View
                        style={[
                          styles.eventDot,
                          {
                            backgroundColor: isToday ? "#fff" : dotColor,
                          },
                        ]}
                      />
                    )}
                    {hasTasks && isSelected && (
                      <View
                        style={[styles.eventDot, { backgroundColor: "#ffffff88" }]}
                      />
                    )}
                    {dayTasks.length > 1 && !isSelected && (
                      <View
                        style={[
                          styles.eventDotExtra,
                          { backgroundColor: isToday ? "#ffffff88" : colors.border },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Task list with slide animation */}
          <Animated.View
            style={[
              styles.listSection,
              {
                transform: [{ translateX: listTranslateX }],
                opacity: listOpacity,
              },
            ]}
          >
            <View style={styles.listHeader}>
              <View>
                <Text style={[styles.listTitle, { color: colors.foreground }]}>
                  {selectedDateLabel}
                </Text>
                <Text style={[styles.listCount, { color: colors.mutedForeground }]}>
                  {selectedTasks.length > 0
                    ? `${selectedTasks.filter((t) => !t.completed).length} 项待完成`
                    : "暂无安排"}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAdd(true);
                }}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={15} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                  添加
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <DashboardSkeleton />
            ) : selectedTasks.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Feather name="coffee" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                  这天没有安排
                </Text>
                <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                  享受轻松时光吧
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
          </Animated.View>
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
    </ScreenEnter>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendarCard: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: "#2C2A28",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  navBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  monthTitle: { fontSize: 20, fontWeight: "800", letterSpacing: 0.2 },
  yearLabel: { fontSize: 12, fontWeight: "500" },
  dayLabels: { flexDirection: "row", marginBottom: 2 },
  dayLabel: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "500" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%` as `${number}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    gap: 2,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontSize: 14, fontWeight: "400" },
  eventDot: { width: 4, height: 4, borderRadius: 2 },
  eventDotExtra: { width: 3, height: 3, borderRadius: 1.5, marginTop: -2 },
  listSection: { paddingTop: 24, paddingHorizontal: 22, gap: 0 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  listTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.2 },
  listCount: { fontSize: 12, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  emptyState: { borderRadius: 16, padding: 34, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  emptyHint: { fontSize: 12 },
});
