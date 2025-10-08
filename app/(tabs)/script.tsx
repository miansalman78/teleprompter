import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/Colors';
import React from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ScriptScreen = () => {
  const [scriptText, setScriptText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        setScriptText(clipboardContent);
        Alert.alert('Success', 'Text pasted from clipboard!');
      } else {
        Alert.alert('Info', 'No text found in clipboard');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  const handleSaveScript = async () => {
    if (!scriptText.trim()) {
      Alert.alert('Error', 'Please enter some text before saving');
      return;
    }

    setIsSaving(true);
    try {
      await AsyncStorage.setItem('teleprompter_script', scriptText);
      Alert.alert('Success', 'Script saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save script');
    } finally {
      setIsSaving(false);
    }
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
          onPress: () => setScriptText(''),
        },
      ]
    );
  };

  const loadSavedScript = async () => {
    try {
      const savedScript = await AsyncStorage.getItem('teleprompter_script');
      if (savedScript) {
        setScriptText(savedScript);
        Alert.alert('Success', 'Saved script loaded!');
      } else {
        Alert.alert('Info', 'No saved script found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load saved script');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with line */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Script</Text>
        <View style={styles.headerLine} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Script Input Area */}
        <View style={styles.scriptContainer}>
          <TextInput
            style={styles.scriptInput}
            placeholder="Type or paste your script here..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={scriptText}
            onChangeText={setScriptText}
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
            onPress={loadSavedScript}
          >
            <MaterialIcons name="folder-open" size={20} color={AppColors.white} />
            <Text style={styles.buttonText}>Load Saved Script</Text>
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
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveScript}
          disabled={isSaving}
        >
          <MaterialIcons 
            name={isSaving ? "hourglass-empty" : "save"} 
            size={20} 
            color={AppColors.white} 
          />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>

        {/* Character Count */}
        <Text style={styles.characterCount}>
          Characters: {scriptText.length}
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
  scriptContainer: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    marginTop: 20,
    minHeight: 300,
  },
  scriptInput: {
    color: AppColors.white,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    flex: 1,
    minHeight: 260,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  characterCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ScriptScreen;