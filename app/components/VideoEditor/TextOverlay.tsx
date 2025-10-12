import { AppColors } from '@/constants/Colors';
import { moderateScale } from '@/utils/scaling';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface TextOverlayProps {
  onAddText: (text: string, style: any) => void;
  onAddTemplate?: (template: string) => void;
}

const TextOverlay: React.FC<TextOverlayProps> = ({ 
  onAddText, 
  onAddTemplate
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedFont, setSelectedFont] = useState('normal');
  const [selectedSize, setSelectedSize] = useState(18);
  const [selectedAlignment, setSelectedAlignment] = useState('center');
  const [selectedAnimation, setSelectedAnimation] = useState<'fade' | 'slide' | 'bounce' | 'zoom' | 'rotate' | 'scale-in' | 'none'>('fade');

  const colors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];
  const fonts = ['normal', 'bold', 'italic'];
  const sizes = [12, 14, 16, 18, 20, 24, 28, 32];
  const alignments = ['left', 'center', 'right'];
  
  const animations = [
    { name: 'fade', icon: 'blur-on', label: 'Fade' },
    { name: 'slide', icon: 'arrow-forward', label: 'Slide' },
    { name: 'bounce', icon: 'sports-basketball', label: 'Bounce' },
    { name: 'zoom', icon: 'zoom-in', label: 'Zoom' },
    { name: 'rotate', icon: 'rotate-right', label: 'Rotate' },
    { name: 'scale-in', icon: 'open-in-full', label: 'Scale' },
    { name: 'none', icon: 'block', label: 'None' },
  ];
  
  const textTemplates = [
    'Breaking News',
    'Subscribe Now!',
    'Like & Share',
    'Coming Soon',
    'New Video',
    'Thank You!'
  ];

  const handleAddText = () => {
    if (inputText.trim()) {
      onAddText(inputText, {
        color: selectedColor,
        fontWeight: selectedFont === 'bold' ? 'bold' : 'normal',
        fontStyle: selectedFont === 'italic' ? 'italic' : 'normal',
        fontSize: selectedSize,
        textAlign: selectedAlignment,
        animation: selectedAnimation,
      });
      setInputText('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Text</Text>
      
      <ScrollView style={styles.content}>
        {/* Text Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {textTemplates.map((template) => (
              <TouchableOpacity
                key={template}
                style={styles.templateButton}
                onPress={() => {
                  setInputText(template);
                  onAddTemplate?.(template);
                }}
              >
                <Text style={styles.templateText}>{template}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Text Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Text</Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your text here..."
            placeholderTextColor="#666"
            multiline
          />
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColorButton
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Font Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {fonts.map((font) => (
              <TouchableOpacity
                key={font}
                style={[
                  styles.fontButton,
                  selectedFont === font && styles.selectedFontButton
                ]}
                onPress={() => setSelectedFont(font)}
              >
                <Text style={[
                  styles.fontButtonText,
                  selectedFont === font && styles.selectedFontButtonText,
                  font === 'bold' && { fontWeight: 'bold' },
                  font === 'italic' && { fontStyle: 'italic' }
                ]}>
                  {font.charAt(0).toUpperCase() + font.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Font Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font Size</Text>
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
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Text Animations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Animation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {animations.map((animation) => (
              <TouchableOpacity
                key={animation.name}
                style={[
                  styles.animationButton,
                  selectedAnimation === animation.name && styles.selectedAnimationButton
                ]}
                onPress={() => setSelectedAnimation(animation.name as any)}
              >
                <MaterialIcons 
                  name={animation.icon as any} 
                  size={20} 
                  color={selectedAnimation === animation.name ? 'white' : '#aaa'} 
                />
                <Text style={[
                  styles.animationText,
                  selectedAnimation === animation.name && styles.selectedAnimationText
                ]}>
                  {animation.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>


        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddText}>
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Text to Video</Text>
        </TouchableOpacity>
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
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    fontSize: moderateScale(16),
    minHeight: moderateScale(80),
    textAlignVertical: 'top',
  },
  colorButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(10),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorButton: {
    borderColor: AppColors.primary,
  },
  fontButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(8),
  },
  selectedFontButton: {
    backgroundColor: AppColors.primary,
  },
  fontButtonText: {
    color: 'white',
    fontSize: moderateScale(14),
  },
  selectedFontButtonText: {
    fontWeight: '600',
  },
  previewContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: moderateScale(20),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(60),
  },
  previewText: {
    fontSize: moderateScale(18),
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(15),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(10),
  },
  addButtonText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: moderateScale(8),
  },
  templateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(8),
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  templateText: {
    color: 'white',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  sizeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(8),
    minWidth: moderateScale(40),
    alignItems: 'center',
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
  alignmentButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(12),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAlignmentButton: {
    backgroundColor: AppColors.primary,
  },
  animationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(8),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAnimationButton: {
    backgroundColor: AppColors.primary,
    borderColor: '#FFFFFF',
  },
  animationText: {
    color: '#aaa',
    fontSize: moderateScale(12),
    marginLeft: moderateScale(4),
    fontWeight: '500',
  },
  selectedAnimationText: {
    color: 'white',
    fontWeight: '700',
  },
});

export default TextOverlay;