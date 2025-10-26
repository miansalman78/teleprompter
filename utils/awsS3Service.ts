import AsyncStorage from '@react-native-async-storage/async-storage';

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
  expiresAt?: string; // ISO date string when the video will be automatically deleted
}

export interface VideoUploadStatus {
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  key?: string;
  url?: string;
  error?: string;
  timestamp: number;
  expiresAt?: string; // ISO date string when the video will be automatically deleted
}

export interface AwsConfig {
  presignedUrl: string;
  region?: string;
  bucketName?: string;
  expirationDays?: number; // Number of days after which objects will expire
}

class AWSS3Service {
  private static isInitialized = false;
  private static testMode = false;
  private static uploadStatuses: Map<string, VideoUploadStatus> = new Map();

  /**
   * Initialize the AWS S3 service in test mode
   */
  static async initializeTestMode(): Promise<void> {
    try {
      console.log('Initializing AWS S3 service in test mode...');
      this.testMode = true;
      this.isInitialized = true;
      
      // Load existing upload statuses from storage
      await this.loadUploadStatuses();
      
      console.log('AWS S3 service initialized in test mode');
    } catch (error) {
      console.error('Failed to initialize AWS S3 service:', error);
      throw error;
    }
  }

  /**
   * Load configuration from storage
   */
  static async loadConfig(): Promise<AwsConfig | null> {
    try {
      const configString = await AsyncStorage.getItem('aws_config');
      if (configString) {
        const config = JSON.parse(configString);
        console.log('AWS config loaded:', { ...config, presignedUrl: config.presignedUrl ? '***' : 'none' });
        return config;
      }
      return null;
    } catch (error) {
      console.error('Failed to load AWS config:', error);
      return null;
    }
  }

  /**
   * Save configuration to storage
   */
  static async saveConfig(config: AwsConfig): Promise<void> {
    try {
      // Set default expiration to 7 days if not specified
      if (!config.expirationDays) {
        config.expirationDays = 7;
      }
      await AsyncStorage.setItem('aws_config', JSON.stringify(config));
      console.log('AWS config saved successfully with expiration days:', config.expirationDays);
    } catch (error) {
      console.error('Failed to save AWS config:', error);
      throw error;
    }
  }

  /**
   * Upload video to S3 using pre-signed URL (Simulated for demo)
   */
  static async uploadVideo(
    videoUri: string,
    presignedUrl: string,
    onProgress?: (progress: UploadProgress) => void,
    expirationDays?: number
  ): Promise<UploadResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('AWS S3 service not initialized');
      }

      if (!presignedUrl) {
        throw new Error('Pre-signed URL is required for upload');
      }

      // Get config to check expiration days
      const config = await this.loadConfig();
      const expireDays = expirationDays || config?.expirationDays || 7;
      
      console.log('Starting video upload...', { 
        videoUri, 
        presignedUrl: presignedUrl.substring(0, 50) + '...', 
        expirationDays: expireDays 
      });

      // Simulate file size (no FileSystem calls to avoid errors)
      const fileSize = 1024 * 1024 * 5; // Simulate 5MB file
      console.log('Simulated file size:', fileSize, 'bytes', 'with expiration after', expireDays, 'days');

      // Simulate upload progress
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15; // Random progress increment
          
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            console.log('Upload completed successfully');
            
            // Extract key from presigned URL
            const urlParts = presignedUrl.split('?')[0].split('/');
            const key = urlParts[urlParts.length - 1];
            
            // Calculate expiration date (current date + expiration days)
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + expireDays);
            console.log(`Video will expire on: ${expirationDate.toISOString()}`);
            
            resolve({
              success: true,
              key: key,
              url: presignedUrl.split('?')[0],
              expiresAt: expirationDate.toISOString(),
            });
          }
          
          // Update progress
          const progressData: UploadProgress = {
            loaded: (progress / 100) * fileSize,
            total: fileSize,
            percentage: progress,
          };
          
          console.log('Upload progress:', progress.toFixed(2) + '%');
          
          if (onProgress) {
            onProgress(progressData);
          }
        }, 200); // Update every 200ms
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  /**
   * Update video upload status
   */
  static async updateVideoUploadStatus(
    videoId: string,
    status: VideoUploadStatus['status'],
    key?: string,
    url?: string,
    error?: string,
    progress: number = 0,
    expiresAt?: string
  ): Promise<void> {
    try {
      // If no expiration date is provided and status is completed, calculate default (7 days)
      let expiration = expiresAt;
      if (!expiration && status === 'completed') {
        const config = await this.loadConfig();
        const expireDays = config?.expirationDays || 7;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + expireDays);
        expiration = expirationDate.toISOString();
      }
      
      const uploadStatus: VideoUploadStatus = {
        id: videoId,
        status,
        progress,
        key,
        url,
        error,
        timestamp: Date.now(),
        expiresAt: expiration,
      };

      this.uploadStatuses.set(videoId, uploadStatus);
      await this.saveUploadStatuses();
      
      console.log('Upload status updated:', { videoId, status, progress });
    } catch (error) {
      console.error('Failed to update upload status:', error);
    }
  }

  /**
   * Get video upload status
   */
  static getVideoUploadStatus(videoId: string): VideoUploadStatus | undefined {
    return this.uploadStatuses.get(videoId);
  }

  /**
   * Get all video upload statuses
   */
  static getAllUploadStatuses(): VideoUploadStatus[] {
    return Array.from(this.uploadStatuses.values());
  }

  /**
   * Save upload statuses to storage
   */
  private static async saveUploadStatuses(): Promise<void> {
    try {
      const statuses = Array.from(this.uploadStatuses.entries());
      await AsyncStorage.setItem('upload_statuses', JSON.stringify(statuses));
    } catch (error) {
      console.error('Failed to save upload statuses:', error);
    }
  }

  /**
   * Load upload statuses from storage
   */
  private static async loadUploadStatuses(): Promise<void> {
    try {
      const statusesString = await AsyncStorage.getItem('upload_statuses');
      if (statusesString) {
        const statuses = JSON.parse(statusesString);
        this.uploadStatuses = new Map(statuses);
        console.log('Loaded upload statuses:', this.uploadStatuses.size);
      }
    } catch (error) {
      console.error('Failed to load upload statuses:', error);
    }
  }

  /**
   * Clear upload statuses
   */
  static async clearUploadStatuses(): Promise<void> {
    try {
      this.uploadStatuses.clear();
      await AsyncStorage.removeItem('upload_statuses');
      console.log('Upload statuses cleared');
    } catch (error) {
      console.error('Failed to clear upload statuses:', error);
    }
  }

  /**
   * Check if service is initialized
   */
  static isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if in test mode
   */
  static isInTestMode(): boolean {
    return this.testMode;
  }

  /**
   * Generate a test pre-signed URL for development
   */
  static generateTestPresignedUrl(fileName: string): string {
    // This is a mock pre-signed URL for testing
    // In a real implementation, this would be generated by your backend
    const timestamp = Date.now();
    const key = `videos/${timestamp}_${fileName}`;
    
    // Mock S3 URL structure
    return `https://test-bucket.s3.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test&X-Amz-Date=${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=test`;
  }
}

export default AWSS3Service;
