import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getMusicByCategory, getMusicCategories, MusicTrack, ROYALTY_FREE_MUSIC } from '../utils/musicLibrary';

interface MusicSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectTrack: (track: MusicTrack) => void;
  onImportLocal: () => void;
}

const MusicSelector: React.FC<MusicSelectorProps> = ({
  isVisible,
  onClose,
  onSelectTrack,
  onImportLocal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);

  const categories = getMusicCategories().map(category => ({
    key: category,
    label: category
  }));

  const handleTrackSelect = (track: MusicTrack) => {
    setSelectedTrack(track);
  };

  const handleConfirmSelection = () => {
    if (selectedTrack) {
      onSelectTrack(selectedTrack);
      onClose();
    } else {
      Alert.alert('No Track Selected', 'Please select a music track first.');
    }
  };

  const handleImportLocal = () => {
    onImportLocal();
    onClose();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTracks = getMusicByCategory(selectedCategory);
  
  // Debug logging
  console.log('MusicSelector Debug:', {
    selectedCategory,
    totalTracks: ROYALTY_FREE_MUSIC.length,
    filteredTracks: filteredTracks.length,
    categories: getMusicCategories()
  });

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Music</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={moderateScale(24)} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            🎵 Royalty-free tracks available! Audio will be streamed from online sources. 
            Select any track to add background music to your video.
          </Text>
        </View>

        <View style={styles.categorySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.categoryButtonSelected,
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.key && styles.categoryButtonTextSelected,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.tracksList} showsVerticalScrollIndicator={false}>
          {filteredTracks.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="music-off" size={moderateScale(48)} color="#666" />
              <Text style={styles.emptyStateText}>No music tracks found</Text>
              <Text style={styles.emptyStateSubtext}>Try selecting a different category</Text>
            </View>
          ) : (
            filteredTracks.map((track) => (
            <TouchableOpacity
              key={track.id}
              style={[
                styles.trackItem,
                selectedTrack?.id === track.id && styles.trackItemSelected,
              ]}
              onPress={() => handleTrackSelect(track)}
            >
              <View style={styles.trackInfo}>
                <View style={styles.trackHeader}>
                  <MaterialIcons name="music-note" size={moderateScale(20)} color="#259B9A" />
                  <Text style={styles.trackName}>{track.name}</Text>
                  <Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>
                </View>
                <Text style={styles.trackArtist}>by {track.artist}</Text>
                <View style={styles.trackMeta}>
                  <Text style={styles.trackLicense}>License: {track.license}</Text>
                  <Text style={styles.trackAttribution}>{track.attribution}</Text>
                </View>
              </View>
              {selectedTrack?.id === track.id && (
                <MaterialIcons name="check-circle" size={moderateScale(24)} color="#259B9A" />
              )}
            </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.importButton} onPress={handleImportLocal}>
            <MaterialIcons name="upload" size={moderateScale(20)} color="white" />
            <Text style={styles.importButtonText}>Import from Device</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !selectedTrack && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmSelection}
            disabled={!selectedTrack}
          >
            <Text style={styles.confirmButtonText}>Select Track</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: 'white',
    fontSize: moderateScale(20),
    fontWeight: 'bold',
  },
  closeButton: {
    padding: moderateScale(5),
  },
  categorySelector: {
    padding: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(10),
  },
  categoryButtonSelected: {
    backgroundColor: '#259B9A',
  },
  categoryButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderColor: '#28a745',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    margin: moderateScale(15),
  },
  infoText: {
    color: '#28a745',
    fontSize: moderateScale(12),
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  tracksList: {
    flex: 1,
    padding: moderateScale(15),
  },
  trackItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(8),
    padding: moderateScale(15),
    marginBottom: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  trackItemSelected: {
    borderColor: '#259B9A',
    backgroundColor: 'rgba(37, 155, 154, 0.1)',
  },
  trackInfo: {
    flex: 1,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(5),
  },
  trackName: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: moderateScale(8),
    flex: 1,
  },
  trackDuration: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(12),
  },
  trackArtist: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(14),
    marginBottom: moderateScale(5),
  },
  trackMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackLicense: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(12),
  },
  trackAttribution: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: moderateScale(12),
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    padding: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  importButton: {
    backgroundColor: 'rgba(37, 155, 154, 0.2)',
    borderColor: '#259B9A',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    padding: moderateScale(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(15),
  },
  importButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '500',
    marginLeft: moderateScale(8),
  },
  confirmButton: {
    backgroundColor: '#259B9A',
    borderRadius: moderateScale(8),
    padding: moderateScale(15),
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyStateText: {
    color: '#666',
    fontSize: moderateScale(16),
    fontWeight: '500',
    marginTop: moderateScale(12),
  },
  emptyStateSubtext: {
    color: '#999',
    fontSize: moderateScale(14),
    marginTop: moderateScale(4),
  },
});

export default MusicSelector;
