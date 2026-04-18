import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SUBJECT_COLORS, SUBJECT_TEXT_COLORS, Task } from "@/context/TasksContext";
import { useColors } from "@/hooks/useColors";

const SUBJECTS = Object.keys(SUBJECT_COLORS);
const PRIORITIES: Task["priority"][] = ["low", "medium", "high"];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, "id" | "completed">) => void;
  defaultDate?: string;
  editTask?: Task;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function AddTaskModal({ visible, onClose, onSave, defaultDate, editTask }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("other");
  const [date, setDate] = useState(defaultDate ?? todayStr());
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setSubject(editTask.subject);
      setDate(editTask.date);
      setPriority(editTask.priority);
      setNotes(editTask.notes ?? "");
    } else {
      setTitle("");
      setSubject("other");
      setDate(defaultDate ?? todayStr());
      setPriority("medium");
      setNotes("");
    }
  }, [editTask, defaultDate, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({ title: title.trim(), subject, date, priority, notes });
    onClose();
  };

  const PRIORITY_COLORS: Record<Task["priority"], string> = {
    low: "#34C759",
    medium: "#FF9500",
    high: "#FF3B30",
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.separator }]} />

          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {editTask ? "Edit Task" : "New Task"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 16, paddingHorizontal: 20 }}
          >
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.muted, color: colors.foreground },
              ]}
              placeholder="Task title..."
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="done"
            />

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Subject</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={styles.row}>
                  {SUBJECTS.map((s) => {
                    const bg = SUBJECT_COLORS[s];
                    const tc = SUBJECT_TEXT_COLORS[s];
                    const selected = s === subject;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.subjectChip,
                          {
                            backgroundColor: bg,
                            borderWidth: selected ? 2 : 0,
                            borderColor: tc,
                          },
                        ]}
                        onPress={() => setSubject(s)}
                      >
                        <Text style={[styles.subjectChipText, { color: tc }]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Priority</Text>
              <View style={[styles.row, { marginTop: 8 }]}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityBtn,
                      {
                        backgroundColor:
                          priority === p ? PRIORITY_COLORS[p] : colors.muted,
                      },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: priority === p ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Date</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.muted, color: colors.foreground, marginTop: 8 },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                value={date}
                onChangeText={setDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Notes (optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.notesInput,
                  { backgroundColor: colors.muted, color: colors.foreground, marginTop: 8 },
                ]}
                placeholder="Any additional notes..."
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: title.trim() ? colors.primary : colors.border },
              ]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                {editTask ? "Save Changes" : "Add Task"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: "92%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
