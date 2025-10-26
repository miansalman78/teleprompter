import { AppColors } from '@/constants/Colors';
import { moderateScale } from '@/utils/scaling';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import StickerTimeline from '@/components/StickerTimeline';

interface StickerOverlayProps {
  onAddSticker: (sticker: string, size: number, timestamp?: number) => void;
  onAddImage: (imageUri: string, width: number, height: number, timestamp?: number) => void;
  currentTime?: number; // Current video time in seconds
  videoDuration?: number; // Total video duration in seconds
  onTimeChange?: (time: number) => void; // Callback when timeline time changes
}

const StickerOverlay: React.FC<StickerOverlayProps> = ({ 
  onAddSticker, 
  onAddImage, 
  currentTime = 0, 
  videoDuration, // Use the video duration passed from parent component
  onTimeChange = () => {} 
}) => {
  const [selectedSize, setSelectedSize] = useState(40);
  const [selectedImageSize, setSelectedImageSize] = useState(100);
  // Always use the current video time for sticker placement
  const [timeToAddSticker, setTimeToAddSticker] = useState(currentTime);

  // Update timeToAddSticker when currentTime changes
  React.useEffect(() => {
    setTimeToAddSticker(currentTime);
  }, [currentTime]);
  
  // Auto-update timeline with video playback
  React.useEffect(() => {
    // This effect ensures the timeline is always in sync with video playback
    const updateInterval = setInterval(() => {
      if (currentTime !== timeToAddSticker) {
        setTimeToAddSticker(currentTime);
      }
    }, 100); // Update every 100ms for smooth timeline movement
    
    return () => clearInterval(updateInterval);
  }, [currentTime, timeToAddSticker]);
  
  // Ensure videoDuration is passed correctly to StickerTimeline
  const actualVideoDuration = videoDuration || 10; // Use 10 seconds as fallback for better visualization
  
  // Log video duration for debugging
  React.useEffect(() => {
    console.log('StickerOverlay received videoDuration:', videoDuration);
  }, [videoDuration]);

  const handleAddEmoji = (emoji: string) => {
    // Always use the exact current video time for adding stickers
    onAddSticker(emoji, selectedSize, currentTime);
    console.log('Adding sticker at time:', currentTime);
  };

  const handleSizeChange = (size: number) => {
    setSelectedSize(size);
  };

  const handleImageSizeChange = (size: number) => {
    setSelectedImageSize(size);
  };

  const emojiCategories = {
    faces: ['😀', '😂', '🥰', '😍', '🤔', '😎', '🤩', '😭', '😡', '🥺'],
    hands: ['👍', '👎', '👌', '✌️', '🤞', '👏', '🙌', '🤝', '👋', '🤟'],
    hearts: ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💕'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
    objects: ['⭐', '🌟', '💫', '✨', '🔥', '💎', '🎉', '🎊', '🎈', '🎁'],
  };

  const sizes = [20, 30, 40, 50, 60];
  const imageSizes = [50, 75, 100, 125, 150];

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker with optimization settings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Reduced quality for better performance
        exif: false, // Remove EXIF data for smaller file size
        base64: false, // Don't include base64 to save memory
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const { width, height } = result.assets[0];
        
        // Calculate scaled dimensions based on selected size
        const scale = selectedImageSize / Math.max(width, height);
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        
        onAddImage(imageUri, scaledWidth, scaledHeight, currentTime);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle timeline time change
  const handleTimeChange = (time: number) => {
    setTimeToAddSticker(time);
    onTimeChange(time);
  };
  
  // Add sticker at current time directly
  const handleAddStickerAtCurrentTime = (emoji: string) => {
    onAddSticker(emoji, selectedSize, currentTime);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Stickers & Images</Text>
      
      {/* Timeline Section */}
      <View style={styles.timelineContainer}>
         <StickerTimeline 
           videoDuration={actualVideoDuration} // Use actual video duration
           currentTime={timeToAddSticker}
           onTimeChange={handleTimeChange}
           onAddStickerAtTime={() => {}}
           stickers={[]}
         />
         <Text style={styles.timeText}>Add at Time: {timeToAddSticker.toFixed(1)}s</Text>
       </View>
      
      <ScrollView style={styles.content}>
        {/* Image Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Image</Text>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={pickImage}
          >
            <View style={styles.imagePickerContent}>
              <Image
                source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJMMTEgMTRMMTUgMTBMMjEgMTZWMThIM1YxNkw5IDEyWiIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNMyA2SDE5VjE0SDNWNloiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+' }}
                style={styles.imagePickerIcon}
              />
              <Text style={styles.imagePickerText}>Choose from Gallery</Text>
            </View>
          </TouchableOpacity>
          
          {/* Image Size Selection */}
          <Text style={styles.sectionTitle}>Image Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {imageSizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeButton,
                  selectedImageSize === size && styles.selectedSizeButton
                ]}
                onPress={() => setSelectedImageSize(size)}
              >
                <Text style={[
                  styles.sizeButtonText,
                  selectedImageSize === size && styles.selectedSizeButtonText
                ]}>
                  {size}px
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Size Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sticker Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeButton,
                  selectedSize === size && styles.selectedSizeButton
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[
                  styles.sizeButtonText,
                  selectedSize === size && styles.selectedSizeButtonText
                ]}>
                  {size}px
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Emoji Categories */}
        {Object.entries(emojiCategories).map(([category, emojis]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            <View style={styles.emojiGrid}>
              {emojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiButton}
                  onPress={() => onAddSticker(emoji, selectedSize, timeToAddSticker)}
                >
                  <Text style={[styles.emoji, { fontSize: moderateScale(24) }]}>
                    {emoji}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Custom Shapes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shapes</Text>
          <View style={styles.shapesContainer}>
            <TouchableOpacity
              style={styles.shapeButton}
              onPress={() => onAddSticker('●', selectedSize, timeToAddSticker)}
            >
              <View style={[styles.circle, { width: moderateScale(30), height: moderateScale(30) }]} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.shapeButton}
              onPress={() => onAddSticker('■', selectedSize, timeToAddSticker)}
            >
              <View style={[styles.square, { width: moderateScale(30), height: moderateScale(30) }]} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.shapeButton}
              onPress={() => onAddSticker('▲', selectedSize, timeToAddSticker)}
            >
              <View style={styles.triangle} />
            </TouchableOpacity>
          </View>
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
    marginBottom: moderateScale(10),
  },
  timelineContainer: {
    marginBottom: moderateScale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
  },
  timeText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '500',
    marginTop: moderateScale(10),
    textAlign: 'center',
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
  sizeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(8),
  },
  selectedSizeButton: {
    backgroundColor: AppColors.primary,
  },
  sizeButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
  },
  selectedSizeButtonText: {
    fontWeight: '600',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
  },
  emoji: {
    fontSize: moderateScale(24),
  },
  shapesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  shapeButton: {
    width: moderateScale(60),
    height: moderateScale(60),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  circle: {
    backgroundColor: AppColors.primary,
    borderRadius: moderateScale(15),
  },
  square: {
    backgroundColor: AppColors.primary,
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: moderateScale(15),
    borderRightWidth: moderateScale(15),
    borderBottomWidth: moderateScale(25),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: AppColors.primary,
  },
  imagePickerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(10),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  imagePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    marginRight: moderateScale(8),
  },
  imagePickerText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
});

export default StickerOverlay;