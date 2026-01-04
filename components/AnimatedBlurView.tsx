import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface AnimatedBlurViewProps {
  intensity: number; // 0-100
  duration?: number;
  children: React.ReactNode;
  style?: any;
}

/**
 * Animated Blur Component
 * Smoothly transitions between blur levels
 */
export const AnimatedBlurView = React.forwardRef<
  Animated.Value,
  AnimatedBlurViewProps
>(({ intensity, duration = 600, children, style }, ref) => {
  const animValue = useRef(new Animated.Value(intensity)).current;

  // Update animation when intensity changes
  useEffect(() => {
    Animated.timing(animValue, {
      toValue: intensity,
      duration,
      useNativeDriver: false,
    }).start();
  }, [intensity, duration, animValue]);

  // Expose animated value via ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(animValue);
      } else {
        ref.current = animValue;
      }
    }
  }, [animValue, ref]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: animValue.interpolate({
            inputRange: [0, 100],
            outputRange: [1, 0.3],
          }),
        },
      ]}
    >
      <Animated.View
        style={{
          transform: [
            {
              scale: animValue.interpolate({
                inputRange: [0, 100],
                outputRange: [1, 1.05],
              }),
            },
          ],
        }}
      >
        {children}
      </Animated.View>

      {/* Blur overlay */}
      {intensity > 0 && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: animValue.interpolate({
                inputRange: [0, 100],
                outputRange: ['rgba(255, 255, 255, 0)', 'rgba(200, 200, 220, 0.4)'],
              }),
            },
          ]}
        />
      )}

      {/* Native blur */}
      {intensity > 0 && (
        <BlurView intensity={Math.min(100, intensity)} style={StyleSheet.absoluteFill} />
      )}
    </Animated.View>
  );
});

AnimatedBlurView.displayName = 'AnimatedBlurView';
