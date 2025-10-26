import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Image, LayoutChangeEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  isLoading = false,
}: VideoTimelineProps) {
  // Timeline layout width (px)
  const [trackWidthState, setTrackWidthState] = useState(0);
  const trackWidth = useSharedValue(0);
  const [showTrimUI, setShowTrimUI] = useState(false);
  
  // Debug: Log trim values
  useEffect(() => {
    console.log('Trim UI Debug:', {
      showTrimUI,
      trimStart,
      trimEnd,
      trackWidthState,
      duration
    });
  }, [showTrimUI, trimStart, trimEnd, trackWidthState, duration]);

  // Debug: Log videoFrames changes
  useEffect(() => {
    console.log('🎬 VideoTimeline videoFrames updated:', {
      frameCount: videoFrames.length,
      duration,
      trimStart,
      trimEnd,
      frameSamples: videoFrames.slice(0, 3).map(f => ({ uri: f ? f.substring(0, 50) + '...' : 'empty' }))
    });
  }, [videoFrames, duration, trimStart, trimEnd]);
  const pxPerSecond = moderateScale(60);
  const frameGapPx = 0; // No gap between frames
  const markersScrollRef = useRef<ScrollView>(null);
  const thumbnailsScrollRef = useRef<ScrollView>(null);
  const isMarkersScrolling = useRef(false);
  const isThumbnailsScrolling = useRef(false);

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
    // For trimmed videos, the time should be relative to the trimmed duration
    // If we have trim info, adjust the time calculation
    const adjustedTime = trimStart > 0 ? Math.max(0, time - trimStart) : time;
    return (adjustedTime / duration) * trackWidthState;
  };
  
  const getPositionPercentage = (time: number) => {
    if (duration === 0) return 0;
    // For trimmed videos, the time should be relative to the trimmed duration
    const adjustedTime = trimStart > 0 ? Math.max(0, time - trimStart) : time;
    return (adjustedTime / duration) * 100;
  };
  // Animated shared values store pixel positions
  const trimStartX = useSharedValue(0);
  const trimEndX = useSharedValue(0);

  // Sync initial values when layout or props change
  useEffect(() => {
    // For trimmed videos, the trim markers should be positioned relative to the trimmed timeline
    // If we have a trim start > 0, the trim markers should start at 0 (beginning of trimmed timeline)
    // The end marker should be at the end of the trimmed timeline (full width)
    const startPx = trimStart > 0 ? 0 : getPositionFromTime(trimStart);
    const endPx = trimStart > 0 ? trackWidthState : getPositionFromTime(trimEnd);
    
    console.log(`🎯 Trim marker positioning: trimStart=${trimStart}, trimEnd=${trimEnd}, startPx=${startPx}, endPx=${endPx}, duration=${duration}, trackWidthState=${trackWidthState}`);
    
    trimStartX.value = startPx;
    trimEndX.value = endPx;
  }, [trackWidthState, trimStart, trimEnd, duration]);

  // Recalculate width when duration changes (new video uploaded)
  useEffect(() => {
    if (duration > 0) {
      const newWidth = Math.ceil(duration) * pxPerSecond;
      setTrackWidthState(newWidth);
      trackWidth.value = newWidth;
    }
  }, [duration]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const viewportW = e.nativeEvent.layout.width;
    const contentW = Math.max(viewportW, Math.ceil(Math.max(1, duration)) * pxPerSecond);
    setTrackWidthState(contentW);
    trackWidth.value = contentW;
  };

  // Gesture start positions
  const trimStartStartX = useSharedValue(0);
  const trimEndStartX = useSharedValue(0);

  const trimStartGesture = Gesture.Pan()
    .activeCursor('grab')
    .minDistance(0)
    .onStart(() => {
      trimStartStartX.value = trimStartX.value;
    })
    .onUpdate((event) => {
      const next = Math.min(
        Math.max(0, trimStartStartX.value + event.translationX),
        trimEndX.value - minGapPx
      );
      trimStartX.value = next;
    })
    .onEnd(() => {
      'worklet';
      const positionPx = trimStartX.value;
      const trackW = trackWidth.value;
      const dur = duration;
      
      // Calculate time on UI thread safely
      if (trackW === 0 || dur === 0) {
        runOnJS(onTrimStart)(0);
        return;
      }
      
      const clamped = Math.max(0, Math.min(trackW, positionPx));
      const time = (clamped / trackW) * dur;
      
      if (typeof time === 'number' && !isNaN(time) && isFinite(time)) {
        runOnJS(onTrimStart)(time);
      }
    });

  const trimEndGesture = Gesture.Pan()
    .activeCursor('grab')
    .minDistance(0)
    .onStart(() => {
      trimEndStartX.value = trimEndX.value;
    })
    .onUpdate((event) => {
      const next = Math.max(
        Math.min(trackWidth.value, trimEndStartX.value + event.translationX),
        trimStartX.value + minGapPx
      );
      trimEndX.value = next;
    })
    .onEnd(() => {
      'worklet';
      const positionPx = trimEndX.value;
      const trackW = trackWidth.value;
      const dur = duration;
      
      // Calculate time on UI thread safely
      if (trackW === 0 || dur === 0) {
        runOnJS(onTrimEnd)(dur);
        return;
      }
      
      const clamped = Math.max(0, Math.min(trackW, positionPx));
      const time = (clamped / trackW) * dur;
      
      if (typeof time === 'number' && !isNaN(time) && isFinite(time)) {
        runOnJS(onTrimEnd)(time);
      }
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
    
    // Show every second marker
    for (let i = 0; i <= totalSeconds; i += 1) {
      const positionPx = i * pxPerSecond;
      markers.push(
        <View key={i} style={[styles.timeMarker, { left: positionPx }]}>
          <View style={styles.markerLine} />
          <Text style={styles.markerText}>{i}s</Text>
        </View>
      );
    }
    
    return markers;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.timelineContainer}>
        {/* Time markers for each second (scrollable) */}
        <ScrollView
          key={`markers-${duration}`}
          ref={markersScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: trackWidthState }}
          scrollEventThrottle={16}
          onScroll={(event) => {
            if (isThumbnailsScrolling.current) return;
            isMarkersScrolling.current = true;
            const offsetX = event.nativeEvent.contentOffset.x;
            if (thumbnailsScrollRef.current) {
              thumbnailsScrollRef.current.scrollTo({ x: offsetX, animated: false });
            }
            setTimeout(() => { isMarkersScrolling.current = false; }, 50);
          }}
        >
          <View style={[styles.timeMarkersContainer, { width: trackWidthState }]}>
            {generateTimeMarkers()}
          </View>
        </ScrollView>

        {/* Timeline track (tap to toggle trim UI) */}
        <ScrollView
          key={`thumbnails-${duration}`}
          ref={thumbnailsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={onTrackLayout}
          contentContainerStyle={{ width: trackWidthState }}
          scrollEventThrottle={16}
          onScroll={(event) => {
            if (isMarkersScrolling.current) return;
            isThumbnailsScrolling.current = true;
            const offsetX = event.nativeEvent.contentOffset.x;
            if (markersScrollRef.current) {
              markersScrollRef.current.scrollTo({ x: offsetX, animated: false });
            }
            setTimeout(() => { isThumbnailsScrolling.current = false; }, 50);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.timelineTrack, { width: trackWidthState }]}
            onPress={() => {
              setShowTrimUI((v) => !v);
            }}
          >
          {/* Background track */}
          <View style={styles.backgroundTrack} />
          
          {/* Video frame thumbnails: one per second */}
          {!isLoading && (
            <View style={[styles.framesContainer, { width: trackWidthState }] }>
              {Array.from({ length: Math.max(1, Math.ceil(duration)) }).map((_, i) => {
                // For trimmed videos, position thumbnails relative to the trimmed timeline
                // For normal videos, use the original positioning logic
                const timeInSeconds = i; // Time in seconds for this thumbnail
                const leftPx = trimStart > 0 ? (i * pxPerSecond) : getPositionFromTime(timeInSeconds);
                const widthPx = pxPerSecond; // Full width, no gap
                
                // For trimmed video, use direct frame mapping since frames are already for the trimmed portion
                const frameIndex = videoFrames.length > 0
                  ? Math.min(videoFrames.length - 1, i) // Direct mapping for trimmed frames
                  : -1;
                const uri = frameIndex >= 0 ? videoFrames[frameIndex] : undefined;
                
                console.log(`Thumbnail ${i}: timeInSeconds=${timeInSeconds}, leftPx=${leftPx}, frameIndex=${frameIndex}, uri=${uri ? 'exists' : 'missing'}, duration=${duration}, trimStart=${trimStart}, trimEnd=${trimEnd}`);
                
                // For trimmed videos, always show thumbnails since they're already trimmed
                // The frames array contains only the trimmed portion
                const shouldShowThumbnail = true; // Always show for trimmed videos
                
                return (
                  <View
                    key={`sec-${i}`}
                    style={[
                      styles.perSecondFrame, 
                      { 
                        left: leftPx, 
                        width: widthPx,
                        opacity: shouldShowThumbnail ? 1 : 0.3
                      }
                    ]}
                  >
                    {uri && shouldShowThumbnail ? (
                      <Image source={{ uri }} style={styles.frameThumbnail} resizeMode="cover" />
                    ) : (
                      <View style={styles.framePlaceholder} />
                    )}
                  </View>
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
          
           {/* Second interval markers on track - every second */}
           {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => {
             const timeInSeconds = i;
             // For trimmed videos, position markers relative to the trimmed timeline
             // For normal videos, use the original positioning logic
             const leftPx = trimStart > 0 ? (i * pxPerSecond) : getPositionFromTime(timeInSeconds);
             return (
               <View
                 key={`track-marker-${i}`}
                 style={[styles.trackMarker, { left: leftPx }]}
               />
             );
           })}
          
          {/* Trim UI */}
          {showTrimUI && (
            <>
              <Animated.View 
                style={[
                  styles.trimArea,
                  trimAreaStyle,
                ]}
              />
              <GestureDetector gesture={trimStartGesture}>
                <Animated.View
                  style={[
                    styles.trimHandle,
                    styles.trimStartHandle,
                    trimStartHandleStyle,
                  ]}
                >
                  <MaterialIcons name="drag-handle" size={20} color="white" />
                </Animated.View>
              </GestureDetector>
              <GestureDetector gesture={trimEndGesture}>
                <Animated.View
                  style={[
                    styles.trimHandle,
                    styles.trimEndHandle,
                    trimEndHandleStyle,
                  ]}
                >
                  <MaterialIcons name="drag-handle" size={20} color="white" />
                </Animated.View>
              </GestureDetector>
            </>
          )}



          {/* Playhead */}
          <View 
            style={[
              styles.playhead,
              { 
                left: (() => {
                  // For trimmed videos, currentTime is already relative to the trimmed timeline
                  // So we can use it directly without subtracting trimStart
                  const playheadPosition = trimStart > 0 
                    ? Math.max(0, Math.min(trackWidthState, currentTime * pxPerSecond))
                    : getPositionFromTime(currentTime);
                  
                  console.log(`🎯 Playhead positioning: currentTime=${currentTime}, trimStart=${trimStart}, playheadPosition=${playheadPosition}, trackWidthState=${trackWidthState}`);
                  
                  return playheadPosition;
                })()
              }
            ]}
          >
            <View style={styles.playheadLine} />
            <View style={styles.playheadHandle}>
              <MaterialIcons name="play-arrow" size={12} color="white" />
            </View>
          </View>

          </TouchableOpacity>
        </ScrollView>

        {/* Current time display */}
        <View style={styles.currentTimeContainer}>
          <Text style={styles.currentTimeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>

        {/* Trim info */}
        {showTrimUI && (
          <View style={styles.trimInfo}>
            <Text style={styles.trimInfoText}>
              Trim: {formatTime(trimStart)} - {formatTime(trimEnd)} 
              ({formatTime(trimEnd - trimStart)} selected)
            </Text>
          </View>
        )}


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
  perSecondFrame: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    paddingHorizontal: 0, // No padding between frames
  },
  frameThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  framePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    zIndex: 15, // Above frames but below handles
  },
  trimHandle: {
    position: 'absolute',
    top: moderateScale(5),
    width: moderateScale(28),
    height: moderateScale(28),
    backgroundColor: '#007AFF',
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(-14),
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 20, // Higher than split icons
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