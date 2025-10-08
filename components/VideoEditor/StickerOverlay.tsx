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
  onAddSticker: (sticker: string, size: number, type: 'static' | 'animated') => void;
}

const StickerOverlay: React.FC<StickerOverlayProps> = ({ onAddSticker }) => {
  const [selectedSize, setSelectedSize] = useState(40);
  const [selectedType, setSelectedType] = useState<'static' | 'animated'>('static');

  const emojiCategories = {
    faces: ['😀', '😂', '🥰', '😍', '🤔', '😎', '🤩', '😭', '😡', '🥺'],
    hands: ['👍', '👎', '👌', '✌️', '🤞', '👏', '🙌', '🤝', '👋', '🤟'],
    hearts: ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💕'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
    objects: ['⭐', '🌟', '💫', '✨', '🔥', '💎', '🎉', '🎊', '🎈', '🎁'],
  };

  const animatedStickers = {
    effects: ['✨', '💫', '🌟', '⭐', '🔥', '💥', '💢', '💨', '💦', '💧'],
    celebrations: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎯', '🎪', '🎭', '🎨'],
    nature: ['🌈', '⚡', '🌪️', '🌊', '🌸', '🌺', '🌻', '🌷', '🌹', '🌼'],
    symbols: ['💖', '💝', '💘', '💕', '💓', '💗', '💞', '💟', '❣️', '💌'],
  };

  const sizes = [20, 30, 40, 50, 60];

  const handleStickerPress = (sticker: string) => {
    onAddSticker(sticker, selectedSize, selectedType);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Stickers</Text>
      
      <ScrollView style={styles.content}>
        {/* Sticker Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sticker Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'static' && styles.selectedTypeButton
              ]}
              onPress={() => setSelectedType('static')}
            >
              <Text style={[
                styles.typeButtonText,
                selectedType === 'static' && styles.selectedTypeButtonText
              ]}>
                Static
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'animated' && styles.selectedTypeButton
              ]}
              onPress={() => setSelectedType('animated')}
            >
              <Text style={[
                styles.typeButtonText,
                selectedType === 'animated' && styles.selectedTypeButtonText
              ]}>
                Animated
              </Text>
            </TouchableOpacity>
          </View>
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

        {/* Sticker Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedType === 'static' ? 'Static Stickers' : 'Animated Stickers'}
          </Text>
          {selectedType === 'static' ? (
            Object.entries(emojiCategories).map(([category, emojis]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <View style={styles.emojiGrid}>
                  {emojis.map((emoji, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.emojiButton}
                      onPress={() => handleStickerPress(emoji)}
                    >
                      <Text style={[styles.emoji, { fontSize: selectedSize }]}>
                        {emoji}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          ) : (
            Object.entries(animatedStickers).map(([category, stickers]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <View style={styles.emojiGrid}>
                  {stickers.map((sticker, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.emojiButton, styles.animatedStickerButton]}
                      onPress={() => handleStickerPress(sticker)}
                    >
                      <Text style={[styles.emoji, { fontSize: selectedSize }]}>
                        {sticker}
                      </Text>
                      <Text style={styles.animatedLabel}>✨</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

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
  typeContainer: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  typeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: 'rgba(37, 155, 154, 0.2)',
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  typeButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: moderateScale(20),
  },
  categoryTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginBottom: moderateScale(10),
  },
  animatedStickerButton: {
    position: 'relative',
  },
  animatedLabel: {
    position: 'absolute',
    top: moderateScale(2),
    right: moderateScale(2),
    fontSize: moderateScale(8),
  },
});

export default StickerOverlay;