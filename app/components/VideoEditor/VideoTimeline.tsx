import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { moderateScale } from '@/utils/scaling';
import { AppColors } from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

interface VideoTimelineProps {
  videoDuration: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
  videoFrames?: string[];
  isLoading?: boolean;
}

const VideoTimeline: React.FC<VideoTimelineProps> = ({
  videoDuration,
  currentTime,
  onTimeChange,
  videoFrames = [],
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Generate frame thumbnails with proper spacing for every second
  const generateFrames = () => {
    // Create exactly one frame per second
    const frameCount = Math.ceil(videoDuration);
    const frames = [];
    
    console.log('VideoTimeline - generateFrames called with:', {
      videoDuration,
      frameCount,
      videoFramesLength: videoFrames.length
    });
    
    // Generate one frame for each second of the video
    for (let i = 0; i < frameCount; i++) {
      const timeAtSecond = i; // Each frame represents exactly i seconds
      const frameIndex = videoFrames.length > 0 ? 
        Math.floor((timeAtSecond / videoDuration) * videoFrames.length) : i;
      
      frames.push({
        id: i,
        time: timeAtSecond,
        thumbnail: videoFrames[frameIndex] || null,
      });
    }
    return frames;
  };

  const frames = generateFrames();
  
  // Optimized scaling for perfect interval alignment
  const baseFrameWidth = moderateScale(60); // Increased frame width
  const baseSpacing = moderateScale(0); // No spacing between thumbnails
  
  // Consistent scaling regardless of video duration for uniform intervals
  const frameWidth = baseFrameWidth;
  const frameSpacing = baseSpacing;
  
  const totalFrameWidth = frameWidth + frameSpacing; // Total space per second
  const timelineWidth = frames.length * totalFrameWidth;
  const scrubberPosition = (currentTime / videoDuration) * timelineWidth;

  const handleTimelinePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const newTime = (locationX / timelineWidth) * videoDuration;
    onTimeChange(Math.max(0, Math.min(videoDuration, newTime)));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderTimeMarkers = () => {
    const markers = [];
    const markerInterval = 1; // Always show every second
    
    for (let i = 0; i <= videoDuration; i += markerInterval) {
      // Position marker at the end of each frame (where the spacing starts)
      const framePosition = (i * frameWidth) + (i * frameSpacing) + frameWidth;
      markers.push(
        <View
          key={i}
          style={[
            styles.timeMarker,
            { left: framePosition } // Position at end of each second (where spacing is)
          ]}
        >
          <View style={[styles.markerLine, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]} />
          <Text style={styles.markerText}>
            {formatTime(i)}
          </Text>
        </View>
      );
    }
    
    // Add end marker for clear interval completion
    if (videoDuration > 0) {
      const endPosition = Math.ceil(videoDuration) * totalFrameWidth;
      markers.push(
        <View
          key="end"
          style={[
            styles.timeMarker,
            { left: endPosition }
          ]}
        >
          <View style={[styles.markerLine, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} />
          <Text style={styles.markerText}>
            {formatTime(Math.ceil(videoDuration))}
          </Text>
        </View>
      );
    }
    
    return markers;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timelineContainer}>
        {/* Current Time Display */}
        <View style={styles.timeDisplay}>
          <Text style={styles.currentTime}>
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </Text>
        </View>

        {/* Timeline Scroll View */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timelineScrollView}
          contentContainerStyle={{ width: Math.max(timelineWidth, screenWidth) }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleTimelinePress}
            style={styles.timelineTrack}
          >
            {/* Frame Thumbnails */}
            <View style={styles.framesContainer}>
              {isLoading ? (
                // Show loading placeholders - one for each second with spacing only at second intervals
                Array.from({ length: Math.ceil(videoDuration) }).map((_, index) => (
                  <View key={index} style={[styles.frameItem, { 
                    width: frameWidth, 
                    marginRight: (index + 1) % 1 === 0 ? frameSpacing : 0, // Space only at second intervals
                    backgroundColor: '#2a2a2a', // Slightly different background for loading
                  }]}>
                    <View style={styles.placeholderFrame}>
                      <MaterialIcons name="hourglass-empty" size={16} color="#666" />
                      <Text style={{ color: '#666', fontSize: 8, marginTop: 2 }}>
                        {Math.floor(index / 60).toString().padStart(2, '0')}:{(index % 60).toString().padStart(2, '0')}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                frames.map((frame, index) => (
                  <View key={frame.id} style={[styles.frameItem, { 
                    width: frameWidth, 
                    marginRight: (index + 1) % 1 === 0 ? frameSpacing : 0, // Space only at second intervals
                    overflow: 'hidden'
                  }]}>
                    {frame.thumbnail && typeof frame.thumbnail === 'string' && frame.thumbnail.trim() !== '' ? (
                      <Image 
                        source={{ uri: frame.thumbnail }} 
                        style={styles.frameThumbnail}
                        onLoad={() => console.log('VideoTimeline - Image loaded for frame', frame.id, frame.thumbnail.substring(0, 50))}
                        onError={(error) => console.log('VideoTimeline - Image error for frame', frame.id, error.nativeEvent)}
                        onLoadStart={() => console.log('VideoTimeline - Image load started for frame', frame.id)}
                        onLoadEnd={() => console.log('VideoTimeline - Image load ended for frame', frame.id)}
                      />
                    ) : (
                      <View style={styles.placeholderFrame}>
                        <MaterialIcons name="videocam" size={16} color="#666" />
                        <Text style={{ color: '#666', fontSize: 8, marginTop: 2 }}>
                          {formatTime(frame.time)}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* Time Markers */}
            <View style={styles.markersContainer}>
              {renderTimeMarkers()}
            </View>

            {/* Playhead/Scrubber */}
            <View
              style={[
                styles.playhead,
                { left: scrubberPosition }
              ]}
            >
              <View style={styles.playheadLine} />
              <View style={styles.playheadHandle} />
            </View>
          </TouchableOpacity>
        </ScrollView>


      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  timelineContainer: {
    backgroundColor: '#1a1a1a',
    paddingVertical: moderateScale(10),
  },
  timeDisplay: {
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  currentTime: {
    color: 'white',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  timelineScrollView: {
    height: moderateScale(80),
  },
  timelineTrack: {
    position: 'relative',
    height: moderateScale(80),
  },
  framesContainer: {
    flexDirection: 'row',
    height: moderateScale(60),
  },
  frameItem: {
    height: moderateScale(60),
    marginRight: 1,
  },
  frameThumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  timeMarker: {
    position: 'absolute',
    alignItems: 'center',
    width: moderateScale(30), // Fixed width for better positioning
  },
  markerLine: {
    width: 1,
    height: moderateScale(60),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  markerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(9),
    marginTop: moderateScale(2),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: moderateScale(2),
    borderRadius: moderateScale(2),
    textAlign: 'center',
    minWidth: moderateScale(28),
  },
  playhead: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  playheadLine: {
    width: 2,
    height: moderateScale(60),
    backgroundColor: '#00D4FF',
  },
  playheadHandle: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#00D4FF',
    marginTop: -moderateScale(6),
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default VideoTimeline;