import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface VideoTimelineProps {
  duration: number; // Video duration in seconds
  currentTime: number; // Current playback time
  onTimeChange: (time: number) => void;
  onTrimStart: (time: number) => void;
  onTrimEnd: (time: number) => void;
  trimStart?: number;
  trimEnd?: number;
  videoFrames?: string[]; // Array of frame URIs for thumbnails
  isLoading?: boolean; // Loading state for frames
}

export default function VideoTimeline({
  duration,
  currentTime,
  onTimeChange,
  onTrimStart,
  onTrimEnd,
  trimStart = 0,
  trimEnd = duration,
  videoFrames = [],
  isLoading = false
}: VideoTimelineProps) {
  // Timeline layout width (px)
  const [trackWidthState, setTrackWidthState] = useState(0);
  const trackWidth = useSharedValue(0);

  // Handle sizes
  const handleDiameter = moderateScale(18);
  const minGapPx = moderateScale(10);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionFromTime = (time: number) => {
    if (trackWidthState === 0 || duration === 0) return 0;
    return (time / duration) * trackWidthState;
  };

  const getTimeFromPosition = (positionPx: number) => {
    if (trackWidthState === 0) return 0;
    const clamped = Math.max(0, Math.min(trackWidthState, positionPx));
    return (clamped / trackWidthState) * duration;
  };
  // Animated shared values store pixel positions
  const trimStartX = useSharedValue(0);
  const trimEndX = useSharedValue(0);

  // Sync initial values when layout or props change
  useEffect(() => {
    const startPx = getPositionFromTime(trimStart);
    const endPx = getPositionFromTime(trimEnd);
    trimStartX.value = startPx;
    trimEndX.value = endPx;
  }, [trackWidthState, trimStart, trimEnd, duration]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidthState(w);
    trackWidth.value = w;
  };

  // Gesture start positions
  const trimStartStartX = useSharedValue(0);
  const trimEndStartX = useSharedValue(0);

  const trimStartGesture = Gesture.Pan()
    .onStart(() => {
      trimStartStartX.value = trimStartX.value;
    })
    .onUpdate((event) => {
      const next = Math.min(
        Math.max(0, trimStartStartX.value + event.translationX),
        trimEndX.value - minGapPx
      );
      trimStartX.value = next;
      runOnJS(onTrimStart)(getTimeFromPosition(next));
    });

  const trimEndGesture = Gesture.Pan()
    .onStart(() => {
      trimEndStartX.value = trimEndX.value;
    })
    .onUpdate((event) => {
      const next = Math.max(
        Math.min(trackWidth.value, trimEndStartX.value + event.translationX),
        trimStartX.value + minGapPx
      );
      trimEndX.value = next;
      runOnJS(onTrimEnd)(getTimeFromPosition(next));
    });

  // Animated styles
  const trimStartHandleStyle = useAnimatedStyle(() => ({
    left: trimStartX.value,
  }));

  const trimEndHandleStyle = useAnimatedStyle(() => ({
    left: trimEndX.value,
  }));

  const trimAreaStyle = useAnimatedStyle(() => ({
    left: trimStartX.value,
    width: Math.max(0, trimEndX.value - trimStartX.value),
  }));


  // Generate time markers for each second with better spacing
  const generateTimeMarkers = () => {
    const markers = [];
    const totalSeconds = Math.ceil(duration);
    
    // Only show markers at reasonable intervals to avoid overcrowding
    const maxMarkers = 8; // Maximum number of markers to show
    const interval = totalSeconds <= maxMarkers ? 1 : Math.ceil(totalSeconds / maxMarkers);
    
    for (let i = 0; i <= totalSeconds; i += interval) {
      const position = (i / duration) * 100;
      markers.push(
        <View key={i} style={[styles.timeMarker, { left: `${position}%` }]}>
          <View style={styles.markerLine} />
          <Text style={styles.markerText}>{i}s</Text>
        </View>
      );
    }
    
    // Always show the end marker
    if (totalSeconds % interval !== 0) {
      const position = 100;
      markers.push(
        <View key={totalSeconds} style={[styles.timeMarker, { left: `${position}%` }]}>
          <View style={styles.markerLine} />
          <Text style={styles.markerText}>{totalSeconds}s</Text>
        </View>
      );
    }
    
    return markers;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.timelineContainer}>
        {/* Time markers for each second */}
        <View style={styles.timeMarkersContainer}>
          {generateTimeMarkers()}
        </View>

        {/* Timeline track */}
        <View style={styles.timelineTrack} onLayout={onTrackLayout}>
          {/* Background track */}
          <View style={styles.backgroundTrack} />
          
          {/* Video frame thumbnails */}
          {!isLoading && videoFrames.length > 0 && (
            <View style={styles.framesContainer}>
              {videoFrames.map((frameUri, index) => {
                if (!frameUri || frameUri.trim() === '') return null;
                const frameTime = (index / videoFrames.length) * duration;
                const position = (frameTime / duration) * 100;
                
                return (
                  <Image
                    key={`frame-${index}`}
                    source={{ uri: frameUri }}
                    style={[
                      styles.frameThumbnail,
                      { left: `${position}%` }
                    ]}
                    resizeMode="cover"
                  />
                );
              })}
            </View>
          )}
          
          {/* Loading indicator for frames */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Generating frames...</Text>
            </View>
          )}
          
          {/* Second interval markers on track - simplified */}
          {Array.from({ length: Math.min(Math.ceil(duration) + 1, 9) }, (_, i) => {
            const interval = duration <= 8 ? 1 : duration / 8;
            const time = i * interval;
            if (time <= duration) {
              return (
                <View 
                  key={`track-marker-${i}`}
                  style={[
                    styles.trackMarker,
                    { left: `${(time / duration) * 100}%` }
                  ]}
                />
              );
            }
            return null;
          }).filter(Boolean)}
          
          {/* Trim selection area */}
          <Animated.View 
            style={[
              styles.trimArea,
              trimAreaStyle,
            ]}
          />

          {/* Trim start handle */}
          <GestureDetector gesture={trimStartGesture}>
            <Animated.View
              style={[
                styles.trimHandle,
                styles.trimStartHandle,
                trimStartHandleStyle,
              ]}
            >
              <MaterialIcons name="drag-handle" size={16} color="white" />
            </Animated.View>
          </GestureDetector>

          {/* Trim end handle */}
          <GestureDetector gesture={trimEndGesture}>
            <Animated.View
              style={[
                styles.trimHandle,
                styles.trimEndHandle,
                trimEndHandleStyle,
              ]}
            >
              <MaterialIcons name="drag-handle" size={16} color="white" />
            </Animated.View>
          </GestureDetector>



          {/* Playhead */}
          <View 
            style={[
              styles.playhead,
              { left: `${getPositionFromTime(currentTime)}%` }
            ]}
          >
            <View style={styles.playheadLine} />
            <View style={styles.playheadHandle}>
              <MaterialIcons name="play-arrow" size={12} color="white" />
            </View>
          </View>
        </View>

        {/* Current time display */}
        <View style={styles.currentTimeContainer}>
          <Text style={styles.currentTimeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>

        {/* Trim info */}
        <View style={styles.trimInfo}>
          <Text style={styles.trimInfoText}>
            Trim: {formatTime(trimStart)} - {formatTime(trimEnd)} 
            ({formatTime(trimEnd - trimStart)} selected)
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(20),
  },
  timelineContainer: {
    width: '100%',
  },
  timeMarkersContainer: {
    position: 'relative',
    height: moderateScale(25),
    marginBottom: moderateScale(5),
  },
  timeMarker: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
    minWidth: moderateScale(20),
    transform: [{ translateX: -10 }], // Center the marker
  },
  markerLine: {
    width: 1,
    height: moderateScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  markerText: {
    color: 'white',
    fontSize: moderateScale(9),
    marginTop: moderateScale(2),
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: moderateScale(2),
    borderRadius: moderateScale(2),
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  timeLabel: {
    color: 'white',
    fontSize: moderateScale(12),
    opacity: 0.7,
  },
  timelineTrack: {
    height: moderateScale(40),
    position: 'relative',
    marginVertical: moderateScale(10),
  },
  backgroundTrack: {
    position: 'absolute',
    top: moderateScale(15),
    left: 0,
    right: 0,
    height: moderateScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: moderateScale(2),
  },
  trackMarker: {
    position: 'absolute',
    top: moderateScale(13),
    width: 1,
    height: moderateScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginLeft: -0.5,
  },
  // Frame thumbnails styles
  framesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  frameThumbnail: {
    position: 'absolute',
    top: 0,
    width: moderateScale(20),
    height: '100%',
    borderRadius: moderateScale(2),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    color: 'white',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  trimArea: {
    position: 'absolute',
    top: moderateScale(15),
    height: moderateScale(4),
    backgroundColor: '#007AFF',
    borderRadius: moderateScale(2),
  },
  trimHandle: {
    position: 'absolute',
    top: moderateScale(8),
    width: moderateScale(18),
    height: moderateScale(18),
    backgroundColor: '#007AFF',
    borderRadius: moderateScale(9),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(-9),
  },
  trimStartHandle: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  trimEndHandle: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: moderateScale(2),
    marginLeft: moderateScale(-1),
  },
  playheadLine: {
    width: moderateScale(2),
    height: '100%',
    backgroundColor: '#FF3B30',
  },
  playheadHandle: {
    position: 'absolute',
    top: moderateScale(-6),
    left: moderateScale(-8),
    width: moderateScale(18),
    height: moderateScale(18),
    backgroundColor: '#FF3B30',
    borderRadius: moderateScale(9),
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentTimeContainer: {
    alignItems: 'center',
    marginTop: moderateScale(10),
  },
  currentTimeText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  trimInfo: {
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  trimInfoText: {
    color: '#007AFF',
    fontSize: moderateScale(12),
    opacity: 0.8,
  },
});