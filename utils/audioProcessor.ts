import * as FileSystem from 'expo-file-system/legacy';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import { Alert } from 'react-native';

export interface AudioTrack {
  id: string;
  name: string;
  url?: string;
  localPath?: string;
  duration?: number;
  category: string;
}

export interface AudioMixOptions {
  volume: number;
  startTime: number;
  duration?: number;
  fadeIn?: number;
  fadeOut?: number;
}

export class AudioProcessor {
  // Sample audio tracks with actual URLs (you can replace with your own)
  static readonly SAMPLE_TRACKS: AudioTrack[] = [
    {
      id: 'upbeat_1',
      name: 'Happy Pop',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'upbeat',
      duration: 30
    },
    {
      id: 'upbeat_2', 
      name: 'Energetic Rock',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'upbeat',
      duration: 45
    },
    {
      id: 'upbeat_3',
      name: 'Dance Beat',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'upbeat',
      duration: 120
    },
    {
      id: 'upbeat_4',
      name: 'Motivational',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'upbeat',
      duration: 90
    },
    {
      id: 'calm_1',
      name: 'Peaceful Piano',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'calm',
      duration: 60
    },
    {
      id: 'calm_2',
      name: 'Ambient Sounds',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'calm',
      duration: 45
    },
    {
      id: 'dramatic_1',
      name: 'Epic Orchestra',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'dramatic',
      duration: 90
    },
    {
      id: 'dramatic_2',
      name: 'Suspense',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'dramatic',
      duration: 75
    },
    {
      id: 'romantic_1',
      name: 'Love Ballad',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'romantic',
      duration: 75
    },
    {
      id: 'romantic_2',
      name: 'Acoustic Romance',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'romantic',
      duration: 60
    },
    // Background music tracks
    {
      id: 'background_1',
      name: 'Soft Background',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'background',
      duration: 120
    },
    {
      id: 'background_2',
      name: 'Uplifting Background',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'background',
      duration: 90
    },
    // Sound effects
    {
      id: 'effect_applause',
      name: 'Applause',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'effects',
      duration: 5
    },
    {
      id: 'effect_whoosh',
      name: 'Whoosh',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample URL
      category: 'effects',
      duration: 2
    }
  ];

  /**
   * Download audio file from URL to local storage
   */
  static async downloadAudioFile(audioTrack: AudioTrack): Promise<string> {
    try {
      // Check if we already have a local file
      if (audioTrack.localPath && await FileSystem.getInfoAsync(audioTrack.localPath)) {
        return audioTrack.localPath;
      }

      // Validate audio URL
      if (!audioTrack.url || audioTrack.url.trim() === '') {
        console.error('No audio URL provided for track:', audioTrack);
        throw new Error(`No audio URL provided for track: ${audioTrack.name} (${audioTrack.id})`);
      }

      const audioDir = `${FileSystem.documentDirectory}audio/`;
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      
      const localPath = `${audioDir}${audioTrack.id}.mp3`;
      
      console.log('Downloading audio file:', audioTrack.url, 'to', localPath);
      
      const downloadResult = await FileSystem.downloadAsync(audioTrack.url, localPath);
      
      if (downloadResult.status === 200) {
        console.log('Audio file downloaded successfully:', localPath);
        return localPath;
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Error downloading audio file:', error);
      throw error;
    }
  }

  /**
   * Mix audio with video using FFmpeg
   */
  static async mixAudioWithVideo(
    videoPath: string, 
    audioTrack: AudioTrack, 
    options: AudioMixOptions = { volume: 0.5, startTime: 0 }
  ): Promise<string> {
    try {
      // Download audio file if needed
      const audioPath = await this.downloadAudioFile(audioTrack);
      
      // Create output directory
      const outputDir = `${FileSystem.documentDirectory}mixed_videos/`;
      await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });
      
      const timestamp = Date.now();
      const outputPath = `${outputDir}mixed_${timestamp}.mp4`;
      
      // Build FFmpeg command for audio mixing
      let command = `-y -i "${videoPath}" -i "${audioPath}"`;
      
      // Add volume control
      command += ` -filter_complex "[1:a]volume=${options.volume}[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=3"`;
      
      // Add fade effects if specified
      if (options.fadeIn || options.fadeOut) {
        const fadeFilter = [];
        if (options.fadeIn) {
          fadeFilter.push(`afade=t=in:ss=0:d=${options.fadeIn}`);
        }
        if (options.fadeOut && options.duration) {
          fadeFilter.push(`afade=t=out:st=${options.duration - (options.fadeOut || 0)}:d=${options.fadeOut}`);
        }
        if (fadeFilter.length > 0) {
          command += `,${fadeFilter.join(',')}`;
        }
      }
      
      command += ` -c:v copy "${outputPath}"`;
      
      console.log('Executing FFmpeg command for audio mixing:', command);
      
      return new Promise((resolve, reject) => {
        FFmpegKit.executeAsync(
          command,
          async (session) => {
            try {
              if (!session) {
                reject(new Error('FFmpeg session is null'));
                return;
              }
              
              const returnCode = await session.getReturnCode();
              
              if (returnCode && returnCode.isValueSuccess()) {
                console.log('Audio mixed successfully:', outputPath);
                resolve(outputPath);
              } else {
                console.error('FFmpeg audio mixing failed with return code:', returnCode);
                reject(new Error(`Audio mixing failed with return code: ${returnCode}`));
              }
            } catch (sessionError) {
              console.error('Error in FFmpeg session callback:', sessionError);
              reject(sessionError);
            }
          },
          (log) => {
            if (log && log.getMessage) {
              console.log('FFmpeg log:', log.getMessage());
            }
          },
          (statistics) => {
            if (statistics) {
              console.log('FFmpeg statistics:', statistics);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error mixing audio with video:', error);
      throw error;
    }
  }

  /**
   * Import audio file from device
   */
  static async importAudioFromDevice(): Promise<AudioTrack | null> {
    try {
      // This would use expo-document-picker in a real implementation
      // For now, return a demo track
      Alert.alert(
        'Import Audio',
        'Audio import from device is not yet implemented. Using sample track instead.',
        [{ text: 'OK' }]
      );
      
      return this.SAMPLE_TRACKS[0]; // Return first sample track as demo
    } catch (error) {
      console.error('Error importing audio from device:', error);
      return null;
    }
  }

  /**
   * Extract audio from video file
   */
  static async extractAudioFromVideo(videoPath: string): Promise<string> {
    try {
      const audioDir = `${FileSystem.documentDirectory}extracted_audio/`;
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      
      const timestamp = Date.now();
      const outputPath = `${audioDir}extracted_${timestamp}.mp3`;
      
      const command = `-y -i "${videoPath}" -vn -acodec mp3 "${outputPath}"`;
      
      console.log('Extracting audio from video:', command);
      
      return new Promise((resolve, reject) => {
        FFmpegKit.executeAsync(
          command,
          async (session) => {
            try {
              if (!session) {
                reject(new Error('FFmpeg session is null'));
                return;
              }
              
              const returnCode = await session.getReturnCode();
              
              if (returnCode && returnCode.isValueSuccess()) {
                console.log('Audio extracted successfully:', outputPath);
                resolve(outputPath);
              } else {
                console.error('FFmpeg audio extraction failed with return code:', returnCode);
                reject(new Error(`Audio extraction failed with return code: ${returnCode}`));
              }
            } catch (sessionError) {
              console.error('Error in FFmpeg session callback:', sessionError);
              reject(sessionError);
            }
          },
          (log) => {
            if (log && log.getMessage) {
              console.log('FFmpeg log:', log.getMessage());
            }
          },
          (statistics) => {
            if (statistics) {
              console.log('FFmpeg statistics:', statistics);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error extracting audio from video:', error);
      throw error;
    }
  }

  /**
   * Get audio tracks by category
   */
  static getTracksByCategory(category: string): AudioTrack[] {
    return this.SAMPLE_TRACKS.filter(track => track.category === category);
  }

  /**
   * Get tracks by category (async version for compatibility)
   */
  static async getAudioTracksByCategory(category: string): Promise<AudioTrack[]> {
    return this.SAMPLE_TRACKS.filter(track => track.category === category);
  }

  /**
   * Get all available categories
   */
  static getCategories(): string[] {
    const categories = [...new Set(this.SAMPLE_TRACKS.map(track => track.category))];
    return categories;
  }
}

export default AudioProcessor;