import { AppColors } from '@/constants/Colors';
import { AudioProcessor, AudioTrack } from '@/utils/audioProcessor';
import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AudioEditorProps {
  onVolumeChange: (volume: number) => void;
  onMuteToggle: (isMuted: boolean) => void;
  onAddMusic: (musicType: string) => void;
  onAddSoundEffect: (effect: string) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onImportMusic?: () => void;
  onExtractAudio?: () => void;
  onApplyChanges?: () => void;
  onClose?: () => void;
  // Current audio track info
  currentAudioTrack?: {
    name: string;
    type: 'music' | 'effect' | 'voice';
    volume: number;
    isMuted: boolean;
    duration?: number;
  } | null;
}

const AudioEditor: React.FC<AudioEditorProps> = ({
  onVolumeChange,
  onMuteToggle,
  onAddMusic,
  onAddSoundEffect,
  onStartRecording,
  onStopRecording,
  onImportMusic,
  onExtractAudio,
  onApplyChanges,
  onClose,
  currentAudioTrack,
}) => {
  const [volume, setVolume] = useState(currentAudioTrack?.volume || 100);
  const [isMuted, setIsMuted] = useState(currentAudioTrack?.isMuted || false);
  const [selectedMusicCategory, setSelectedMusicCategory] = useState('upbeat');
  const [isRecording, setIsRecording] = useState(false);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // Load audio tracks from AudioProcessor
  useEffect(() => {
    loadAudioTracks();
  }, [selectedMusicCategory]);

  // Sync with currentAudioTrack changes
  useEffect(() => {
    if (currentAudioTrack) {
      setVolume(currentAudioTrack.volume);
      setIsMuted(currentAudioTrack.isMuted);
    }
  }, [currentAudioTrack]);

  const loadAudioTracks = async () => {
    setIsLoadingTracks(true);
    try {
      const tracks = await AudioProcessor.getAudioTracksByCategory(selectedMusicCategory);
      setAudioTracks(tracks);
    } catch (error) {
      console.error('Failed to load audio tracks:', error);
      setAudioTracks([]);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  // Music categories available in AudioProcessor
  const musicCategories = ['upbeat', 'calm', 'dramatic', 'romantic'];

  const soundEffects = [
    { id: 'applause', name: 'Applause', icon: '👏' },
    { id: 'laugh', name: 'Laughter', icon: '😂' },
    { id: 'whoosh', name: 'Whoosh', icon: '💨' },
    { id: 'pop', name: 'Pop', icon: '🎈' },
    { id: 'ding', name: 'Ding', icon: '🔔' },
    { id: 'boom', name: 'Boom', icon: '💥' },
    { id: 'click', name: 'Click', icon: '👆' },
    { id: 'swoosh', name: 'Swoosh', icon: '🌪️' },
  ];

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    onVolumeChange(newVolume);
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    onMuteToggle(newMutedState);
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      onStopRecording?.();
    } else {
      setIsRecording(true);
      onStartRecording?.();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Editor...</Text>
      
      <ScrollView style={styles.content}>
        {/* Volume Control */}
        <View style={styles.section}>
          <View style={styles.volumeHeader}>
            <Text style={styles.sectionTitle}>Volume Control</Text>
            <TouchableOpacity
              style={[styles.muteButton, isMuted && styles.mutedButton]}
              onPress={handleMuteToggle}
            >
              <MaterialIcons 
                name={isMuted ? 'volume-off' : 'volume-up'} 
                size={moderateScale(20)} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.volumeContainer}>
            <MaterialIcons name="volume-down" size={moderateScale(20)} color="white" />
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={100}
              value={volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor={AppColors.primary}
              maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
              thumbTintColor={AppColors.primary}
              disabled={isMuted}
            />
            <MaterialIcons name="volume-up" size={moderateScale(20)} color="white" />
          </View>
          <Text style={styles.volumeText}>{isMuted ? 'Muted' : `${Math.round(volume)}%`}</Text>
        </View>

        {/* Current Audio Track */}
        {currentAudioTrack && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Audio Track</Text>
            <View style={styles.currentTrackContainer}>
              <View style={styles.trackInfo}>
                <MaterialIcons 
                  name={currentAudioTrack.type === 'music' ? 'music-note' : currentAudioTrack.type === 'effect' ? 'graphic-eq' : 'mic'} 
                  size={moderateScale(20)} 
                  color="white" 
                />
                <View style={styles.trackDetails}>
                  <Text style={styles.trackName}>{currentAudioTrack.name}</Text>
                  {currentAudioTrack.duration && (
                    <Text style={styles.trackDuration}>{currentAudioTrack.duration.toFixed(1)}s</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Voice Recording */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Recording</Text>
          
          <TouchableOpacity 
            style={[styles.recordButton, isRecording && styles.recordingButton]} 
            onPress={handleRecordingToggle}
          >
            <MaterialIcons 
              name={isRecording ? 'stop' : 'mic'} 
              size={moderateScale(20)} 
              color="white" 
            />
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop Recording' : 'Start Voice Recording'}
            </Text>
          </TouchableOpacity>
          
          {isRecording && (
            <Text style={styles.recordingHint}>Recording in progress...</Text>
          )}
        </View>

        {/* Background Music */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Music</Text>
          
          {/* Import Music Button */}
          <TouchableOpacity style={styles.importButton} onPress={onImportMusic}>
            <MaterialIcons name="library-music" size={moderateScale(20)} color="white" />
            <Text style={styles.importButtonText}>Import from Device</Text>
            <MaterialIcons name="add" size={moderateScale(20)} color="#259B9A" />
          </TouchableOpacity>
          
          {/* Music Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            {musicCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedMusicCategory === category && styles.selectedCategoryButton
                ]}
                onPress={() => setSelectedMusicCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedMusicCategory === category && styles.selectedCategoryText
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Music Tracks */}
          <View style={styles.tracksContainer}>
            {isLoadingTracks ? (
              <Text style={styles.loadingText}>Loading tracks...</Text>
            ) : (
              audioTracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.trackButton}
                  onPress={() => onAddMusic(track.id)}
                >
                  <MaterialIcons name="music-note" size={moderateScale(20)} color="white" />
                  <Text style={styles.trackText}>{track.name}</Text>
                  <MaterialIcons name="add" size={moderateScale(20)} color={AppColors.primary} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Sound Effects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound Effects</Text>
          <View style={styles.effectsGrid}>
            {soundEffects.map((effect) => (
              <TouchableOpacity
                key={effect.id}
                style={styles.effectButton}
                onPress={() => onAddSoundEffect(effect.id)}
              >
                <Text style={styles.effectIcon}>{effect.icon}</Text>
                <Text style={styles.effectName}>{effect.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Settings</Text>
          
          <TouchableOpacity style={styles.settingButton} onPress={onExtractAudio}>
            <MaterialIcons name="audiotrack" size={moderateScale(20)} color="white" />
            <Text style={styles.settingText}>Extract Audio from Video</Text>
            <MaterialIcons name="chevron-right" size={moderateScale(20)} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingButton}>
            <MaterialIcons name="equalizer" size={moderateScale(20)} color="white" />
            <Text style={styles.settingText}>Equalizer</Text>
            <MaterialIcons name="chevron-right" size={moderateScale(20)} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <MaterialIcons name="tune" size={moderateScale(20)} color="white" />
            <Text style={styles.settingText}>Audio Enhancement</Text>
            <MaterialIcons name="chevron-right" size={moderateScale(20)} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <MaterialIcons name="volume-up" size={moderateScale(20)} color="white" />
            <Text style={styles.settingText}>Voice Enhancement</Text>
            <MaterialIcons name="chevron-right" size={moderateScale(20)} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingButton}>
            <MaterialIcons name="library-music" size={moderateScale(20)} color="white" />
            <Text style={styles.settingText}>Copyright-Free Library</Text>
            <MaterialIcons name="chevron-right" size={moderateScale(20)} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Controls</Text>
          <View style={styles.testButtonsContainer}>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => handleVolumeChange(0)}
            >
              <Text style={styles.testButtonText}>Mute (0%)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => handleVolumeChange(50)}
            >
              <Text style={styles.testButtonText}>50%</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => handleVolumeChange(100)}
            >
              <Text style={styles.testButtonText}>100%</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Done Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.doneButton} 
            onPress={onApplyChanges}
          >
            <MaterialIcons name="check" size={moderateScale(20)} color="white" />
            <Text style={styles.doneButtonText}>Apply Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: moderateScale(20),
  },
  title: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: moderateScale(20),
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: moderateScale(25),
  },
  sectionTitle: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginBottom: moderateScale(10),
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontStyle: 'italic',
    padding: moderateScale(20),
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  muteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(8),
    borderRadius: moderateScale(6),
  },
  mutedButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(5),
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: moderateScale(10),
  },
  volumeText: {
    color: 'white',
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
  categoriesContainer: {
    marginBottom: moderateScale(15),
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(8),
  },
  selectedCategoryButton: {
    backgroundColor: AppColors.primary,
  },
  categoryText: {
    color: 'white',
    fontSize: moderateScale(14),
  },
  selectedCategoryText: {
    fontWeight: '600',
  },
  tracksContainer: {
    gap: moderateScale(8),
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  trackText: {
    color: 'white',
    fontSize: moderateScale(14),
    flex: 1,
    marginLeft: moderateScale(10),
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  effectButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
  },
  effectIcon: {
    fontSize: moderateScale(24),
    marginBottom: moderateScale(4),
  },
  effectName: {
    color: 'white',
    fontSize: moderateScale(10),
    textAlign: 'center',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(15),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  settingText: {
    color: 'white',
    fontSize: moderateScale(14),
    flex: 1,
    marginLeft: moderateScale(10),
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    padding: moderateScale(15),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  recordingButton: {
    backgroundColor: '#ff4444',
  },
  recordButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginLeft: moderateScale(10),
  },
  recordingHint: {
    color: '#ff4444',
    fontSize: moderateScale(12),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(15),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(15),
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderStyle: 'dashed',
  },
  importButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
    flex: 1,
    marginLeft: moderateScale(10),
  },
  // Current Track Styles
  currentTrackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackDetails: {
    marginLeft: moderateScale(12),
    flex: 1,
  },
  trackName: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  trackDuration: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(12),
    marginTop: moderateScale(2),
  },
  // Done Button Styles
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    padding: moderateScale(15),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(10),
  },
  doneButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: moderateScale(8),
  },
  // Test Buttons Styles
  testButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  testButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(12),
    borderRadius: moderateScale(6),
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
});

export default AudioEditor;