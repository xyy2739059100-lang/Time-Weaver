import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SUBJECT_COLORS, SUBJECT_TEXT_COLORS, Task } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  task: Task;
  onComplete: () => void;
  onPress: () => void;
  onDelete: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  高: "#B88A8A",
  中: "#C4A882",
  低: "#8FAF96",
};

const ACTION_WIDTH = 76;
const REVEAL_THRESHOLD = 60;
const FULL_REVEAL = ACTION_WIDTH * 2;

export function TaskCard({ task, onComplete, onPress, onDelete }: Props) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const [isRevealed, setIsRevealed] = useState(false);
  const isRevealedRef = useRef(false);

  const snapTo = (value: number, cb?: () => void) => {
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: true,
      bounciness: value === 0 ? 6 : 0,
      speed: 18,
    }).start(cb);
  };

  const collapse = () => {
    snapTo(0);
    setIsRevealed(false);
    isRevealedRef.current = false;
  };

  const triggerComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.timing(translateX, { toValue: -400, duration: 220, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => onComplete());
  };

  const triggerDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(translateX, { toValue: -400, duration: 220, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => onDelete());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        const base = isRevealedRef.current ? -FULL_REVEAL : 0;
        const raw = base + g.dx;
        if (raw < 0) translateX.setValue(Math.max(raw, -FULL_REVEAL - 10));
        if (raw > 0 && isRevealedRef.current) translateX.setValue(Math.min(raw, 4));
      },
      onPanResponderRelease: (_, g) => {
        const base = isRevealedRef.current ? -FULL_REVEAL : 0;
        const raw = base + g.dx;
        if (raw < -REVEAL_THRESHOLD) {
          snapTo(-FULL_REVEAL);
          setIsRevealed(true);
          isRevealedRef.current = true;
          if (!isRevealedRef.current) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          collapse();
        }
      },
    })
  ).current;

  const bgColor = SUBJECT_COLORS[task.subject] ?? SUBJECT_COLORS["其他"];
  const textColor = SUBJECT_TEXT_COLORS[task.subject] ?? SUBJECT_TEXT_COLORS["其他"];

  const handlePressIn = () => {
    if (isRevealedRef.current) return;
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <View style={styles.wrapper}>
      {/* Right-side action buttons (revealed on left swipe) */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.success }]}
          onPress={triggerComplete}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.actionLabel}>完成</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.destructive }]}
          onPress={triggerDelete}
        >
          <Feather name="trash-2" size={18} color="#fff" />
          <Text style={styles.actionLabel}>删除</Text>
        </TouchableOpacity>
      </View>

      {/* The card itself */}
      <Animated.View
        style={[
          styles.cardOuter,
          {
            transform: [{ translateX }, { scale: pressScale }],
            opacity: cardOpacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderRadius: 14,
              shadowColor: "#2C2A28",
            },
          ]}
          onPress={() => {
            if (isRevealedRef.current) {
              collapse();
              return;
            }
            onPress();
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <TouchableOpacity
            style={[
              styles.check,
              {
                borderColor: task.completed ? colors.success : colors.border,
                backgroundColor: task.completed ? colors.success : "transparent",
              },
            ]}
            onPress={() => {
              if (isRevealedRef.current) { collapse(); return; }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onComplete();
            }}
            hitSlop={6}
          >
            {task.completed && (
              <Feather name="check" size={11} color="#fff" />
            )}
          </TouchableOpacity>

          <View style={styles.content}>
            <Text
              style={[
                styles.title,
                {
                  color: task.completed ? colors.mutedForeground : colors.foreground,
                  textDecorationLine: task.completed ? "line-through" : "none",
                },
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <View style={styles.meta}>
              <View style={[styles.subjectTag, { backgroundColor: bgColor }]}>
                <Text style={[styles.subjectText, { color: textColor }]}>
                  {task.subject}
                </Text>
              </View>
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: PRIORITY_COLORS[task.priority] ?? "#ccc" },
                ]}
              />
              <Text style={[styles.priorityLabel, { color: colors.mutedForeground }]}>
                {task.priority}优先
              </Text>
              {task.date && (
                <>
                  <Text style={[styles.priorityLabel, { color: colors.border }]}>·</Text>
                  <Text style={[styles.priorityLabel, { color: colors.mutedForeground }]}>
                    {task.date.slice(5).replace("-", "/")}
                  </Text>
                </>
              )}
            </View>
          </View>

          <View
            style={[styles.swipeHint, { opacity: isRevealed ? 0 : 0.25 }]}
          >
            <Feather name="chevrons-left" size={14} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: 8,
    overflow: Platform.OS === "web" ? "hidden" : "visible",
    borderRadius: 14,
  },
  actionsContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
  },
  actionBtn: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  actionLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardOuter: {},
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 5 },
  title: { fontSize: 15, fontWeight: "500", letterSpacing: 0.1 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  subjectTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  subjectText: { fontSize: 11, fontWeight: "600" },
  priorityDot: { width: 5, height: 5, borderRadius: 2.5 },
  priorityLabel: { fontSize: 11 },
  swipeHint: { paddingLeft: 4 },
});
