import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVolume } from '../contexts/VolumeContext';
import { AudioMixer, AudioMixOptions } from '../utils/audioMixer';
import { MusicTrack } from '../utils/musicLibrary';
import MusicSelector from './MusicSelector';
import MusicTimeline from './MusicTimeline';

interface VolumeControlProps {
  style?: any;
  showLabel?: boolean;
  onAudioAdded?: (audioUri: string, audioName: string) => void;
  onAudioRemoved?: () => void;
  // Voice recording props
  isRecording?: boolean;
  isVoiceLoaded?: boolean;
  voiceVolume?: number;
  isVoiceMuted?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onDeleteVoice?: () => void;
  onVoiceVolumeChange?: (volume: number) => void;
  onVoiceMuteToggle?: () => void;
  // Music timeline props
  videoDuration?: number;
  musicStartTime?: number;
  musicEndTime?: number;
  onMusicStartTimeChange?: (time: number) => void;
  onMusicEndTimeChange?: (time: number) => void;
  // Export method
  onExportWithAudio?: (videoPath: string, outputPath: string) => Promise<string>;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ 
  style, 
  showLabel = false, 
  onAudioAdded, 
  onAudioRemoved,
  isRecording = false,
  isVoiceLoaded = false,
  voiceVolume = 50,
  isVoiceMuted = false,
  onStartRecording,
  onStopRecording,
  onDeleteVoice,
  onVoiceVolumeChange,
  onVoiceMuteToggle,
  videoDuration = 60,
  musicStartTime = 0,
  musicEndTime = 60,
  onMusicStartTimeChange,
  onMusicEndTimeChange,
  onExportWithAudio
}) => {
  const { 
    volume, isMuted, setVolume, toggleMute, getActualVolume,
    audioTrack, audioVolume, isAudioMuted, setAudioVolume, toggleAudioMute, getActualAudioVolume
  } = useVolume();

  // Music selection state
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<MusicTrack | null>(null);
  const [showMusicTimeline, setShowMusicTimeline] = useState(false);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleAudioVolumeChange = (newVolume: number) => {
    setAudioVolume(newVolume);
  };

  const handleAddMusic = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const audioName = asset.name || 'Unknown Audio';
        const audioUri = asset.uri;

        if (onAudioAdded) {
          onAudioAdded(audioUri, audioName);
        }
      }
    } catch (error) {
      console.error('Error picking audio:', error);
      Alert.alert('Error', 'Failed to select audio file');
    }
  };

  const handleSelectRoyaltyFreeMusic = () => {
    setShowMusicSelector(true);
  };

  const handleMusicTrackSelected = (track: MusicTrack) => {
    setSelectedMusicTrack(track);
    setShowMusicTimeline(true);
    setShowMusicSelector(false);
    
    // For royalty-free tracks, use the file path (can be local or online)
    if (track.filePath) {
      // Use the file path (local or online URL)
      if (onAudioAdded) {
        onAudioAdded(track.filePath, track.name);
      }
    } else {
      // No audio available - show message
      Alert.alert(
        'Audio Not Available',
        'This track does not have audio available yet. Please select a different track or import your own audio.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleImportLocalMusic = () => {
    setShowMusicSelector(false);
    handleAddMusic();
  };

  const handleRemoveMusicTrack = () => {
    setSelectedMusicTrack(null);
    setShowMusicTimeline(false);
  };

  const handleMusicStartTimeChange = (time: number) => {
    if (onMusicStartTimeChange) {
      onMusicStartTimeChange(time);
    }
  };

  const handleMusicEndTimeChange = (time: number) => {
    if (onMusicEndTimeChange) {
      onMusicEndTimeChange(time);
    }
  };


  // Expose the export method
  React.useEffect(() => {
    if (onExportWithAudio) {
      onExportWithAudio = handleExportWithAudio;
    }
  }, [onExportWithAudio]);

  /**
   * Mix audio with video for final export (offline processing)
   */
  const handleExportWithAudio = async (
    videoPath: string,
    outputPath: string
  ): Promise<string> => {
    try {
      if (!selectedMusicTrack && !audioTrack) {
        // No audio to mix, just return the original video
        return videoPath;
      }

      // For royalty-free tracks, use the file path (local or online) for audio mixing
      if (selectedMusicTrack && !audioTrack) {
        console.log('Royalty-free track selected:', selectedMusicTrack.name);
        
        // Use the track's file path (can be local or online URL)
        const audioPath = selectedMusicTrack.filePath;
        if (!audioPath) {
          return videoPath;
        }

        const mixOptions: AudioMixOptions = {
          videoPath,
          audioPath,
          outputPath,
          audioStartTime: musicStartTime,
          audioEndTime: musicEndTime,
          audioVolume: audioVolume,
          muteOriginalAudio: false,
          videoVolume: volume,
        };

        const resultPath = await AudioMixer.mixAudioWithVideo(mixOptions);
        return resultPath;
      }

      const audioPath = audioTrack?.uri;
      if (!audioPath) {
        return videoPath;
      }

      const mixOptions: AudioMixOptions = {
        videoPath,
        audioPath,
        outputPath,
        audioStartTime: musicStartTime,
        audioEndTime: musicEndTime,
        audioVolume: audioVolume,
        muteOriginalAudio: false, // Always keep original audio
        videoVolume: volume,
      };

      const resultPath = await AudioMixer.mixAudioWithVideo(mixOptions);
      return resultPath;
    } catch (error) {
      console.error('Error mixing audio for export:', error);
      Alert.alert('Export Error', 'Failed to mix audio with video. Please try again.');
      throw error;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text style={styles.label}>Audio Controls</Text>
      )}
      
      {/* Video Volume Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Video Volume</Text>
        <View style={styles.volumeContainer}>
          <TouchableOpacity
            style={[styles.muteButton, isMuted && styles.mutedButton]}
            onPress={toggleMute}
          >
            <MaterialIcons 
              name={isMuted ? 'volume-off' : 'volume-up'} 
              size={moderateScale(20)} 
              color="white" 
            />
          </TouchableOpacity>
          
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={100}
            value={volume}
            onValueChange={handleVolumeChange}
            minimumTrackTintColor="#259B9A"
            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
            thumbTintColor="#259B9A"
            disabled={isMuted}
          />
          
          <Text style={styles.volumeText}>
            {isMuted ? 'Muted' : `${Math.round(volume)}%`}
          </Text>
        </View>
        
      </View>

      {/* Audio Track Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Music</Text>
        
        {!audioTrack && !selectedMusicTrack ? (
          <View style={styles.musicOptionsContainer}>
            <TouchableOpacity style={styles.addMusicButton} onPress={handleSelectRoyaltyFreeMusic}>
              <MaterialIcons name="library-music" size={moderateScale(20)} color="white" />
              <Text style={styles.addMusicText}>Select Royalty-Free Music</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.addMusicButton} onPress={handleAddMusic}>
              <MaterialIcons name="upload" size={moderateScale(20)} color="white" />
              <Text style={styles.addMusicText}>Import from Device</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.audioTrackInfo}>
              <MaterialIcons name="music-note" size={moderateScale(16)} color="#259B9A" />
              <Text style={styles.audioTrackName} numberOfLines={1}>
                {audioTrack?.name || selectedMusicTrack?.name || 'Unknown Track'}
              </Text>
              {selectedMusicTrack && (
                <View style={styles.musicTrackBadge}>
                  <Text style={styles.musicTrackBadgeText}>Royalty-Free</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={selectedMusicTrack ? handleRemoveMusicTrack : onAudioRemoved}
              >
                <MaterialIcons name="close" size={moderateScale(16)} color="white" />
              </TouchableOpacity>
            </View>
            
            {selectedMusicTrack && (
              <View style={styles.musicNoteContainer}>
                <Text style={styles.musicNoteText}>
                  🎵 Royalty-free track selected! Audio will be streamed from online source during export.
                </Text>
              </View>
            )}
            
            <View style={styles.volumeContainer}>
              <TouchableOpacity
                style={[styles.muteButton, isAudioMuted && styles.mutedButton]}
                onPress={toggleAudioMute}
              >
                <MaterialIcons 
                  name={isAudioMuted ? 'volume-off' : 'volume-up'} 
                  size={moderateScale(20)} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={100}
                value={audioVolume}
                onValueChange={handleAudioVolumeChange}
                minimumTrackTintColor="#259B9A"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="#259B9A"
                disabled={isAudioMuted}
              />
              
              <Text style={styles.volumeText}>
                {isAudioMuted ? 'Muted' : `${Math.round(audioVolume)}%`}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Voice Recording Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Recording</Text>
        
        {!isVoiceLoaded && !isRecording ? (
          <TouchableOpacity 
            style={styles.recordButton} 
            onPress={onStartRecording}
          >
            <MaterialIcons name="mic" size={moderateScale(20)} color="white" />
            <Text style={styles.recordButtonText}>Start Recording</Text>
          </TouchableOpacity>
        ) : isRecording ? (
          <TouchableOpacity 
            style={[styles.recordButton, styles.recordingButton]} 
            onPress={onStopRecording}
          >
            <MaterialIcons name="stop" size={moderateScale(20)} color="white" />
            <Text style={styles.recordButtonText}>Stop Recording</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.voiceTrackInfo}>
              <MaterialIcons name="mic" size={moderateScale(16)} color="#259B9A" />
              <Text style={styles.voiceTrackName} numberOfLines={1}>
                Voice Recording
              </Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={onDeleteVoice}
              >
                <MaterialIcons name="close" size={moderateScale(16)} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.volumeContainer}>
              <TouchableOpacity
                style={[styles.muteButton, isVoiceMuted && styles.mutedButton]}
                onPress={onVoiceMuteToggle}
              >
                <MaterialIcons 
                  name={isVoiceMuted ? 'volume-off' : 'volume-up'} 
                  size={moderateScale(20)} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={100}
                value={voiceVolume}
                onValueChange={onVoiceVolumeChange}
                minimumTrackTintColor="#259B9A"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="#259B9A"
                disabled={isVoiceMuted}
              />
              
              <Text style={styles.volumeText}>
                {isVoiceMuted ? 'Muted' : `${Math.round(voiceVolume)}%`}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Music Timeline */}
      {showMusicTimeline && selectedMusicTrack && (
        <MusicTimeline
          selectedTrack={selectedMusicTrack}
          videoDuration={videoDuration}
          musicStartTime={musicStartTime}
          musicEndTime={musicEndTime}
          onStartTimeChange={handleMusicStartTimeChange}
          onEndTimeChange={handleMusicEndTimeChange}
          onRemoveTrack={handleRemoveMusicTrack}
        />
      )}

      {/* Music Selector Modal */}
      <MusicSelector
        isVisible={showMusicSelector}
        onClose={() => setShowMusicSelector(false)}
        onSelectTrack={handleMusicTrackSelected}
        onImportLocal={handleImportLocalMusic}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: moderateScale(15),
    borderRadius: moderateScale(8),
    margin: moderateScale(10),
  },
  label: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: moderateScale(15),
    textAlign: 'center',
  },
  section: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginBottom: moderateScale(10),
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(8),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(10),
  },
  mutedButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: moderateScale(10),
  },
  volumeText: {
    color: 'white',
    fontSize: moderateScale(12),
    minWidth: moderateScale(50),
    textAlign: 'center',
  },
  addMusicButton: {
    backgroundColor: 'rgba(37, 155, 154, 0.2)',
    borderColor: '#259B9A',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMusicText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginLeft: moderateScale(8),
  },
  audioTrackInfo: {
    backgroundColor: 'rgba(37, 155, 154, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  audioTrackName: {
    color: 'white',
    fontSize: moderateScale(12),
    flex: 1,
    marginLeft: moderateScale(8),
  },
  removeButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
  },
  musicTrackBadge: {
    backgroundColor: 'rgba(37, 155, 154, 0.2)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
    marginLeft: moderateScale(8),
  },
  musicTrackBadgeText: {
    color: '#259B9A',
    fontSize: moderateScale(10),
    fontWeight: '500',
  },
  musicNoteContainer: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderColor: '#28a745',
    borderWidth: 1,
    borderRadius: moderateScale(6),
    padding: moderateScale(8),
    marginBottom: moderateScale(10),
  },
  musicNoteText: {
    color: '#28a745',
    fontSize: moderateScale(11),
    textAlign: 'center',
  },
  // Voice Recording Styles
  recordButton: {
    backgroundColor: 'rgba(37, 155, 154, 0.2)',
    borderColor: '#259B9A',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderColor: '#ff4444',
  },
  recordButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginLeft: moderateScale(8),
  },
  voiceTrackInfo: {
    backgroundColor: 'rgba(37, 155, 154, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  voiceTrackName: {
    color: 'white',
    fontSize: moderateScale(12),
    flex: 1,
    marginLeft: moderateScale(8),
  },
  // New styles for music features
  musicOptionsContainer: {
    gap: moderateScale(10),
  },
});

export default VolumeControl;

