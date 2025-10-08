import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';

interface StickerItemProps {
  sticker: {
    id: string;
    sticker: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    isSelected: boolean;
  };
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, size: number) => void;
  onPositionUpdate: (id: string, x: number, y: number) => void;
  screenWidth: number;
  styles: any;
}

const StickerItem: React.FC<StickerItemProps> = ({
  sticker,
  onSelect,
  onRemove,
  onResize,
  onPositionUpdate,
  screenWidth,
  styles
}) => {
  const translateX = useSharedValue(sticker.x);
  const translateY = useSharedValue(sticker.y);
  const scale = useSharedValue(1);
  const pinchScale = useSharedValue(1);

  const updateStickerPosition = (x: number, y: number) => {
    const boundedX = Math.max(0, Math.min(screenWidth - 60, x));
    const boundedY = Math.max(0, Math.min(400, y));
    onPositionUpdate(sticker.id, boundedX, boundedY);
  };

  const updateStickerSize = (newScale: number) => {
    const currentSize = sticker.size;
    const newSize = Math.max(20, Math.min(100, currentSize * newScale));
    onResize(sticker.id, newSize);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.1);
      runOnJS(onSelect)(sticker.id);
    })
    .onUpdate((event) => {
      translateX.value = sticker.x + event.translationX;
      translateY.value = sticker.y + event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      runOnJS(updateStickerPosition)(translateX.value, translateY.value);
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      runOnJS(onSelect)(sticker.id);
    })
    .onUpdate((event) => {
      pinchScale.value = event.scale;
    })
    .onEnd((event) => {
      runOnJS(updateStickerSize)(event.scale);
      pinchScale.value = withSpring(1);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      const newSize = sticker.size >= 60 ? 30 : sticker.size + 15;
      runOnJS(onResize)(sticker.id, newSize);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value * pinchScale.value },
      { rotate: `${sticker.rotation}deg` }
    ],
  }));

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, doubleTap);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.stickerOverlay,
          {
            borderWidth: sticker.isSelected ? 2 : 0,
            borderColor: sticker.isSelected ? '#259B9A' : 'transparent',
            borderRadius: sticker.isSelected ? 8 : 0,
          },
          animatedStyle
        ]}
      >
        <TouchableOpacity
          onLongPress={() => onRemove(sticker.id)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.stickerText,
              {
                fontSize: sticker.size,
              }
            ]}
          >
            {sticker.sticker}
          </Text>
        </TouchableOpacity>
        
        {/* Cross Icon for Easy Removal */}
        {sticker.isSelected && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              width: 24,
              height: 24,
              backgroundColor: '#FF4444',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
            onPress={() => onRemove(sticker.id)}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 'bold',
                lineHeight: 14,
              }}
            >
              ×
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

export default StickerItem;