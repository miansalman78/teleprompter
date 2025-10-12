import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TransitionEffect {
  id: string;
  name: string;
  icon: string;
  timestamp: number;
  duration: number;
}

interface TransitionOverlayProps {
  videoDuration: number;
  currentTime: number;
  onAddTransition: (transition: TransitionEffect) => void;
  onRemoveTransition: (transitionId: string) => void;
  existingTransitions: TransitionEffect[];
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ 
  videoDuration, 
  currentTime, 
  onAddTransition, 
  onRemoveTransition,
  existingTransitions 
}) => {
  const [selectedTransition, setSelectedTransition] = useState('slide-left');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedTimestamp, setSelectedTimestamp] = useState(currentTime);

  const transitions = [
    { id: 'slide-left', name: 'Slide Left', icon: 'arrow-back', description: 'Slide from right to left' },
    { id: 'slide-right', name: 'Slide Right', icon: 'arrow-forward', description: 'Slide from left to right' },
    { id: 'slide-up', name: 'Slide Up', icon: 'arrow-upward', description: 'Slide from bottom to top' },
    { id: 'slide-down', name: 'Slide Down', icon: 'arrow-downward', description: 'Slide from top to bottom' },
    { id: 'fade', name: 'Fade', icon: 'blur-on', description: 'Fade in/out effect' },
    { id: 'zoom-in', name: 'Zoom In', icon: 'zoom-in', description: 'Zoom in effect' },
    { id: 'zoom-out', name: 'Zoom Out', icon: 'zoom-out', description: 'Zoom out effect' },
    { id: 'spin', name: 'Spin', icon: 'rotate-right', description: 'Spinning transition' },
    { id: 'blur', name: 'Blur', icon: 'blur-circular', description: 'Blur transition effect' },
  ];

  const durations = [0.5, 1, 1.5, 2, 2.5, 3];

  const handleAddTransition = () => {
    const newTransition: TransitionEffect = {
      id: Date.now().toString(),
      name: selectedTransition,
      icon: transitions.find(t => t.id === selectedTransition)?.icon || 'blur-on',
      timestamp: selectedTimestamp,
      duration: selectedDuration,
    };
    
    onAddTransition(newTransition);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Transitions</Text>
      
      <ScrollView style={styles.content}>
        {/* Timeline Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineTrack}>
              {/* Timeline markers */}
              {Array.from({ length: Math.ceil(videoDuration) + 1 }, (_, i) => (
                <View key={i} style={[styles.timeMarker, { left: `${(i / videoDuration) * 100}%` }]}>
                  <View style={styles.markerLine} />
                  <Text style={styles.markerText}>{i}s</Text>
                </View>
              ))}
              
              {/* Current time indicator */}
              <View style={[styles.currentTimeIndicator, { left: `${(currentTime / videoDuration) * 100}%` }]}>
                <View style={styles.currentTimeLine} />
                <Text style={styles.currentTimeText}>{formatTime(currentTime)}</Text>
              </View>
              
              {/* Existing transitions */}
              {existingTransitions.map((transition) => (
                <View 
                  key={transition.id}
                  style={[
                    styles.transitionMarker, 
                    { left: `${(transition.timestamp / videoDuration) * 100}%` }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.transitionIcon}
                    onPress={() => onRemoveTransition(transition.id)}
                  >
                    <MaterialIcons name={transition.icon as any} size={moderateScale(12)} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.transitionLabel}>{transition.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Timestamp Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add at Time: {formatTime(selectedTimestamp)}</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={videoDuration}
              value={selectedTimestamp}
              onValueChange={setSelectedTimestamp}
              minimumTrackTintColor="#259B9A"
              maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
              thumbTintColor="#259B9A"
              step={0.1}
            />
          </View>
        </View>

        {/* Transition Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transition Type</Text>
          <View style={styles.transitionGrid}>
            {transitions.map((transition) => (
              <TouchableOpacity
                key={transition.id}
                style={[
                  styles.transitionCard,
                  selectedTransition === transition.id && styles.selectedTransitionCard
                ]}
                onPress={() => setSelectedTransition(transition.id)}
              >
                <MaterialIcons 
                  name={transition.icon as any} 
                  size={moderateScale(24)} 
                  color={selectedTransition === transition.id ? '#259B9A' : 'white'} 
                />
                <Text style={[
                  styles.transitionName,
                  selectedTransition === transition.id && styles.selectedTransitionName
                ]}>
                  {transition.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationContainer}>
            {durations.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  selectedDuration === duration && styles.selectedDurationButton
                ]}
                onPress={() => setSelectedDuration(duration)}
              >
                <Text style={[
                  styles.durationText,
                  selectedDuration === duration && styles.selectedDurationText
                ]}>
                  {duration}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddTransition}>
          <MaterialIcons name="add" size={moderateScale(20)} color="white" />
          <Text style={styles.addButtonText}>Add Transition</Text>
        </TouchableOpacity>

        {/* Existing Transitions List */}
        {existingTransitions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Applied Transitions</Text>
            {existingTransitions.map((transition) => (
              <View key={transition.id} style={styles.appliedTransition}>
                <MaterialIcons name={transition.icon as any} size={moderateScale(16)} color="#259B9A" />
                <Text style={styles.appliedTransitionText}>
                  {transition.name} at {formatTime(transition.timestamp)} ({transition.duration}s)
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemoveTransition(transition.id)}
                >
                  <MaterialIcons name="close" size={moderateScale(16)} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: moderateScale(20),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: moderateScale(25),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: 'white',
    marginBottom: moderateScale(12),
  },
  timelineContainer: {
    height: moderateScale(80),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
  },
  timelineTrack: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: moderateScale(4),
  },
  timeMarker: {
    position: 'absolute',
    top: 0,
    height: '100%',
    alignItems: 'center',
  },
  markerLine: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  markerText: {
    fontSize: moderateScale(8),
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: moderateScale(2),
  },
  currentTimeIndicator: {
    position: 'absolute',
    top: 0,
    height: '100%',
    alignItems: 'center',
  },
  currentTimeLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#259B9A',
  },
  currentTimeText: {
    fontSize: moderateScale(8),
    color: '#259B9A',
    fontWeight: 'bold',
    marginTop: moderateScale(2),
  },
  transitionMarker: {
    position: 'absolute',
    top: -moderateScale(5),
    alignItems: 'center',
  },
  transitionIcon: {
    backgroundColor: '#259B9A',
    borderRadius: moderateScale(10),
    padding: moderateScale(4),
  },
  transitionLabel: {
    fontSize: moderateScale(6),
    color: '#259B9A',
    fontWeight: 'bold',
    marginTop: moderateScale(2),
  },
  sliderContainer: {
    paddingHorizontal: moderateScale(10),
  },
  slider: {
    width: '100%',
    height: moderateScale(40),
  },
  transitionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  transitionCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTransitionCard: {
    backgroundColor: 'rgba(37, 155, 154, 0.2)',
    borderColor: '#259B9A',
  },
  transitionName: {
    fontSize: moderateScale(10),
    color: 'white',
    textAlign: 'center',
    marginTop: moderateScale(4),
  },
  selectedTransitionName: {
    color: '#259B9A',
    fontWeight: 'bold',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  durationButton: {
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(15),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedDurationButton: {
    backgroundColor: 'rgba(37, 155, 154, 0.2)',
    borderColor: '#259B9A',
  },
  durationText: {
    color: 'white',
    fontSize: moderateScale(12),
  },
  selectedDurationText: {
    color: '#259B9A',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#259B9A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    marginVertical: moderateScale(20),
  },
  addButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(8),
  },
  appliedTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  appliedTransitionText: {
    flex: 1,
    color: 'white',
    fontSize: moderateScale(12),
    marginLeft: moderateScale(8),
  },
  removeButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
  },
});

export default TransitionOverlay;