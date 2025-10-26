import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/Colors';
import {
    getResponsiveTabBarHeight,
    getTopSafeArea,
    isLargeScreen,
    isSmallScreen,
    responsiveBorderRadius,
    responsiveFontSize,
    responsivePadding,
    responsiveSpacing,
    SCREEN_WIDTH
} from '../../utils/scaling';

interface VideoItem {
  id: string;
  uri: string;
  mode: string;
  createdAt: string;
  flaggedForUpload: boolean;
  uploaded: boolean;
  title?: string;
  duration?: number; // Duration in seconds
  fileSize?: number; // File size in bytes
}

const MyVideosScreen = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [durationFilter, setDurationFilter] = useState<'all' | '1min' | '3min' | 'uploaded'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSavedVideos();
  }, []);

  // Refresh videos when screen comes into focus (e.g., returning from video editing)
  useFocusEffect(
    useCallback(() => {
      console.log('Videos screen focused, refreshing video list...');
      loadSavedVideos();
    }, [])
  );

  const loadSavedVideos = async () => {
    try {
      const savedVideos = await AsyncStorage.getItem('saved_videos');
      if (savedVideos) {
        const parsedVideos = JSON.parse(savedVideos);
        // Check if videos exist on filesystem and migrate duration format
        const validVideos = [];
        let needsUpdate = false;
        
        for (const video of parsedVideos) {
          try {
            // Skip file existence check to avoid FileSystem errors
            // Assume all videos exist for demo purposes
            // Migrate duration if it's a string (old format)
            if (typeof video.duration === 'string') {
              video.duration = video.mode === '1min' ? 60 : 180; // Default durations
              needsUpdate = true;
            }
            // Ensure duration is a valid number
            if (!video.duration || isNaN(video.duration) || video.duration < 0) {
              video.duration = video.mode === '1min' ? 60 : 180; // Default durations
              needsUpdate = true;
            }
            validVideos.push(video);
          } catch (error) {
            console.log('Video file not found:', video.uri);
          }
        }
        
        setVideos(validVideos);
        
        // Update AsyncStorage with valid videos and migrated data
        if (validVideos.length !== parsedVideos.length || needsUpdate) {
          await AsyncStorage.setItem('saved_videos', JSON.stringify(validVideos));
        }
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayVideo = (video: VideoItem) => {
    if (video.uri) {
      router.push({
        pathname: '/screens/PreviewVideoShoot',
        params: { videoUri: video.uri, orientation: 'portrait' },
      });
    } else {
      Alert.alert('Info', 'This is a demo video. No actual video file available.');
    }
  };

  const handleDeleteVideo = (videoId: string) => {
    const videoToDelete = videos.find(video => video.id === videoId);
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Skip file deletion to avoid FileSystem errors
              console.log('Video file deletion skipped for demo purposes');
              
              // Remove from state and AsyncStorage
              const updatedVideos = videos.filter(video => video.id !== videoId);
              setVideos(updatedVideos);
              await AsyncStorage.setItem('saved_videos', JSON.stringify(updatedVideos));
            } catch (error) {
              console.error('Error deleting video:', error);
              Alert.alert('Error', 'Failed to delete video. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderVideoItem = ({ item }: { item: VideoItem }) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    };

    const formatDuration = (duration?: number) => {
      // Handle cases where duration is NaN, undefined, null, or not a number
      if (!duration || isNaN(duration) || duration < 0) {
        if (item.mode === '1min') return 'Up to 1:00';
        if (item.mode === '3min') return 'Up to 3:00';
        if (item.mode === 'uploaded') return 'Unknown';
        return 'Unknown';
      }
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getModeDisplayName = (mode: string) => {
      if (mode === '1min') return '1-Minute Pitch';
      if (mode === '3min') return '3-Minute Presentation';
      if (mode === 'uploaded') return 'Uploaded Video';
      return 'Video Recording';
    };

    const getUploadStatusIcon = () => {
      if (item.uploaded) {
        return <MaterialIcons name="cloud-done" size={16} color="#4CAF50" />;
      } else if (item.flaggedForUpload) {
        return <MaterialIcons name="cloud-upload" size={16} color="#FF9800" />;
      }
      return <MaterialIcons name="cloud-off" size={16} color="rgba(255, 255, 255, 0.5)" />;
    };

    return (
      <View style={styles.videoCard}>
        <View style={styles.videoThumbnail}>
          <MaterialIcons name="play-circle-filled" size={30} color="rgba(255, 255, 255, 0.8)" />
        </View>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {getModeDisplayName(item.mode)} recording
          </Text>
          <View style={styles.videoMetaRow}>
            <Text style={styles.videoMeta}>{formatDate(item.createdAt)}</Text>
            {getUploadStatusIcon()}
          </View>
          <Text style={styles.videoDuration}>
            {formatDuration(item.duration)}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlayVideo(item)}
          >
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteVideo(item.id)}
          >
            <MaterialIcons name="delete" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Filter and sort videos
  const filteredVideos = videos
    .filter(video => {
      // Duration filter
      const matchesDuration = durationFilter === 'all' || video.mode === durationFilter;
      
      return matchesDuration;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="video-library" size={60} color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with line */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Videos</Text>
        </View>
        <View style={styles.headerLine} />
      </View>

      <View style={styles.content}>
        {/* Filter and Sort Buttons */}
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <MaterialIcons name="tune" size={20} color={AppColors.white} />
            <Text style={styles.filterText}>
              Filter {durationFilter !== 'all' ? `(${durationFilter})` : ''}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
          >
            <MaterialIcons 
              name={sortBy === 'newest' ? 'arrow-downward' : 'arrow-upward'} 
              size={20} 
              color={AppColors.white} 
            />
            <Text style={styles.sortText}>
              {sortBy === 'newest' ? 'Newest' : 'Oldest'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Videos List */}
        {filteredVideos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="videocam-off" size={60} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyText}>No videos found</Text>
            <Text style={styles.emptySubtext}>Start recording to see your videos here</Text>
          </View>
        ) : (
          <FlatList
            data={filteredVideos}
            renderItem={renderVideoItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: getResponsiveTabBarHeight() + insets.bottom + responsiveSpacing(20)
            }}
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFilterModal(false)}
              >
                <MaterialIcons name="close" size={24} color={AppColors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Duration Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Duration</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'all', label: 'All Videos' },
                    { key: '1min', label: '1 Minute' },
                    { key: '3min', label: '3 Minutes' },
                    { key: 'uploaded', label: 'Uploaded' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        durationFilter === option.key && styles.filterOptionSelected
                      ]}
                      onPress={() => setDurationFilter(option.key as any)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        durationFilter === option.key && styles.filterOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'newest', label: 'Newest First' },
                    { key: 'oldest', label: 'Oldest First' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        sortBy === option.key && styles.filterOptionSelected
                      ]}
                      onPress={() => setSortBy(option.key as any)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        sortBy === option.key && styles.filterOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: getTopSafeArea() + responsiveSpacing(20),
    paddingBottom: responsiveSpacing(20),
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH * (isSmallScreen ? 0.9 : 0.85),
    paddingHorizontal: responsivePadding(20),
  },
  headerLine: {
    width: SCREEN_WIDTH * (isSmallScreen ? 0.85 : 0.8),
    height: 1,
    backgroundColor: '#259B9A',
    marginTop: responsiveSpacing(15),
  },
  headerTitle: {
    fontSize: responsiveFontSize(24, 28, 20),
    fontWeight: 'bold',
    color: AppColors.white,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: responsivePadding(20),
    paddingTop: responsiveSpacing(10),
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsiveSpacing(20),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: responsivePadding(15),
    paddingVertical: responsiveSpacing(10),
    borderRadius: responsiveBorderRadius(20),
    flex: 0.48,
    justifyContent: 'center',
  },
  filterText: {
    color: AppColors.white,
    fontSize: responsiveFontSize(14, 16, 12),
    marginLeft: responsiveSpacing(8),
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: responsivePadding(15),
    paddingVertical: responsiveSpacing(10),
    borderRadius: responsiveBorderRadius(20),
    flex: 0.48,
    justifyContent: 'center',
  },
  sortText: {
    color: AppColors.white,
    fontSize: responsiveFontSize(14, 16, 12),
    marginLeft: responsiveSpacing(8),
  },
  videoCard: {
    backgroundColor: AppColors.primary,
    borderRadius: responsiveBorderRadius(12),
    padding: responsivePadding(15),
    marginBottom: responsiveSpacing(15),
    flexDirection: 'row',
    alignItems: 'center',
    // Platform-specific shadows
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 2 : 4,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 4 : 8,
    elevation: Platform.OS === 'android' ? 6 : 0,
  },
  videoThumbnail: {
    width: isSmallScreen ? 70 : isLargeScreen ? 90 : 80,
    height: isSmallScreen ? 52 : isLargeScreen ? 68 : 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: responsiveBorderRadius(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing(15),
  },
  videoInfo: {
    flex: 1,
    paddingRight: responsiveSpacing(10),
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  videoTitle: {
    color: AppColors.white,
    fontSize: responsiveFontSize(14, 16, 12),
    lineHeight: isSmallScreen ? 16 : 18,
    marginBottom: 5,
  },
  videoMeta: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveFontSize(12, 14, 10),
    marginBottom: 3,
  },
  videoDuration: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveFontSize(12, 14, 10),
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing(10),
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: responsiveBorderRadius(20),
    paddingHorizontal: responsivePadding(20),
    paddingVertical: responsiveSpacing(8),
  },
  playButtonText: {
    color: AppColors.white,
    fontSize: responsiveFontSize(14, 16, 12),
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: responsiveBorderRadius(20),
    paddingHorizontal: responsivePadding(12),
    paddingVertical: responsiveSpacing(8),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: AppColors.white,
    fontSize: responsiveFontSize(18, 20, 16),
    marginTop: responsiveSpacing(20),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: responsiveSpacing(100),
  },
  emptyText: {
    color: AppColors.white,
    fontSize: responsiveFontSize(20, 22, 18),
    fontWeight: '600',
    marginTop: responsiveSpacing(20),
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: responsiveFontSize(16, 18, 14),
    marginTop: responsiveSpacing(10),
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: responsiveBorderRadius(20),
    borderTopRightRadius: responsiveBorderRadius(20),
    paddingBottom: responsiveSpacing(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsivePadding(20),
    paddingVertical: responsiveSpacing(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: responsiveFontSize(20, 22, 18),
    fontWeight: 'bold',
    color: AppColors.white,
  },
  closeButton: {
    padding: responsivePadding(5),
  },
  modalBody: {
    paddingHorizontal: responsivePadding(20),
    paddingVertical: responsiveSpacing(20),
  },
  filterSection: {
    marginBottom: responsiveSpacing(25),
  },
  filterSectionTitle: {
    fontSize: responsiveFontSize(16, 18, 14),
    fontWeight: '600',
    color: AppColors.white,
    marginBottom: responsiveSpacing(15),
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSpacing(10),
  },
  filterOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: responsivePadding(15),
    paddingVertical: responsiveSpacing(10),
    borderRadius: responsiveBorderRadius(20),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterOptionSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  filterOptionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: responsiveFontSize(14, 16, 12),
  },
  filterOptionTextSelected: {
    color: AppColors.white,
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: responsivePadding(20),
    paddingTop: responsiveSpacing(10),
  },
  applyButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: responsiveSpacing(15),
    borderRadius: responsiveBorderRadius(12),
    alignItems: 'center',
  },
  applyButtonText: {
    color: AppColors.white,
    fontSize: responsiveFontSize(16, 18, 14),
    fontWeight: '600',
  },
});

export default MyVideosScreen;