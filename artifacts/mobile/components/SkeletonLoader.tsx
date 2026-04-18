import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function SkeletonBlock({
  width,
  height,
  borderRadius = 8,
  shimmer,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  shimmer: Animated.Value;
}) {
  const colors = useColors();
  const bg = colors.muted;
  const shimmerColor = colors.border;

  const interpolated = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [bg, shimmerColor],
  });

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: interpolated,
      }}
    />
  );
}

export function TaskSkeleton() {
  const colors = useColors();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
    return () => shimmer.stopAnimation();
  }, []);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderRadius: 14 },
      ]}
    >
      <SkeletonBlock width={22} height={22} borderRadius={11} shimmer={shimmer} />
      <View style={styles.textGroup}>
        <SkeletonBlock width="70%" height={14} shimmer={shimmer} />
        <SkeletonBlock width="40%" height={11} borderRadius={6} shimmer={shimmer} />
      </View>
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.dashSkeleton}>
      {[1, 2, 3].map((i) => (
        <TaskSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  textGroup: { flex: 1, gap: 6 },
  dashSkeleton: { gap: 0 },
});
