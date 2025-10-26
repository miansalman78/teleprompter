import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface ImageItemProps {
  imageItem: {
    id: string;
    imageUri: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    isSelected: boolean;
  };
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onPositionUpdate: (id: string, x: number, y: number) => void;
  screenWidth: number;
  screenHeight: number;
  styles: any;
}

const ImageItem: React.FC<ImageItemProps> = ({
  imageItem,
  onSelect,
  onRemove,
  onResize,
  onPositionUpdate,
  screenWidth,
  screenHeight,
  styles
}) => {
  const translateX = useSharedValue(imageItem.x);
  const translateY = useSharedValue(imageItem.y);
  const scale = useSharedValue(1);
  const pinchScale = useSharedValue(1);

  const updateImagePosition = (x: number, y: number) => {
    const boundedX = Math.max(0, Math.min(screenWidth - imageItem.width, x));
    const boundedY = Math.max(0, Math.min(screenHeight - imageItem.height, y));
    onPositionUpdate(imageItem.id, boundedX, boundedY);
  };

  const updateImageSize = (newScale: number) => {
    const currentWidth = imageItem.width;
    const currentHeight = imageItem.height;
    const newWidth = Math.max(50, Math.min(300, currentWidth * newScale));
    const newHeight = Math.max(50, Math.min(300, currentHeight * newScale));
    onResize(imageItem.id, newWidth, newHeight);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.05);
      runOnJS(onSelect)(imageItem.id);
    })
    .onUpdate((event) => {
      translateX.value = imageItem.x + event.translationX;
      translateY.value = imageItem.y + event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      runOnJS(updateImagePosition)(translateX.value, translateY.value);
      translateX.value = withSpring(translateX.value);
      translateY.value = withSpring(translateY.value);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      runOnJS(onSelect)(imageItem.id);
      scale.value = withSpring(1.05);
    })
    .onUpdate((event) => {
      // Smooth pinch scaling with constraints
      pinchScale.value = Math.max(0.3, Math.min(3, event.scale));
    })
    .onEnd((event) => {
      scale.value = withSpring(1);
      runOnJS(updateImageSize)(event.scale);
      pinchScale.value = withSpring(1);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      const newWidth = imageItem.width >= 200 ? 100 : imageItem.width + 50;
      const newHeight = imageItem.height >= 200 ? 100 : imageItem.height + 50;
      runOnJS(onResize)(imageItem.id, newWidth, newHeight);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value * pinchScale.value },
      { rotate: `${imageItem.rotation}deg` }
    ],
  }));

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, doubleTap);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.imageOverlay,
          {
            width: imageItem.width,
            height: imageItem.height,
            borderWidth: imageItem.isSelected ? 2 : 0,
            borderColor: imageItem.isSelected ? '#259B9A' : 'transparent',
            borderRadius: imageItem.isSelected ? 8 : 0,
          },
          animatedStyle
        ]}
      >
        <TouchableOpacity
          onLongPress={() => onRemove(imageItem.id)}
          activeOpacity={0.8}
          style={{ width: '100%', height: '100%' }}
        >
          <Image
            source={{ uri: imageItem.imageUri }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 8,
            }}
            resizeMode="contain"
            onError={(error) => {
              console.error('Image load error:', error);
            }}
            onLoad={() => {
              console.log('Image loaded successfully');
            }}
          />
        </TouchableOpacity>
        
        {/* Cross Icon for Easy Removal */}
        {imageItem.isSelected && (
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
              zIndex: 10,
            }}
            onPress={() => onRemove(imageItem.id)}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 12,
                height: 2,
                backgroundColor: '#FFFFFF',
                borderRadius: 1,
                transform: [{ rotate: '45deg' }],
                position: 'absolute',
              }}
            />
            <View
              style={{
                width: 12,
                height: 2,
                backgroundColor: '#FFFFFF',
                borderRadius: 1,
                transform: [{ rotate: '-45deg' }],
                position: 'absolute',
              }}
            />
          </TouchableOpacity>
        )}

        {/* Resize handles for selected image */}
        {imageItem.isSelected && (
          <>
            {/* Corner resize handles */}
            <View
              style={{
                position: 'absolute',
                top: -5,
                left: -5,
                width: 10,
                height: 10,
                backgroundColor: '#259B9A',
                borderRadius: 5,
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                width: 10,
                height: 10,
                backgroundColor: '#259B9A',
                borderRadius: 5,
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -5,
                left: -5,
                width: 10,
                height: 10,
                backgroundColor: '#259B9A',
                borderRadius: 5,
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                width: 10,
                height: 10,
                backgroundColor: '#259B9A',
                borderRadius: 5,
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            />
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

export default ImageItem;
