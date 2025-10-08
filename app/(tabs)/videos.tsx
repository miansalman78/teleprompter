import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AppColors } from '../../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoItem {
  id: string;
  uri: string;
  mode: string;
  createdAt: string;
  flaggedForUpload: boolean;
  uploaded: boolean;
  title?: string;
  duration?: string;
}

const MyVideosScreen = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    try {
      const savedVideos = await AsyncStorage.getItem('saved_videos');
      if (savedVideos) {
        const parsedVideos = JSON.parse(savedVideos);
        // Check if videos exist on filesystem
        const validVideos = [];
        for (const video of parsedVideos) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(video.uri);
            if (fileInfo.exists) {
              validVideos.push(video);
            }
          } catch (error) {
            console.log('Video file not found:', video.uri);
          }
        }
        setVideos(validVideos);
        // Update AsyncStorage with valid videos only
        if (validVideos.length !== parsedVideos.length) {
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
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedVideos = videos.filter(video => video.id !== videoId);
            setVideos(updatedVideos);
            await AsyncStorage.setItem('saved_videos', JSON.stringify(updatedVideos));
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

    const getModeDisplayName = (mode: string) => {
      return mode === '1min' ? '1-Minute Pitch' : '3-Minute Presentation';
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
            {item.mode === '1min' ? 'Up to 1:00' : 'Up to 3:00'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => handlePlayVideo(item)}
        >
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const filteredVideos = videos.filter(video =>
    (video.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

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
        <Text style={styles.headerTitle}>My Videos</Text>
        <View style={styles.headerLine} />
      </View>

      <View style={styles.content}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.searchPlaceholder}>Search here...</Text>
        </View>
        
        {/* Filter Button */}
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="tune" size={20} color={AppColors.white} />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
        
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
            contentContainerStyle={styles.videosList}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerLine: {
    width: SCREEN_WIDTH * 0.8,
    height: 1,
    backgroundColor: '#259B9A',
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.white,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchContainer: {
    backgroundColor: AppColors.primary,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchPlaceholder: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginLeft: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterText: {
    color: AppColors.white,
    fontSize: 16,
    marginLeft: 8,
  },
  videosList: {
    paddingBottom: 20,
  },
  videoCard: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  videoInfo: {
    flex: 1,
    paddingRight: 10,
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  videoTitle: {
    color: AppColors.white,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 5,
  },
  videoMeta: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 3,
  },
  videoDuration: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  playButtonText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: AppColors.white,
    fontSize: 18,
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: AppColors.white,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default MyVideosScreen;