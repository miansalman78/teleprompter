// Import polyfills for React Native compatibility
import './polyfills';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface S3Config {
  presignedUrl?: string; // Only need pre-signed URL
  testMode?: boolean; // Add test mode flag
}


export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export class AWSS3Service {
  private static config: S3Config | null = null;

  /**
   * Initialize AWS S3 service with pre-signed URL
   */
  static async initialize(config: S3Config): Promise<void> {
    // If in test mode, use mock configuration
    if (config.testMode) {
      console.log('Initializing AWS S3 service in TEST MODE with pre-signed URLs');
      this.config = {
        presignedUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com/test-upload',
        testMode: true
      };
      
      // Save test config to AsyncStorage
      await AsyncStorage.setItem('aws_s3_config', JSON.stringify(this.config));
      console.log('AWS S3 service initialized in TEST MODE');
      return;
    }

    // For production, only need pre-signed URL
    if (!config.presignedUrl) {
      throw new Error('Pre-signed URL is required for upload');
    }

    this.config = config;
    
    // Save config to AsyncStorage for persistence
    await AsyncStorage.setItem('aws_s3_config', JSON.stringify(config));
    console.log('AWS S3 service initialized with pre-signed URL');
  }

  /**
   * Load configuration from AsyncStorage
   */
  static async loadConfig(): Promise<S3Config | null> {
    try {
      console.log('Loading AWS S3 configuration from storage...');
      const configString = await AsyncStorage.getItem('aws_s3_config');
      
      if (!configString) {
        console.log('No AWS S3 configuration found in storage');
        return null;
      }
      
      console.log('AWS S3 configuration found in storage');
      this.config = JSON.parse(configString);
      
      if (!this.config) {
        console.log('Failed to parse AWS S3 configuration');
        return null;
      }
      
      // Validate configuration - only need pre-signed URL or test mode
      if (!this.config.presignedUrl && !(this.config.testMode === true)) {
        console.log('AWS S3 configuration incomplete - missing pre-signed URL');
        return null;
      }
      
      console.log('AWS S3 configuration validated');
      return this.config;
    } catch (error) {
      console.error('Failed to load AWS S3 config:', error);
      return null;
    }
  }

  /**
   * Check if S3 service is properly configured
   */
  static isConfigured(): boolean {
    return this.config !== null && (!!this.config.presignedUrl || this.config.testMode === true);
  }

  /**
   * Test pre-signed URL configuration
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing pre-signed URL configuration...');
      
      if (!this.config) {
        console.log('No configuration found, attempting to load config...');
        const loadedConfig = await this.loadConfig();
        if (!loadedConfig) {
          return {
            success: false,
            message: 'AWS S3 service not configured. Please configure pre-signed URL first.'
          };
        }
      }

      // Handle test mode
      if (this.config?.testMode) {
        console.log('Running in TEST MODE - simulating connection test');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        return {
          success: true,
          message: 'Test mode: Pre-signed URL configuration test simulated successfully'
        };
      }

      // Check if pre-signed URL is valid
      if (!this.config?.presignedUrl) {
        return {
          success: false,
          message: 'Pre-signed URL is not configured'
        };
      }

      // Test the pre-signed URL by making a HEAD request
      try {
        const response = await fetch(this.config.presignedUrl, {
          method: 'HEAD',
        });
        
        if (response.ok) {
          console.log('Pre-signed URL test successful');
          return {
            success: true,
            message: 'Pre-signed URL is valid and accessible'
          };
        } else {
          return {
            success: false,
            message: `Pre-signed URL test failed with status: ${response.status}`
          };
        }
      } catch (fetchError) {
        return {
          success: false,
          message: `Pre-signed URL test failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
        };
      }
    } catch (error) {
      console.error('Pre-signed URL test failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Upload video file using pre-signed URL
   */
  static async uploadVideo(
    filePath: string,
    presignedUrl: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Starting video upload with pre-signed URL:', { filePath, presignedUrl });
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File not found: ${filePath}`);
      }

      console.log('File info:', { 
        exists: fileInfo.exists, 
        size: fileInfo.size, 
        uri: fileInfo.uri 
      });

      // Handle test mode
      if (this.config?.testMode) {
        console.log('Running in TEST MODE - simulating upload with pre-signed URL');
        
        // Simulate upload progress
        if (onProgress) {
          const steps = [10, 25, 50, 75, 90, 100];
          for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            onProgress({
              loaded: Math.floor((fileInfo.size || 0) * steps[i] / 100),
              total: fileInfo.size || 0,
              percentage: steps[i],
            });
          }
        }

        // Generate a mock pre-signed URL for testing
        const mockUrl = `https://test-bucket.s3.us-east-1.amazonaws.com/test-upload?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20240101%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240101T000000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=test-signature`;
        
        console.log('Test upload completed successfully');
        
        return {
          success: true,
          key: 'test-upload',
          url: mockUrl,
        };
      }

      // Real upload using pre-signed URL
      console.log('Uploading to pre-signed URL...');
      
      // Read file as base64
      const fileData = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!fileData || fileData.length === 0) {
        throw new Error('File is empty or could not be read');
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, 'base64');
      console.log('Buffer created, size:', buffer.length);

      // Upload using fetch with pre-signed URL
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-Type': 'video/mp4',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status} - ${response.statusText}`);
      }

      // Report completion
      if (onProgress) {
        onProgress({
          loaded: buffer.length,
          total: buffer.length,
          percentage: 100,
        });
      }

      console.log('Video uploaded successfully to S3');
      
      return {
        success: true,
        key: 'uploaded-video',
        url: presignedUrl.split('?')[0], // Return URL without query parameters
      };
    } catch (error) {
      console.error('Failed to upload video to S3:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      // Provide specific error messages based on error type
      let userFriendlyError = 'Unknown error occurred during upload';
      
      if (error instanceof Error) {
        if (error.message.includes('InvalidAccessKeyId')) {
          userFriendlyError = 'Invalid AWS Access Key ID. Please check your credentials.';
        } else if (error.message.includes('SignatureDoesNotMatch')) {
          userFriendlyError = 'Invalid AWS Secret Access Key. Please check your credentials.';
        } else if (error.message.includes('NoSuchBucket')) {
          userFriendlyError = 'S3 bucket does not exist. Please check your bucket name.';
        } else if (error.message.includes('AccessDenied')) {
          userFriendlyError = 'Access denied to S3 bucket. Please check your permissions.';
        } else if (error.message.includes('Network')) {
          userFriendlyError = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          userFriendlyError = 'Upload timeout. Please try again with a better connection.';
        } else if (error.message.includes('File not found')) {
          userFriendlyError = 'Video file not found. Please record a new video.';
        } else if (error.message.includes('File is empty')) {
          userFriendlyError = 'Video file is empty or corrupted. Please record a new video.';
        } else {
          userFriendlyError = error.message;
        }
      }
      
      return {
        success: false,
        error: userFriendlyError,
      };
    }
  }


  /**
   * Generate unique key for video upload
   */
  static generateVideoKey(videoId: string, mode: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `videos/${mode}/${videoId}_${timestamp}.mp4`;
  }

  /**
   * Update video upload status in AsyncStorage
   */
  static async updateVideoUploadStatus(
    videoId: string,
    status: 'pending' | 'uploading' | 'completed' | 'failed',
    s3Key?: string,
    s3Url?: string,
    error?: string
  ): Promise<void> {
    try {
      const existingVideos = await AsyncStorage.getItem('saved_videos');
      const videos = existingVideos ? JSON.parse(existingVideos) : [];
      
      const videoIndex = videos.findIndex((video: any) => video.id === videoId);
      if (videoIndex !== -1) {
        videos[videoIndex].uploadStatus = status;
        if (s3Key) videos[videoIndex].s3Key = s3Key;
        if (s3Url) videos[videoIndex].s3Url = s3Url;
        if (error) videos[videoIndex].uploadError = error;
        videos[videoIndex].lastUpdated = new Date().toISOString();
        
        await AsyncStorage.setItem('saved_videos', JSON.stringify(videos));
        console.log(`Updated video ${videoId} upload status to ${status}`);
      }
    } catch (error) {
      console.error('Failed to update video upload status:', error);
    }
  }

  /**
   * Get all videos with upload status
   */
  static async getVideosWithUploadStatus(): Promise<any[]> {
    try {
      const existingVideos = await AsyncStorage.getItem('saved_videos');
      return existingVideos ? JSON.parse(existingVideos) : [];
    } catch (error) {
      console.error('Failed to get videos with upload status:', error);
      return [];
    }
  }

  /**
   * Clear AWS S3 configuration
   */
  static async clearConfig(): Promise<void> {
    try {
      await AsyncStorage.removeItem('aws_s3_config');
      this.config = null;
      console.log('AWS S3 configuration cleared');
    } catch (error) {
      console.error('Failed to clear AWS S3 configuration:', error);
    }
  }

  /**
   * Quick fix common AWS issues
   */
  static async quickFix(): Promise<{
    success: boolean;
    message: string;
    actions: string[];
  }> {
    const actions: string[] = [];
    
    try {
      // Try to reload configuration
      const config = await this.loadConfig();
      if (config) {
        actions.push('Configuration reloaded successfully');
        
        // Test connection
        try {
          const testResult = await this.testConnection();
          if (testResult.success) {
            actions.push('Connection test passed');
            
            return {
              success: true,
              message: 'AWS S3 is now working correctly!',
              actions
            };
          } else {
            actions.push('Connection test failed - check pre-signed URL');
            
            return {
              success: false,
              message: 'Configuration loaded but connection failed. Please check your pre-signed URL.',
              actions
            };
          }
        } catch (connectionError) {
          actions.push('Connection test failed - check pre-signed URL');
          
          return {
            success: false,
            message: 'Configuration loaded but connection failed. Please check your pre-signed URL.',
            actions
          };
        }
      } else {
        actions.push('No configuration found');
        
        return {
          success: false,
          message: 'No AWS configuration found. Please configure pre-signed URL first.',
          actions
        };
      }
    } catch (error) {
      actions.push('Quick fix failed');
      
      return {
        success: false,
        message: 'Quick fix failed. Please check your configuration manually.',
        actions
      };
    }
  }


  /**
   * Initialize AWS S3 service in test mode for development/testing
   */
  static async initializeTestMode(): Promise<void> {
    console.log('Initializing AWS S3 service in TEST MODE');
    const testConfig: S3Config = {
      presignedUrl: 'https://test-bucket.s3.us-east-1.amazonaws.com/test-upload',
      testMode: true
    };
    
    await this.initialize(testConfig);
    console.log('AWS S3 service initialized in TEST MODE - ready for testing with pre-signed URLs');
  }

  /**
   * Debug AWS configuration issues
   */
  static async debugConfiguration(): Promise<{
    hasConfig: boolean;
    configValid: boolean;
    serviceInitialized: boolean;
    details: any;
  }> {
    const details: any = {};
    
    try {
      // Check if config exists in storage
      const configString = await AsyncStorage.getItem('aws_s3_config');
      details.hasConfigInStorage = !!configString;
      
      if (configString) {
        try {
          const config = JSON.parse(configString);
          details.config = {
            hasPresignedUrl: !!config.presignedUrl,
            isTestMode: !!config.testMode,
            presignedUrlLength: config.presignedUrl ? config.presignedUrl.length : 0
          };
          
          // Validate config - only need pre-signed URL or test mode
          details.configValid = !!(config.presignedUrl || config.testMode);
        } catch (parseError) {
          details.parseError = parseError instanceof Error ? parseError.message : 'Unknown parse error';
          details.configValid = false;
        }
      }
      
      // Check service state
      details.serviceInitialized = !!this.config;
      details.hasConfig = !!this.config;
      
      return {
        hasConfig: details.hasConfigInStorage,
        configValid: details.configValid,
        serviceInitialized: details.serviceInitialized,
        details
      };
    } catch (error) {
      details.error = error instanceof Error ? error.message : 'Unknown error';
      return {
        hasConfig: false,
        configValid: false,
        serviceInitialized: false,
        details
      };
    }
  }
}

export default AWSS3Service;


