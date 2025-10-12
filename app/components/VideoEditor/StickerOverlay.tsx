import { AppColors } from '@/constants/Colors';
import { moderateScale } from '@/utils/scaling';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface StickerOverlayProps {
  onAddSticker: (sticker: string, size: number) => void;
}

const StickerOverlay: React.FC<StickerOverlayProps> = ({ onAddSticker }) => {
  const [selectedSize, setSelectedSize] = useState(40);

  const emojiCategories = {
    faces: ['😀', '😂', '🥰', '😍', '🤔', '😎', '🤩', '😭', '😡', '🥺'],
    hands: ['👍', '👎', '👌', '✌️', '🤞', '👏', '🙌', '🤝', '👋', '🤟'],
    hearts: ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💕'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
    objects: ['⭐', '🌟', '💫', '✨', '🔥', '💎', '🎉', '🎊', '🎈', '🎁'],
  };

  const sizes = [20, 30, 40, 50, 60];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Stickers</Text>
      
      <ScrollView style={styles.content}>
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
                  onPress={() => onAddSticker(emoji, selectedSize)}
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
              onPress={() => onAddSticker('●', selectedSize)}
            >
              <View style={[styles.circle, { width: moderateScale(30), height: moderateScale(30) }]} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.shapeButton}
              onPress={() => onAddSticker('■', selectedSize)}
            >
              <View style={[styles.square, { width: moderateScale(30), height: moderateScale(30) }]} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.shapeButton}
              onPress={() => onAddSticker('▲', selectedSize)}
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
});

export default StickerOverlay;