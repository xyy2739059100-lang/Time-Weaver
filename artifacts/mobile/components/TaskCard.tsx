import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
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

export function TaskCard({ task, onComplete, onPress, onDelete }: Props) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, -120));
          actionOpacity.setValue(Math.min(Math.abs(g.dx) / 80, 1));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80) {
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -300,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onComplete();
          });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          Animated.timing(actionOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const bgColor = SUBJECT_COLORS[task.subject] ?? SUBJECT_COLORS["其他"];
  const textColor = SUBJECT_TEXT_COLORS[task.subject] ?? SUBJECT_TEXT_COLORS["其他"];

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.actionBg,
          { opacity: actionOpacity, backgroundColor: colors.success },
        ]}
      >
        <Feather name="check" size={20} color="#fff" />
        <Text style={styles.actionLabel}>完成</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderRadius: colors.radius,
            transform: [{ translateX }],
            opacity,
            shadowColor: "#2C2A28",
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.inner}
          onPress={onPress}
          activeOpacity={0.8}
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onComplete();
            }}
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
            </View>
          </View>

          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
            <Feather name="trash-2" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: 8,
  },
  actionBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    gap: 6,
  },
  actionLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subjectTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: "600",
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  priorityLabel: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
  },
});
