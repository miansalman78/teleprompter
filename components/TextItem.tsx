import React, { useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface TextItemProps {
  textOverlay: {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    timestamp: number;
    isSelected?: boolean;
    animation?: 'fade' | 'slide' | 'bounce' | 'zoom' | 'rotate' | 'scale-in' | 'none';
  };
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, fontSize: number) => void;
  onPositionUpdate: (id: string, x: number, y: number) => void;
  screenWidth: number;
  styles: any;
}

const TextItem: React.FC<TextItemProps> = ({
  textOverlay,
  onSelect,
  onRemove,
  onResize,
  onPositionUpdate,
  screenWidth,
  styles
}) => {
  const translateX = useSharedValue(textOverlay.x);
  const translateY = useSharedValue(textOverlay.y);
  const scale = useSharedValue(1);
  const pinchScale = useSharedValue(1);
  const opacity = useSharedValue(textOverlay.animation === 'fade' ? 0 : 1);
  const animationScale = useSharedValue(textOverlay.animation === 'zoom' || textOverlay.animation === 'scale-in' ? 0.3 : 1);
  const slideOffset = useSharedValue(textOverlay.animation === 'slide' ? 100 : 0);
  const rotation = useSharedValue(textOverlay.animation === 'rotate' ? 360 : 0);

  const updateTextPosition = (x: number, y: number) => {
    const boundedX = Math.max(0, Math.min(screenWidth - 100, x));
    const boundedY = Math.max(0, Math.min(400, y));
    onPositionUpdate(textOverlay.id, boundedX, boundedY);
  };

  const updateTextSize = (newScale: number) => {
    const currentSize = textOverlay.fontSize;
    const newSize = Math.max(12, Math.min(72, currentSize * newScale));
    onResize(textOverlay.id, newSize);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.1);
      runOnJS(onSelect)(textOverlay.id);
    })
    .onUpdate((event) => {
      translateX.value = textOverlay.x + event.translationX;
      translateY.value = textOverlay.y + event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      runOnJS(updateTextPosition)(translateX.value, translateY.value);
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      runOnJS(onSelect)(textOverlay.id);
      // Add slight scale feedback when pinch starts
      scale.value = withSpring(1.05);
    })
    .onUpdate((event) => {
      // Smooth pinch scaling with constraints
      pinchScale.value = Math.max(0.5, Math.min(2, event.scale));
    })
    .onEnd((event) => {
      // Reset scale feedback
      scale.value = withSpring(1);
      runOnJS(updateTextSize)(event.scale);
      pinchScale.value = withSpring(1);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      const newSize = textOverlay.fontSize >= 48 ? 18 : textOverlay.fontSize + 6;
      runOnJS(onResize)(textOverlay.id, newSize);
    });

  // Apply animation effects when component mounts
  useEffect(() => {
    // Force animation to run by setting initial values
    if (textOverlay.animation === 'fade') {
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 1200 });
    } else if (textOverlay.animation === 'zoom') {
      animationScale.value = 0.3;
      opacity.value = 0.5;
      animationScale.value = withSpring(1, { damping: 10, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 600 });
    } else if (textOverlay.animation === 'slide') {
      slideOffset.value = 150;
      opacity.value = 0;
      slideOffset.value = withSpring(0, { damping: 15, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 500 });
    } else if (textOverlay.animation === 'bounce') {
      scale.value = 1;
      scale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(0.7, { duration: 150 }),
        withTiming(1.2, { duration: 150 }),
        withTiming(0.85, { duration: 150 }),
        withTiming(1.1, { duration: 150 }),
        withTiming(0.95, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    } else if (textOverlay.animation === 'rotate') {
      rotation.value = 360;
      opacity.value = 0;
      rotation.value = withSpring(0, { damping: 12, stiffness: 80 });
      opacity.value = withTiming(1, { duration: 700 });
    } else if (textOverlay.animation === 'scale-in') {
      animationScale.value = 0.3;
      opacity.value = 0;
      animationScale.value = withSequence(
        withTiming(1.2, { duration: 400 }),
        withSpring(1, { damping: 8, stiffness: 100 })
      );
      opacity.value = withTiming(1, { duration: 600 });
    }
  }, [textOverlay.id]); // Add dependency on textOverlay.id to ensure animation runs for each new text

  const animatedStyle = useAnimatedStyle(() => {
    const animTransforms = [
      { translateX: translateX.value + slideOffset.value },
      { translateY: translateY.value },
      { scale: scale.value * pinchScale.value * animationScale.value },
      { rotate: `${rotation.value}deg` },
    ];
    
    return {
      transform: animTransforms,
      opacity: opacity.value,
    };
  });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, doubleTap);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.textOverlay,
          {
            borderWidth: textOverlay.isSelected ? 2 : 0,
            borderColor: textOverlay.isSelected ? '#259B9A' : 'transparent',
            borderRadius: textOverlay.isSelected ? 8 : 0,
            padding: textOverlay.isSelected ? 8 : 0,
          },
          animatedStyle
        ]}
      >
        <TouchableOpacity
          onLongPress={() => onRemove(textOverlay.id)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.overlayText,
              {
                fontSize: textOverlay.fontSize,
                color: textOverlay.color,
                fontFamily: textOverlay.fontFamily,
          
              }
            ]}
          >
            {textOverlay.text}
          </Text>
        </TouchableOpacity>
        
        {/* Cross Icon for Easy Removal */}
        {textOverlay.isSelected && (
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
            onPress={() => onRemove(textOverlay.id)}
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

export default TextItem;