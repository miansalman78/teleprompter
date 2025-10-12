import { AppColors } from '@/constants/Colors';
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

interface AudioEditorProps {
  onVolumeChange: (volume: number) => void;
  onMuteToggle: (isMuted: boolean) => void;
  onAddMusic: (track: any) => void; // Changed from string to track object
  onAddSoundEffect: (effect: string) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onImportMusic?: () => void;
  onExtractAudio?: () => void;
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
}) => {
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedMusicCategory, setSelectedMusicCategory] = useState('upbeat');
  const [isLoading, setIsLoading] = useState(false);
  const [musicTracks, setMusicTracks] = useState<{[key: string]: any[]}>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [isRecording, setIsRecording] = useState(false);

  // Load real audio tracks from AudioProcessor
  useEffect(() => {
    const loadAudioTracks = async () => {
      setIsLoading(true);
      try {
        const categories = AudioProcessor.getCategories();
        setAvailableCategories(categories);
        
        // Set first available category as default
        if (categories.length > 0) {
          setSelectedMusicCategory(categories[0]);
        }
        
        const tracksByCategory: {[key: string]: any[]} = {};
        for (const category of categories) {
          const tracks = await AudioProcessor.getAudioTracksByCategory(category);
          tracksByCategory[category] = tracks;
        }
        setMusicTracks(tracksByCategory);
      } catch (error) {
        console.error('Error loading audio tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudioTracks();
  }, []);

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
      <Text style={styles.title}>Audio Editor</Text>
      
      <ScrollView style={styles.content}>
        {/* Volume Control */}
        <View style={styles.section}>
          <View style={styles.volumeHeader}>
            <Text style={styles.sectionTitle}>Volume Control....</Text>
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
              thumbStyle={styles.sliderThumb}
              disabled={isMuted}
            />
            <MaterialIcons name="volume-up" size={moderateScale(20)} color="white" />
          </View>
          <Text style={styles.volumeText}>{isMuted ? 'Muted' : `${Math.round(volume)}%`}</Text>
        </View>

        {/* Voice Recording */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Recording</Text>
          
          <TouchableOpacity 
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={handleRecordingToggle}
          >
            <MaterialIcons 
              name={isRecording ? 'stop' : 'mic'} 
              size={moderateScale(24)} 
              color="white" 
            />
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop Recording' : 'Start Voice Recording'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.recordingHint}>
            Record your voice-over directly into the video
          </Text>
        </View>

        {/* Background Music */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Music</Text>
          
          {/* Music Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            {availableCategories.map((category) => (
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
            {isLoading ? (
              <Text style={styles.loadingText}>Loading tracks...</Text>
            ) : (
              musicTracks[selectedMusicCategory]?.map((track, index) => (
                <TouchableOpacity
                  key={track.id || index}
                  style={styles.trackButton}
                  onPress={() => onAddMusic(track)}
                >
                  <MaterialIcons name="music-note" size={moderateScale(20)} color="white" />
                  <Text style={styles.trackText}>{track.name}</Text>
                  <MaterialIcons name="add" size={moderateScale(20)} color={AppColors.primary} />
                </TouchableOpacity>
              )) || <Text style={styles.noTracksText}>No tracks available</Text>
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

        {/* Audio Import */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Audio</Text>
          
          <TouchableOpacity 
            style={styles.importButton}
            onPress={() => onImportMusic?.()}
          >
            <MaterialIcons name="library-music" size={moderateScale(24)} color="white" />
            <Text style={styles.importButtonText}>Import from Device</Text>
            <MaterialIcons name="add" size={moderateScale(20)} color={AppColors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.importButton}
            onPress={() => onExtractAudio?.()}
          >
            <MaterialIcons name="audiotrack" size={moderateScale(24)} color="white" />
            <Text style={styles.importButtonText}>Extract Audio from Video</Text>
            <MaterialIcons name="add" size={moderateScale(20)} color={AppColors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Settings</Text>
          
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
            <MaterialIcons name="mic" size={moderateScale(20)} color="white" />
            <Text style={styles.settingText}>Voice Enhancement</Text>
            <MaterialIcons name="chevron-right" size={moderateScale(20)} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <MaterialIcons name="library-music" size={moderateScale(20)} color="white" />
            <Text style={styles.settingText}>Copyright-Free Library</Text>
            <MaterialIcons name="chevron-right" size={moderateScale(20)} color="rgba(255, 255, 255, 0.5)" />
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
  sliderThumb: {
    backgroundColor: AppColors.primary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(15),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  loadingText: {
    color: 'white',
    fontSize: moderateScale(14),
    textAlign: 'center',
    padding: moderateScale(20),
  },
  noTracksText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(12),
    textAlign: 'center',
    padding: moderateScale(20),
  },
  recordButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
    marginLeft: moderateScale(10),
    flex: 1,
  },
  recordingHint: {
    color: 'rgba(255, 255, 255, 0.7)',
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
    marginBottom: moderateScale(8),
  },
  importButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
    flex: 1,
    marginLeft: moderateScale(10),
  },
});

export default AudioEditor;