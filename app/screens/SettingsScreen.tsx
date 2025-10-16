import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppConfigManager, { AppConfig } from '../../config/appConfig';
import AWSS3Service from '../../utils/awsS3Service';
import {
    getTopSafeArea,
    responsiveFontSize,
    responsiveSpacing,
    SCREEN_WIDTH
} from '../../utils/scaling';

const SettingsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<AppConfig>(AppConfigManager.getConfig());
  const [awsConfig, setAwsConfig] = useState({
    region: '',
    bucketName: '',
    accessKeyId: '',
    secretAccessKey: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const loadedConfig = await AppConfigManager.loadConfig();
      setConfig(loadedConfig);
      setAwsConfig(loadedConfig.aws);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleSaveAwsConfig = async () => {
    if (!awsConfig.region || !awsConfig.bucketName || !awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
      Alert.alert('Error', 'Please fill in all AWS configuration fields');
      return;
    }

    setIsLoading(true);
    try {
      // Update app config
      await AppConfigManager.updateAwsConfig(awsConfig);
      
      // Initialize AWS S3 service
      await AWSS3Service.initialize(awsConfig);
      
      Alert.alert('Success', 'AWS S3 configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save AWS config:', error);
      Alert.alert('Error', 'Failed to save AWS configuration. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!AppConfigManager.isAwsConfigured()) {
      Alert.alert('Error', 'Please configure AWS settings first');
      return;
    }

    setIsLoading(true);
    try {
      // Test connection by trying to generate a presigned URL
      const testKey = 'test-connection.txt';
      const url = await AWSS3Service.getPresignedUrl(testKey, 60);
      
      if (url) {
        Alert.alert('Success', 'AWS S3 connection test successful!');
      } else {
        Alert.alert('Error', 'Failed to connect to AWS S3');
      }
    } catch (error) {
      console.error('AWS connection test failed:', error);
      Alert.alert('Error', 'Failed to connect to AWS S3. Please check your credentials and bucket name.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConfig = async () => {
    Alert.alert(
      'Clear Configuration',
      'Are you sure you want to clear all AWS configuration? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AppConfigManager.resetConfig();
              await AWSS3Service.clearConfig();
              setConfig(AppConfigManager.getConfig());
              setAwsConfig({
                region: '',
                bucketName: '',
                accessKeyId: '',
                secretAccessKey: '',
              });
              Alert.alert('Success', 'Configuration cleared successfully');
            } catch (error) {
              console.error('Failed to clear config:', error);
              Alert.alert('Error', 'Failed to clear configuration');
            }
          },
        },
      ]
    );
  };

  const handleFeatureToggle = async (feature: keyof AppConfig['features'], value: boolean) => {
    try {
      await AppConfigManager.updateFeatureFlags({ [feature]: value });
      setConfig({ ...config, features: { ...config.features, [feature]: value } });
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      Alert.alert('Error', 'Failed to update feature setting');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerLine} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AWS S3 Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AWS S3 Configuration</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Region</Text>
            <TextInput
              style={styles.input}
              value={awsConfig.region}
              onChangeText={(text) => setAwsConfig({ ...awsConfig, region: text })}
              placeholder="e.g., us-east-1"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bucket Name</Text>
            <TextInput
              style={styles.input}
              value={awsConfig.bucketName}
              onChangeText={(text) => setAwsConfig({ ...awsConfig, bucketName: text })}
              placeholder="your-bucket-name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Access Key ID</Text>
            <TextInput
              style={styles.input}
              value={awsConfig.accessKeyId}
              onChangeText={(text) => setAwsConfig({ ...awsConfig, accessKeyId: text })}
              placeholder="Your AWS Access Key ID"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Secret Access Key</Text>
            <TextInput
              style={styles.input}
              value={awsConfig.secretAccessKey}
              onChangeText={(text) => setAwsConfig({ ...awsConfig, secretAccessKey: text })}
              placeholder="Your AWS Secret Access Key"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTestConnection}
              disabled={isLoading}
            >
              <MaterialIcons name="wifi-tethering" size={20} color="white" />
              <Text style={styles.buttonText}>Test Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveAwsConfig}
              disabled={isLoading}
            >
              <MaterialIcons name="save" size={20} color="white" />
              <Text style={styles.buttonText}>Save Configuration</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClearConfig}
            disabled={isLoading}
          >
            <MaterialIcons name="clear" size={20} color="white" />
            <Text style={styles.buttonText}>Clear Configuration</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Flags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feature Settings</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>AWS Upload</Text>
              <Text style={styles.featureDescription}>Enable video upload to AWS S3</Text>
            </View>
            <Switch
              value={config.features.enableAwsUpload}
              onValueChange={(value) => handleFeatureToggle('enableAwsUpload', value)}
              trackColor={{ false: '#767577', true: '#259B9A' }}
              thumbColor={config.features.enableAwsUpload ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Video Editing</Text>
              <Text style={styles.featureDescription}>Enable offline video editing features</Text>
            </View>
            <Switch
              value={config.features.enableVideoEditing}
              onValueChange={(value) => handleFeatureToggle('enableVideoEditing', value)}
              trackColor={{ false: '#767577', true: '#259B9A' }}
              thumbColor={config.features.enableVideoEditing ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Offline Processing</Text>
              <Text style={styles.featureDescription}>Enable FFmpeg offline video processing</Text>
            </View>
            <Switch
              value={config.features.enableOfflineProcessing}
              onValueChange={(value) => handleFeatureToggle('enableOfflineProcessing', value)}
              trackColor={{ false: '#767577', true: '#259B9A' }}
              thumbColor={config.features.enableOfflineProcessing ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Video Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Settings</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Max Video Size (MB)</Text>
            <TextInput
              style={styles.input}
              value={config.video.maxSizeMB.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 100;
                setConfig({ ...config, video: { ...config.video, maxSizeMB: value } });
              }}
              placeholder="100"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Status Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>AWS S3:</Text>
            <Text style={[styles.statusValue, { color: AppConfigManager.isAwsConfigured() ? '#4CAF50' : '#F44336' }]}>
              {AppConfigManager.isAwsConfigured() ? 'Configured' : 'Not Configured'}
            </Text>
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
  },
  header: {
    paddingTop: getTopSafeArea() + responsiveSpacing(20),
    paddingBottom: responsiveSpacing(20),
    alignItems: 'center',
    position: 'relative',
  },
  headerLine: {
    width: SCREEN_WIDTH * 0.8,
    height: 1,
    backgroundColor: '#259B9A',
    marginTop: responsiveSpacing(15),
  },
  backButton: {
    position: 'absolute',
    left: responsiveSpacing(20),
    top: getTopSafeArea() + responsiveSpacing(28),
    zIndex: 1,
  },
  headerTitle: {
    fontSize: responsiveFontSize(24, 28, 20),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: '#2196F3',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
  clearButton: {
    backgroundColor: '#F44336',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  featureDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#ccc',
    marginRight: 10,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen;
