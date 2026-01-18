import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

export interface GestureConfig {
  enabled: boolean;
  threshold: number; // Minimum distance for gesture recognition
  velocity: number; // Minimum velocity for gesture
  hapticFeedback: boolean;
}

export interface GestureNavigationOptions {
  onSwipeLeft?: () => void; // Navigate forward/next
  onSwipeRight?: () => void; // Navigate back
  onSwipeUp?: () => void; // Open menu/quick actions
  onSwipeDown?: () => void; // Close/hide
  onPinch?: (scale: number) => void; // Zoom controls
  onDoubleTap?: () => void; // Quick action
}

export function useGestureNavigation(
  options: GestureNavigationOptions,
  config: GestureConfig = {
    enabled: true,
    threshold: 50,
    velocity: 0.3,
    hapticFeedback: true
  }
) {
  const [, setLocation] = useLocation();

  const triggerHapticFeedback = useCallback(() => {
    if (config.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [config.hapticFeedback]);

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down', velocity: number) => {
    if (velocity < config.velocity) return;

    triggerHapticFeedback();

    switch (direction) {
      case 'left':
        options.onSwipeLeft?.();
        break;
      case 'right':
        options.onSwipeRight?.();
        break;
      case 'up':
        options.onSwipeUp?.();
        break;
      case 'down':
        options.onSwipeDown?.();
        break;
    }
  }, [options, config.velocity, triggerHapticFeedback]);

  const handlePinch = useCallback((scale: number) => {
    options.onPinch?.(scale);
  }, [options]);

  const handleDoubleTap = useCallback(() => {
    triggerHapticFeedback();
    options.onDoubleTap?.();
  }, [options, triggerHapticFeedback]);

  useEffect(() => {
    if (!config.enabled) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastTap = 0;
    let initialDistance = 0;
    let isTrackingPinch = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();

      // Detect double tap
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTap;
      if (timeDiff < 300 && timeDiff > 0) {
        handleDoubleTap();
      }
      lastTap = currentTime;

      // Handle pinch start
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        isTrackingPinch = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isTrackingPinch) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        if (initialDistance > 0) {
          const scale = currentDistance / initialDistance;
          if (Math.abs(scale - 1) > 0.1) {
            handlePinch(scale);
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY || !startTime) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime; // pixels per ms

      // Only trigger if distance is above threshold
      if (distance < config.threshold) return;

      // Determine direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          handleSwipe('right', velocity);
        } else {
          handleSwipe('left', velocity);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handleSwipe('down', velocity);
        } else {
          handleSwipe('up', velocity);
        }
      }

      // Reset tracking
      startX = 0;
      startY = 0;
      startTime = 0;
      isTrackingPinch = false;
      initialDistance = 0;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    config.enabled,
    config.threshold,
    config.velocity,
    handleSwipe,
    handlePinch,
    handleDoubleTap,
    triggerHapticFeedback
  ]);

  // Default navigation handlers based on current location
  const getDefaultNavigationHandlers = useCallback((): GestureNavigationOptions => {
    const currentPath = window.location.pathname;

    return {
      onSwipeRight: () => {
        // Navigate back in history
        window.history.back();
      },
      onSwipeLeft: () => {
        // Navigate to next logical screen
        if (currentPath === '/') {
          setLocation('/practice');
        } else if (currentPath === '/practice') {
          setLocation('/songs');
        } else if (currentPath === '/songs') {
          setLocation('/tuner');
        }
      },
      onSwipeUp: () => {
        // Open quick actions menu
        window.dispatchEvent(new CustomEvent('openQuickActions'));
      },
      onSwipeDown: () => {
        // Scroll to top or close modals
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onPinch: (scale) => {
        // Zoom controls
        if (scale > 1.2) {
          // Zoom in - show more details
          document.body.classList.add('zoom-in');
        } else if (scale < 0.8) {
          // Zoom out - show overview
          document.body.classList.add('zoom-out');
        }
      },
      onDoubleTap: () => {
        // Quick practice start
        setLocation('/practice');
      }
    };
  }, [setLocation]);

  return {
    getDefaultNavigationHandlers,
    triggerHapticFeedback
  };
}
