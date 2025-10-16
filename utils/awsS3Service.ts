import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface S3Config {
  region: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
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
  private static s3Client: S3Client | null = null;
  private static config: S3Config | null = null;

  /**
   * Initialize AWS S3 client with configuration
   */
  static async initialize(config: S3Config): Promise<void> {
    try {
      this.config = config;
      this.s3Client = new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
      
      // Save config to AsyncStorage for persistence
      await AsyncStorage.setItem('aws_s3_config', JSON.stringify(config));
      console.log('AWS S3 service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AWS S3 service:', error);
      throw error;
    }
  }

  /**
   * Load configuration from AsyncStorage
   */
  static async loadConfig(): Promise<S3Config | null> {
    try {
      const configString = await AsyncStorage.getItem('aws_s3_config');
      if (configString) {
        this.config = JSON.parse(configString);
        if (this.config) {
          await this.initialize(this.config);
        }
        return this.config;
      }
      return null;
    } catch (error) {
      console.error('Failed to load AWS S3 config:', error);
      return null;
    }
  }

  /**
   * Check if S3 service is properly configured
   */
  static isConfigured(): boolean {
    return this.s3Client !== null && this.config !== null;
  }

  /**
   * Upload video file to S3
   */
  static async uploadVideo(
    filePath: string,
    key: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      if (!this.s3Client || !this.config) {
        throw new Error('AWS S3 service not initialized');
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file as base64
      const fileData = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, 'base64');

      // Create upload command
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'video/mp4',
        Metadata: {
          'uploaded-at': new Date().toISOString(),
          'app-version': '1.1.0',
        },
      });

      // Simulate progress for large files
      if (onProgress) {
        const totalSize = buffer.length;
        let loaded = 0;
        const progressInterval = setInterval(() => {
          loaded += Math.min(1024 * 1024, totalSize - loaded); // 1MB chunks
          onProgress({
            loaded,
            total: totalSize,
            percentage: Math.round((loaded / totalSize) * 100),
          });
          
          if (loaded >= totalSize) {
            clearInterval(progressInterval);
          }
        }, 100);
      }

      // Execute upload
      const result = await this.s3Client.send(command);
      
      // Generate presigned URL for the uploaded file
      const url = await this.getPresignedUrl(key);
      
      console.log('Video uploaded successfully to S3:', key);
      
      return {
        success: true,
        key,
        url,
      };
    } catch (error) {
      console.error('Failed to upload video to S3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get presigned URL for a file
   */
  static async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (!this.s3Client || !this.config) {
        throw new Error('AWS S3 service not initialized');
      }

      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
      throw error;
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
      this.s3Client = null;
      this.config = null;
      console.log('AWS S3 configuration cleared');
    } catch (error) {
      console.error('Failed to clear AWS S3 configuration:', error);
    }
  }
}

export default AWSS3Service;
