import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/Colors';
import { useScript } from '../../contexts/ScriptContext';
import {
    getResponsiveButtonHeight,
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

const ScriptScreen = () => {
  const { script, setScript, isRAGGenerated, ragMetadata, clearScript } = useScript();
  const insets = useSafeAreaInsets();

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        setScript(clipboardContent);
        Alert.alert('Success', 'Text pasted from clipboard!');
      } else {
        Alert.alert('Info', 'No text found in clipboard');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  const handleSaveScript = () => {
    if (!script.trim()) {
      Alert.alert('Error', 'Please enter some text before saving');
      return;
    }

    // Script is auto-saved by context, just show success message
    Alert.alert('Success', 'Script saved successfully!');
  };

  const handleClearScript = () => {
    Alert.alert(
      'Clear Script',
      'Are you sure you want to clear the script?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearScript();
            Alert.alert('Success', 'Script cleared!');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with line */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Script</Text>
        </View>
        <View style={styles.headerLine} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{
          paddingBottom: getResponsiveTabBarHeight() + insets.bottom + responsiveSpacing(20)
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* RAG Badge (if script is AI-generated) */}
        {isRAGGenerated && ragMetadata && (
          <View style={styles.ragBadgeContainer}>
            <MaterialIcons name="auto-awesome" size={16} color="#4CAF50" />
            <Text style={styles.ragBadgeText}>
              🤖 AI-Generated Script
              {ragMetadata.prompt && ` • ${ragMetadata.prompt}`}
            </Text>
          </View>
        )}

        {/* Script Input Area */}
        <View style={styles.scriptContainer}>
          <TextInput
            style={styles.scriptInput}
            placeholder="Type or paste your script here..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={script}
            onChangeText={setScript}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePasteFromClipboard}
          >
            <MaterialIcons name="content-paste" size={20} color={AppColors.white} />
            <Text style={styles.buttonText}>Paste from Clipboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (script) {
                Alert.alert('Info', 'Script is already loaded from storage!');
              } else {
                Alert.alert('Info', 'No saved script found');
              }
            }}
          >
            <MaterialIcons name="folder-open" size={20} color={AppColors.white} />
            <Text style={styles.buttonText}>Script Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearScript}
          >
            <MaterialIcons name="clear" size={20} color={AppColors.white} />
            <Text style={styles.buttonText}>Clear Script</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveScript}
        >
          <MaterialIcons 
            name="save" 
            size={20} 
            color={AppColors.white} 
          />
          <Text style={styles.saveButtonText}>
            Save (Auto-saved)
          </Text>
        </TouchableOpacity>

        {/* Character Count */}
        <Text style={styles.characterCount}>
          Characters: {script.length}
        </Text>
      </ScrollView>
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
  scriptContainer: {
    backgroundColor: AppColors.primary,
    borderRadius: responsiveBorderRadius(12),
    padding: responsivePadding(20),
    marginBottom: responsiveSpacing(30),
    marginTop: responsiveSpacing(20),
    minHeight: isSmallScreen ? 280 : isLargeScreen ? 320 : 300,
    // Platform-specific shadows
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.OS === 'ios' ? 2 : 4,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 4 : 8,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  scriptInput: {
    color: AppColors.white,
    fontSize: responsiveFontSize(16, 18, 14),
    lineHeight: isSmallScreen ? 22 : 24,
    textAlignVertical: 'top',
    flex: 1,
    minHeight: isSmallScreen ? 240 : isLargeScreen ? 280 : 260,
  },
  buttonContainer: {
    marginBottom: responsiveSpacing(20),
  },
  actionButton: {
    backgroundColor: AppColors.primary,
    borderRadius: responsiveBorderRadius(8),
    padding: responsivePadding(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveSpacing(10),
    minHeight: getResponsiveButtonHeight(),
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
  buttonText: {
    color: AppColors.white,
    fontSize: responsiveFontSize(16, 18, 14),
    fontWeight: '600',
    marginLeft: responsiveSpacing(8),
  },
  saveButton: {
    backgroundColor: AppColors.primary,
    borderRadius: responsiveBorderRadius(12),
    padding: responsivePadding(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveSpacing(20),
    minHeight: getResponsiveButtonHeight(),
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: AppColors.white,
    fontSize: responsiveFontSize(18, 20, 16),
    fontWeight: '600',
    marginLeft: responsiveSpacing(8),
  },
  characterCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: responsiveFontSize(14, 16, 12),
    textAlign: 'center',
    marginBottom: responsiveSpacing(20),
  },
  ragBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: responsiveBorderRadius(8),
    paddingHorizontal: responsivePadding(12),
    paddingVertical: responsiveSpacing(8),
    marginBottom: responsiveSpacing(15),
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  ragBadgeText: {
    color: '#4CAF50',
    fontSize: responsiveFontSize(12, 14, 11),
    fontWeight: '600',
    marginLeft: responsiveSpacing(8),
    flex: 1,
  },
});

export default ScriptScreen;