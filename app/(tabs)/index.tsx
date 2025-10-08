import { router } from 'expo-router';
import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppColors } from '../../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header with line */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerLine} />
      </View>

      <View style={styles.content}>
        {/* Teleprompter Card with Background Image */}
        <ImageBackground
          source={require('../../assets/images/saa.jpg')}
          style={styles.teleprompterCard}
          imageStyle={styles.cardBackgroundImage}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Teleprompter</Text>
            <Text style={styles.cardDescription}>
              Create professional video pitches with{"\n"}
              built-in teleprompter and editing tools,{"\n"}
              right on your phone
            </Text>
          </View>
        </ImageBackground>

        {/* Recording Mode Section */}
        <Text style={styles.sectionTitle}>Select Recording Mode</Text>

        <View style={styles.recordingModes}>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => {
              router.push({
                pathname: '/screens/videoShoot',
                params: { mode: '1min' },
              });
            }}
          >
            <MaterialIcons name="edit" size={24} color={AppColors.white} />
            <Text style={styles.modeButtonText}>1-Minute Pitch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => {
              router.push({
                pathname: '/screens/videoShoot',
                params: { mode: '3min' },
              });
            }}
          >
            <MaterialIcons name="slideshow" size={24} color={AppColors.white} />
            <Text style={styles.modeButtonText}>3-Minute{"\n"}Presentation</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.quickStartButton}
          onPress={() => {
            router.push({
              pathname: '/screens/videoShoot',
              params: { mode: '1min' },
            });
          }}
        >
          <Text style={styles.quickStartText}>Quick start recording</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={async () => {
            try {
              // Request permission to access media library
              const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
              
              if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Permission to access camera roll is required!');
                return;
              }

              // Launch image picker for video
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 1,
              });

              if (!result.canceled && result.assets[0]) {
                const videoUri = result.assets[0].uri;
                // Navigate to PreviewVideoShoot with the selected video
                router.push({
                  pathname: '/screens/PreviewVideoShoot',
                  params: { 
                    videoUri: videoUri,
                    orientation: 'portrait'
                  },
                });
              }
            } catch (error) {
              console.error('Error picking video:', error);
              Alert.alert('Error', 'Failed to select video. Please try again.');
            }
          }}
        >
          <Text style={styles.uploadText}>Upload Video</Text>
        </TouchableOpacity>
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
    paddingBottom: 90,
  },
  teleprompterCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    minHeight: 200,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardBackgroundImage: {
    borderRadius: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.white,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: AppColors.white,
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 39,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.white,
    marginBottom: 20,
  },
  recordingModes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#259B9A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  modeButtonText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  quickStartButton: {
    backgroundColor: '#259B9A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  quickStartText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#259B9A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },

});

export default HomeScreen;