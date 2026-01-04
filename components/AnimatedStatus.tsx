import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import theme from '@/constants/theme';

interface StatusBadgeProps {
  status: 'day1' | 'day2' | 'day3';
  duration?: number;
}

/**
 * Animated Status Badge
 * Shows unlock status with emoji and smooth transitions
 */
export const AnimatedStatusBadge: React.FC<StatusBadgeProps> = ({ status, duration = 600 }) => {
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  const getStatusConfig = (st: string) => {
    switch (st) {
      case 'day1':
        return { emoji: '🌫️', label: 'Jour 1', color: '#FF9800' };
      case 'day2':
        return { emoji: '⏳', label: 'Jour 2', color: '#2196F3' };
      case 'day3':
        return { emoji: '✅', label: 'Jour 3', color: '#4CAF50' };
      default:
        return { emoji: '❓', label: 'Unknown', color: '#999' };
    }
  };

  const config = getStatusConfig(status);

  useEffect(() => {
    // Animate entry
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [status, scaleValue, opacityValue]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.color,
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
      ]}
    >
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={styles.label}>{config.label}</Text>
    </Animated.View>
  );
};

interface ProgressBarProps {
  progress: number; // 0-100
  duration?: number;
  showLabel?: boolean;
}

/**
 * Animated Progress Bar
 * Shows unlock progress with smooth animation
 */
export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  duration = 600,
  showLabel = true,
}) => {
  const widthValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthValue, {
      toValue: progress,
      duration,
      useNativeDriver: false,
    }).start();
  }, [progress, duration, widthValue]);

  return (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            width: widthValue.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
      {showLabel && (
        <Text style={styles.progressLabel}>
          {Math.round(progress)}%
        </Text>
      )}
    </View>
  );
};

interface CounterAnimationProps {
  count: number;
  maxCount?: number;
}

/**
 * Animated Message Counter
 * Bounces up and down when count increases
 */
export const AnimatedCounter: React.FC<CounterAnimationProps> = ({ count, maxCount = 10 }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count !== prevCountRef.current) {
      // Bounce animation
      Animated.sequence([
        Animated.spring(scaleValue, {
          toValue: 1.2,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      prevCountRef.current = count;
    }
  }, [count, scaleValue]);

  const getColor = () => {
    const ratio = count / (maxCount || 10);
    if (ratio < 0.5) return '#FF6B6B'; // Red
    if (ratio < 0.8) return '#FFD93D'; // Yellow
    return '#6BCB77'; // Green
  };

  return (
    <Animated.View
      style={[
        styles.counterBadge,
        {
          backgroundColor: getColor(),
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <Text style={styles.counterText}>{count}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressLabel: {
    position: 'absolute',
    right: 8,
    top: -20,
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  counterBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
