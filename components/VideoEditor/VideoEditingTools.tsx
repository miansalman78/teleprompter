import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import VideoTimeline from './VideoTimeline';

interface VideoEditingToolsProps {
  videoUri: string;
  videoDuration: number;
  splitTime?: number;
  onSplitTimeChange?: (t: number) => void;
  keptLeft?: boolean;
  keptRight?: boolean;
  onConfirmTrim: (startSec: number, endSec: number) => Promise<void> | void;
  onSplitVideo: (timeSec: number) => void;
  onCropVideo: () => void;
  onRotateVideo: () => void;
  onSpeedChange: (speed: number) => void;
  onDeleteClip: (startSec: number, endSec: number) => void;
  onDuplicateClip: () => void;
  onMergeClips: () => void;
  onReverseVideo: () => void;
  onClose?: () => void;
}

export default function VideoEditingTools({ 
  videoUri,
  videoDuration,
  splitTime: splitTimeProp,
  onSplitTimeChange,
  keptLeft,
  keptRight,
  onConfirmTrim,
  onSplitVideo, 
  onCropVideo, 
  onRotateVideo, 
  onSpeedChange, 
  onDeleteClip,
  onDuplicateClip,
  onMergeClips,
  onReverseVideo,
  onClose 
}: VideoEditingToolsProps) {
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
  
  // Timeline state
  const clampedDuration = useMemo(() => Math.max(0, videoDuration || 0), [videoDuration]);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(clampedDuration);
  // Split card state (single cut slider)
  const [splitTime, setSplitTime] = useState(
    splitTimeProp !== undefined ? Math.max(0, Math.min(clampedDuration, splitTimeProp)) : Math.max(0, Math.min(clampedDuration, clampedDuration / 2))
  );
  // Post-split selection state
  const [hasSplit, setHasSplit] = useState(false);
  const [selectedPart, setSelectedPart] = useState<null | 'left' | 'right'>(null);

  const handleTrimDone = async () => {
    const start = Math.max(0, Math.min(trimStart, clampedDuration));
    const end = Math.max(start, Math.min(trimEnd, clampedDuration));
    await onConfirmTrim(start, end);
  };

  const handleSplit = () => {
    const t = Math.max(0, Math.min(splitTime, clampedDuration));
    onSplitVideo(t);
    setHasSplit(true);
    setSelectedPart(null);
  };

  const handleCrop = () => {
    onCropVideo();
  };

  const handleRotate = () => {
    onRotateVideo();
  };

  const handleDelete = () => {
    if (!hasSplit || !selectedPart) return;
    const t = Math.max(0, Math.min(splitTime, clampedDuration));
    if (selectedPart === 'left') {
      onDeleteClip(0, t);
    } else {
      onDeleteClip(t, clampedDuration);
    }
  };

  const handleDuplicate = () => {
    onDuplicateClip();
  };

  const handleMerge = () => {
    onMergeClips();
  };

  const handleReverse = () => {
    onReverseVideo();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Editor</Text>   
      </View>

      {/* Video Timeline */}
      

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Trim Controls */}
        <VideoTimeline
        duration={clampedDuration}
        currentTime={currentTime}
        onTimeChange={setCurrentTime}
        onTrimStart={setTrimStart}
        onTrimEnd={setTrimEnd}
        trimStart={trimStart}
        trimEnd={trimEnd}
      />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trim</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleTrimDone}>
            <MaterialIcons name="done" size={24} color="white" />
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

      {/* Split Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Split</Text>
        <View style={{ marginBottom: moderateScale(8) }}>
          <Text style={{ color: 'white', marginBottom: moderateScale(6) }}>Cut at: {Math.max(0, Math.min(splitTime, clampedDuration)).toFixed(2)}s</Text>
          {/* Simple slider using RN Slider dependency */}
          <View style={{ height: moderateScale(40), justifyContent: 'center' }}>
             <Slider
              minimumValue={0}
              maximumValue={clampedDuration || 0}
              value={splitTime}
              step={0.01}
              minimumTrackTintColor="#259B9A"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="#259B9A"
               onValueChange={(v: number) => {
                 setSplitTime(v);
                 onSplitTimeChange && onSplitTimeChange(v);
               }}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSplit}>
          <MaterialIcons name="call-split" size={24} color="white" />
          <Text style={styles.primaryButtonText}>Split</Text>
        </TouchableOpacity>

        {hasSplit && (
          <View style={{ marginTop: moderateScale(12) }}>
            <Text style={{ color: 'white', marginBottom: moderateScale(8) }}>Clips are separated. Select one to delete:</Text>
             <View style={{ flexDirection: 'row', gap: moderateScale(8) }}>
              <TouchableOpacity
                onPress={() => setSelectedPart('left')}
                 disabled={keptLeft === false}
                 style={[
                   styles.chip,
                   selectedPart === 'left' && styles.chipActive,
                   keptLeft === false && { opacity: 0.4 }
                 ]}
              >
                <Text style={styles.chipText}>Left ({0}s - {Math.max(0, Math.min(splitTime, clampedDuration)).toFixed(2)}s)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedPart('right')}
                 disabled={keptRight === false}
                 style={[
                   styles.chip,
                   selectedPart === 'right' && styles.chipActive,
                   keptRight === false && { opacity: 0.4 }
                 ]}
              >
                <Text style={styles.chipText}>Right ({Math.max(0, Math.min(splitTime, clampedDuration)).toFixed(2)}s - {clampedDuration.toFixed(2)}s)</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              disabled={!selectedPart}
              style={[styles.primaryButton, { backgroundColor: selectedPart ? 'rgba(255,0,0,0.6)' : 'rgba(255,0,0,0.25)', marginTop: moderateScale(10) }]}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={24} color="white" />
              <Text style={styles.primaryButtonText}>Delete Selected</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

        {/* Basic Editing Tools */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Tools</Text>
        
          
          <TouchableOpacity style={styles.toolButton} onPress={handleCrop}>
            <MaterialIcons name="crop" size={24} color="white" />
            <Text style={styles.toolButtonText}>Crop Video</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton} onPress={handleRotate}>
            <MaterialIcons name="rotate-right" size={24} color="white" />
            <Text style={styles.toolButtonText}>Rotate Video</Text>
          </TouchableOpacity>
        </View> */}

        {/* Advanced Editing Tools */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Tools</Text>
          
          <TouchableOpacity style={styles.toolButton} onPress={handleDuplicate}>
            <MaterialIcons name="content-copy" size={24} color="white" />
            <Text style={styles.toolButtonText}>Duplicate Clip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton} onPress={handleMerge}>
            <MaterialIcons name="merge-type" size={24} color="white" />
            <Text style={styles.toolButtonText}>Merge Clips</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton} onPress={handleReverse}>
            <MaterialIcons name="flip" size={24} color="white" />
            <Text style={styles.toolButtonText}>Reverse Video</Text>
          </TouchableOpacity>
        </View> */}

        {/* Speed Control */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speed Control</Text>
          <View style={styles.speedContainer}>
            {speedOptions.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={styles.speedButton}
                onPress={() => onSpeedChange(speed)}
              >
                <Text style={styles.speedButtonText}>{speed}x</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View> */}

        {/* Danger Zone */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <MaterialIcons name="delete" size={24} color="white" />
            <Text style={styles.deleteButtonText}>Delete Clip</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: moderateScale(20),
      paddingTop: moderateScale(20),
      paddingBottom: moderateScale(10),
    },
    title: {
      color: 'white',
      fontSize: moderateScale(18),
      fontWeight: 'bold',
    },
    closeButton: {
      padding: moderateScale(8),
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: moderateScale(20),
      paddingBottom: moderateScale(20),
    },
    section: {
      marginBottom: moderateScale(20),
    },
    sectionTitle: {
      color: 'white',
      fontSize: moderateScale(16),
      fontWeight: '600',
      marginBottom: moderateScale(10),
    },
    toolButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: moderateScale(15),
      borderRadius: moderateScale(8),
      marginBottom: moderateScale(8),
    },
    toolButtonText: {
      color: 'white',
      fontSize: moderateScale(14),
      marginLeft: moderateScale(12),
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#259B9A',
      padding: moderateScale(14),
      borderRadius: moderateScale(8),
      marginBottom: moderateScale(8),
    },
    primaryButtonText: {
      color: 'white',
      fontSize: moderateScale(14),
      marginLeft: moderateScale(8),
      fontWeight: '600',
    },
    chip: {
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateScale(8),
      borderRadius: moderateScale(16),
      backgroundColor: 'rgba(255,255,255,0.1)'
    },
    chipActive: {
      backgroundColor: '#259B9A',
    },
    chipText: {
      color: 'white',
      fontSize: moderateScale(12),
      fontWeight: '600',
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      padding: moderateScale(15),
      borderRadius: moderateScale(8),
      marginTop: moderateScale(10),
      borderWidth: 1,
      borderColor: 'rgba(255, 0, 0, 0.5)',
    },
    deleteButtonText: {
      color: '#ff4444',
      fontSize: moderateScale(14),
      marginLeft: moderateScale(12),
      fontWeight: '600',
    },
    speedContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: moderateScale(8),
    },
    speedButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateScale(8),
      borderRadius: moderateScale(6),
    },
    speedButtonText: {
      color: 'white',
      fontSize: moderateScale(12),
    },
  });