import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { MusicTrack } from '../utils/musicLibrary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MusicTimelineProps {
  selectedTrack: MusicTrack | null;
  videoDuration: number; // in seconds
  musicStartTime: number; // in seconds
  musicEndTime: number; // in seconds
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
  onRemoveTrack: () => void;
}

const MusicTimeline: React.FC<MusicTimelineProps> = ({
  selectedTrack,
  videoDuration,
  musicStartTime,
  musicEndTime,
  onStartTimeChange,
  onEndTimeChange,
  onRemoveTrack,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'start' | 'end' | null>(null);
  
  // Calculate timeline width similar to video timeline
  const frameWidth = moderateScale(60);
  const frameSpacing = moderateScale(0);
  const totalFrameWidth = frameWidth + frameSpacing;
  const timelineWidth = Math.max(SCREEN_WIDTH - moderateScale(40), videoDuration * totalFrameWidth);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionFromTime = (time: number): number => {
    return (time / videoDuration) * timelineWidth;
  };

  const getTimeFromPosition = (position: number): number => {
    return (position / timelineWidth) * videoDuration;
  };

  const handleTimelinePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const newTime = getTimeFromPosition(locationX);
    const clampedTime = Math.max(0, Math.min(newTime, videoDuration));
    
    // If clicked closer to start, move start handle
    if (Math.abs(clampedTime - musicStartTime) < Math.abs(clampedTime - musicEndTime)) {
      onStartTimeChange(Math.min(clampedTime, musicEndTime - 1));
    } else {
      onEndTimeChange(Math.max(clampedTime, musicStartTime + 1));
    }
  };

  const handleStartDrag = (type: 'start' | 'end') => {
    console.log('Starting drag for:', type);
    setIsDragging(true);
    setDragType(type);
  };

  const handleEndDrag = () => {
    console.log('Ending drag');
    setIsDragging(false);
    setDragType(null);
  };

  const handleStartTimeDrag = (event: any) => {
    const { translationX } = event.nativeEvent;
    const newPosition = getPositionFromTime(musicStartTime) + translationX;
    const newTime = Math.max(0, Math.min(getTimeFromPosition(newPosition), musicEndTime - 1));
    onStartTimeChange(newTime);
  };

  const handleEndTimeDrag = (event: any) => {
    const { translationX } = event.nativeEvent;
    const newPosition = getPositionFromTime(musicEndTime) + translationX;
    const newTime = Math.max(musicStartTime + 1, Math.min(getTimeFromPosition(newPosition), videoDuration));
    onEndTimeChange(newTime);
  };

  const renderTimeMarkers = () => {
    const markers = [];
    const markerInterval = 1; // Show every second
    
    for (let i = 0; i <= videoDuration; i += markerInterval) {
      const framePosition = (i * frameWidth) + (i * frameSpacing) + frameWidth;
      markers.push(
        <View
          key={i}
          style={[
            styles.timeMarker,
            { left: framePosition }
          ]}
        >
          <View style={[styles.markerLine, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]} />
          <Text style={styles.markerText}>
            {formatTime(i)}
          </Text>
        </View>
      );
    }
    
    return markers;
  };

  if (!selectedTrack) {
    return (
      <View style={styles.container}>
        <Text style={styles.noTrackText}>No music track selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timelineContainer}>
        {/* Track Info */}
        <View style={styles.trackInfo}>
          <View style={styles.trackHeader}>
            <MaterialIcons name="music-note" size={moderateScale(16)} color="#259B9A" />
            <Text style={styles.trackName}>{selectedTrack.name}</Text>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={onRemoveTrack}
            >
              <MaterialIcons name="close" size={moderateScale(16)} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.trackArtist}>by {selectedTrack.artist}</Text>
        </View>

        {/* Timeline Scroll View */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timelineScrollView}
          contentContainerStyle={{ width: Math.max(timelineWidth, SCREEN_WIDTH) }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleTimelinePress}
            style={styles.timelineTrack}
          >
            {/* Timeline Background */}
            <View style={styles.timelineBackground} />
            
            {/* Time Markers */}
            <View style={styles.markersContainer}>
              {renderTimeMarkers()}
            </View>

            {/* Music Track Overlay */}
            <View
              style={[
                styles.musicTrack,
                {
                  left: getPositionFromTime(musicStartTime),
                  width: getPositionFromTime(musicEndTime) - getPositionFromTime(musicStartTime),
                },
              ]}
            />

            {/* Start Handle */}
            <PanGestureHandler
              onHandlerStateChange={(event) => {
                if (event.nativeEvent.state === State.ACTIVE) {
                  console.log('Start handle drag active');
                  handleStartDrag('start');
                } else if (event.nativeEvent.state === State.END) {
                  console.log('Start handle drag end');
                  handleEndDrag();
                }
              }}
              onGestureEvent={handleStartTimeDrag}
            >
              <View
                style={[
                  styles.timeHandle,
                  styles.startHandle,
                  isDragging && dragType === 'start' && styles.draggingHandle,
                  { left: Math.max(getPositionFromTime(musicStartTime) - moderateScale(12), 0) },
                ]}
              >
                <TouchableOpacity
                  style={styles.handleButton}
                  onPress={() => {
                    console.log('Start handle press');
                    const newTime = Math.min(musicEndTime - 1, musicStartTime + 5);
                    onStartTimeChange(newTime);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.handleGrip} />
                  <Text style={styles.handleText}>◀</Text>
                </TouchableOpacity>
              </View>
            </PanGestureHandler>

            {/* End Handle */}
            <PanGestureHandler
              onHandlerStateChange={(event) => {
                if (event.nativeEvent.state === State.ACTIVE) {
                  console.log('End handle drag active');
                  handleStartDrag('end');
                } else if (event.nativeEvent.state === State.END) {
                  console.log('End handle drag end');
                  handleEndDrag();
                }
              }}
              onGestureEvent={handleEndTimeDrag}
            >
              <View
                style={[
                  styles.timeHandle,
                  styles.endHandle,
                  isDragging && dragType === 'end' && styles.draggingHandle,
                  { left: Math.min(getPositionFromTime(musicEndTime) - moderateScale(12), timelineWidth - moderateScale(24)) },
                ]}
              >
                <TouchableOpacity
                  style={styles.handleButton}
                  onPress={() => {
                    console.log('End handle press');
                    const newTime = Math.max(musicStartTime + 1, musicEndTime - 5);
                    onEndTimeChange(newTime);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.handleGrip} />
                  <Text style={styles.handleText}>▶</Text>
                </TouchableOpacity>
              </View>
            </PanGestureHandler>
          </TouchableOpacity>
        </ScrollView>

        {/* Time Labels */}
        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>{formatTime(musicStartTime)}</Text>
          <Text style={styles.timeLabel}>{formatTime(musicEndTime)}</Text>
        </View>

        {/* Trim Controls */}
        <View style={styles.trimControls}>
          <TouchableOpacity 
            style={styles.trimButton}
            onPress={() => {
              const newTime = Math.max(0, musicStartTime - 1);
              onStartTimeChange(newTime);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.trimButtonText}>Start -1s</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.trimButton}
            onPress={() => {
              const newTime = Math.min(musicEndTime - 1, musicStartTime + 1);
              onStartTimeChange(newTime);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.trimButtonText}>Start +1s</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.trimButton}
            onPress={() => {
              const newTime = Math.max(musicStartTime + 1, musicEndTime - 1);
              onEndTimeChange(newTime);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.trimButtonText}>End -1s</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.trimButton}
            onPress={() => {
              const newTime = Math.min(videoDuration, musicEndTime + 1);
              onEndTimeChange(newTime);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.trimButtonText}>End +1s</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.instructionText}>
          {isDragging ? 
            `Dragging ${dragType === 'start' ? 'start' : 'end'} point` : 
            'Hold handles to drag • Tap handles for quick trim • Use buttons for precise control'
          }
        </Text>
      </View>

      <View style={styles.licenseInfo}>
        <Text style={styles.licenseText}>
          License: {selectedTrack.license} - {selectedTrack.attribution}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: moderateScale(8),
    margin: moderateScale(10),
  },
  timelineContainer: {
    backgroundColor: '#1a1a1a',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(15),
  },
  trackInfo: {
    marginBottom: moderateScale(10),
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(5),
  },
  trackName: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginLeft: moderateScale(8),
    flex: 1,
  },
  trackArtist: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(12),
    marginLeft: moderateScale(24),
  },
  removeButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
  },
  timelineScrollView: {
    height: moderateScale(80),
  },
  timelineTrack: {
    position: 'relative',
    height: moderateScale(80),
  },
  timelineBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(60),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(4),
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
  musicTrack: {
    position: 'absolute',
    top: moderateScale(10),
    height: moderateScale(40),
    backgroundColor: '#259B9A',
    borderRadius: moderateScale(4),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#259B9A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  timeHandle: {
    position: 'absolute',
    top: moderateScale(5),
    bottom: moderateScale(5),
    width: moderateScale(24),
    backgroundColor: '#259B9A',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  startHandle: {
    borderTopLeftRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(8),
  },
  endHandle: {
    borderTopRightRadius: moderateScale(8),
    borderBottomRightRadius: moderateScale(8),
  },
  draggingHandle: {
    backgroundColor: '#00D4FF',
    transform: [{ scale: 1.2 }],
    shadowColor: '#00D4FF',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 12,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(10),
  },
  timeLabel: {
    color: 'white',
    fontSize: moderateScale(12),
  },
  licenseInfo: {
    backgroundColor: 'rgba(37, 155, 154, 0.1)',
    padding: moderateScale(8),
    borderRadius: moderateScale(4),
    marginTop: moderateScale(10),
  },
  licenseText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(10),
    textAlign: 'center',
  },
  noTrackText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  handleGrip: {
    width: moderateScale(4),
    height: moderateScale(12),
    backgroundColor: 'white',
    borderRadius: moderateScale(2),
    marginBottom: moderateScale(4),
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  handleText: {
    color: 'white',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  handleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(11),
    textAlign: 'center',
    marginTop: moderateScale(5),
    fontStyle: 'italic',
  },
  trimControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  trimButton: {
    backgroundColor: 'rgba(37, 155, 154, 0.2)',
    borderColor: '#259B9A',
    borderWidth: 1,
    borderRadius: moderateScale(6),
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(8),
    flex: 1,
    marginHorizontal: moderateScale(2),
  },
  trimButtonText: {
    color: '#259B9A',
    fontSize: moderateScale(10),
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MusicTimeline;