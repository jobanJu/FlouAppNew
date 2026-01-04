import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import theme from '@/constants/theme';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

export interface ToastManagerRef {
  show: (message: string, type?: Toast['type'], duration?: number) => void;
  success: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
}

export const ToastManager = React.forwardRef<ToastManagerRef>((_, ref) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const animValue = useRef(new Animated.Value(0)).current;

  React.useImperativeHandle(ref, () => {
    const showImpl = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      });
    };

    return {
      show: showImpl,
      success: (message: string, duration?: number) => showImpl(message, 'success', duration),
      info: (message: string, duration?: number) => showImpl(message, 'info', duration),
      warning: (message: string, duration?: number) => showImpl(message, 'warning', duration),
      error: (message: string, duration?: number) => showImpl(message, 'error', duration),
    };
  });

  const getBackgroundColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
      default:
        return theme.colors.primary;
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          style={[
            styles.toast,
            {
              backgroundColor: getBackgroundColor(toast.type),
              opacity: animValue,
              transform: [
                {
                  translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.icon}>{getIcon(toast.type)}</Text>
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
