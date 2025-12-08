import React, { useState, useCallback } from 'react';

interface SwipeInput {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOutput {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const MIN_SWIPE_DISTANCE_X = 60; // Minimum horizontal distance to trigger a swipe
const MAX_SWIPE_DISTANCE_Y = 60; // Maximum vertical distance to allow for a horizontal swipe

export const useSwipe = (input: SwipeInput): SwipeOutput => {
  const [touchStart, setTouchStart] = useState<[number, number] | null>(null);
  const [touchEnd, setTouchEnd] = useState<[number, number] | null>(null);
  
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null); // Clear previous touch end
    setTouchStart([e.targetTouches[0].clientX, e.targetTouches[0].clientY]);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd([e.targetTouches[0].clientX, e.targetTouches[0].clientY]);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart[0] - touchEnd[0];
    const distanceY = touchStart[1] - touchEnd[1];
    const isLeftSwipe = distanceX > MIN_SWIPE_DISTANCE_X;
    const isRightSwipe = distanceX < -MIN_SWIPE_DISTANCE_X;

    // We want to detect horizontal swipes, so we check if the vertical movement is small
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceY) < MAX_SWIPE_DISTANCE_Y) {
        if (isLeftSwipe && input.onSwipeLeft) {
            input.onSwipeLeft();
        }
        if (isRightSwipe && input.onSwipeRight) {
            input.onSwipeRight();
        }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, input]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
