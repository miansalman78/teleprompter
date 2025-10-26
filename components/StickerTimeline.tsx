import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { moderateScale } from '@/utils/scaling';

const { width: screenWidth } = Dimensions.get('window');

interface StickerTimelineProps {
  videoDuration: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
  onAddStickerAtTime: (time: number) => void;
  stickers?: Array<{
    id: string;
    time: number;
    sticker: string;
  }>;
  onStickerPress?: (id: string) => void;
}

const StickerTimeline: React.FC<StickerTimelineProps> = ({
  videoDuration,
  currentTime,
  onTimeChange,
  onAddStickerAtTime,
  stickers,
  onStickerPress,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate timeline dimensions
  const secondWidth = moderateScale(60); // Width per second
  // Ensure videoDuration is valid and use actual video duration from player
  // Use a minimum of 5 seconds for better visualization when video duration is very small or zero
  const validVideoDuration = isNaN(videoDuration) || videoDuration <= 0 ? 5 : videoDuration;
  
  // Log video duration for debugging
  React.useEffect(() => {
    console.log('StickerTimeline received videoDuration:', videoDuration);
  }, [videoDuration]);
  // Adjust timelineWidth to match actual video duration
  const timelineWidth = Math.max(validVideoDuration * secondWidth, screenWidth);
  // Ensure we don't divide by zero and handle edge cases
  const scrubberPosition = validVideoDuration > 0 ? (currentTime / validVideoDuration) * timelineWidth : 0;
  
  // Auto-scroll to keep the playhead visible
  React.useEffect(() => {
    if (!isDragging && scrollViewRef.current && validVideoDuration > 0) {
      const scrollPosition = scrubberPosition - screenWidth / 2;
      scrollViewRef.current.scrollTo({ x: Math.max(0, scrollPosition), animated: true });
    }
  }, [currentTime, isDragging, scrubberPosition, validVideoDuration]);

  // Handle timeline press to change current time
  const handleTimelinePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const newTime = (locationX / timelineWidth) * videoDuration;
    onTimeChange(Math.max(0, Math.min(videoDuration, newTime)));
  };

  // Handle adding a sticker at the current time
  const handleAddSticker = () => {
    onAddStickerAtTime(currentTime);
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
            {/* Time markers */}
            <View style={styles.markersContainer}>
              {Array.from({ length: Math.ceil(validVideoDuration) + 1 }).map((_, index) => {
                // Calculate marker position based on percentage of total duration
                const markerPosition = (index / Math.ceil(validVideoDuration)) * timelineWidth;
                return (
                  <View
                    key={`marker-${index}`}
                    style={[
                      styles.timeMarker,
                      { left: markerPosition }
                    ]}
                  >
                    <View style={styles.markerLine} />
                    <Text style={styles.markerText}>{index}s</Text>
                  </View>
                );
              })}
            </View>

            {/* Sticker markers */}
            <View style={styles.stickersContainer}>
              {stickers && stickers.map((sticker) => (
                <TouchableOpacity
                  key={sticker.id}
                  style={[
                    styles.stickerMarker,
                    { left: (sticker.time / videoDuration) * timelineWidth }
                  ]}
                  onPress={() => onStickerPress && onStickerPress(sticker.id)}
                >
                  <View style={styles.stickerIndicator}>
                    <Text style={styles.stickerText}>{sticker.sticker}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Current time playhead */}
            <View style={[styles.playhead, { left: scrubberPosition }]}>
              <View style={styles.playheadLine} />
              <View style={styles.playheadHandle} />
            </View>

            {/* Add sticker button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddSticker}
              activeOpacity={0.8}
            >
              <MaterialIcons name="emoji-emotions" size={moderateScale(18)} color="#fff" />
            </TouchableOpacity>
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
    width: moderateScale(30),
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
  stickersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  stickerMarker: {
    position: 'absolute',
    top: moderateScale(10),
    alignItems: 'center',
    zIndex: 5,
  },
  stickerIndicator: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#259B9A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  stickerText: {
    fontSize: moderateScale(16),
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
  addButton: {
    position: 'absolute',
    right: moderateScale(8),
    top: moderateScale(8),
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(37,155,154,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StickerTimeline;