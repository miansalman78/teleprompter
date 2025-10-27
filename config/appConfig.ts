import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppConfig {
  aws: {
    region: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  video: {
    maxSizeMB: number;
    defaultQuality: 'low' | 'medium' | 'high';
  };
  features: {
    enableAwsUpload: boolean;
    enableVideoEditing: boolean;
    enableOfflineProcessing: boolean;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  aws: {
    region: 'us-east-1',
    bucketName: '',
    accessKeyId: '',
    secretAccessKey: '',
  },
  video: {
    maxSizeMB: 100,
    defaultQuality: 'high',
  },
  features: {
    enableAwsUpload: true,
    enableVideoEditing: true,
    enableOfflineProcessing: true,
  },
};

export class AppConfigManager {
  private static config: AppConfig = DEFAULT_CONFIG;

  /**
   * Load configuration from AsyncStorage
   */
  static async loadConfig(): Promise<AppConfig> {
    try {
      const configString = await AsyncStorage.getItem('app_config');
      if (configString) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(configString) };
      }
      return this.config;
    } catch (error) {
      console.error('Failed to load app config:', error);
      return this.config;
    }
  }

  /**
   * Save configuration to AsyncStorage
   */
  static async saveConfig(config: Partial<AppConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      await AsyncStorage.setItem('app_config', JSON.stringify(this.config));
      console.log('App configuration saved successfully');
    } catch (error) {
      console.error('Failed to save app config:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  static getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Update AWS configuration
   */
  static async updateAwsConfig(awsConfig: Partial<AppConfig['aws']>): Promise<void> {
    await this.saveConfig({
      aws: { ...this.config.aws, ...awsConfig },
    });
  }

  /**
   * Update feature flags
   */
  static async updateFeatureFlags(features: Partial<AppConfig['features']>): Promise<void> {
    await this.saveConfig({
      features: { ...this.config.features, ...features },
    });
  }

  /**
   * Check if AWS is configured
   */
  static isAwsConfigured(): boolean {
    return !!(
      this.config.aws.bucketName &&
      this.config.aws.accessKeyId &&
      this.config.aws.secretAccessKey
    );
  }

  /**
   * Reset configuration to defaults
   */
  static async resetConfig(): Promise<void> {
    try {
      await AsyncStorage.removeItem('app_config');
      this.config = DEFAULT_CONFIG;
      console.log('App configuration reset to defaults');
    } catch (error) {
      console.error('Failed to reset app config:', error);
    }
  }
}

export default AppConfigManager;















