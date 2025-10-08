import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { useVideoPlayer } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  size: number;
}

export interface VideoFrame {
  id: number;
  time: number;
  thumbnail: string;
}

export class VideoProcessor {
  /**
   * Get video metadata including duration, dimensions, etc.
   */
  static async getVideoMetadata(videoUri: string): Promise<VideoMetadata> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
      // For web platform, use HTML5 video element to get metadata
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          
          video.onloadedmetadata = () => {
            console.log('Web video metadata loaded - duration:', video.duration);
            resolve({
              duration: video.duration || 0,
              width: video.videoWidth || 1920,
              height: video.videoHeight || 1080,
              frameRate: 30, // Default frame rate for web
              size: fileInfo.size || 0,
            });
          };
          
          video.onerror = () => {
            console.log('Web video metadata error - using fallback');
            // Fallback metadata
            resolve({
              duration: 0,
              width: 1920,
              height: 1080,
              frameRate: 30,
              size: fileInfo.size || 0,
            });
          };
          
          video.src = videoUri;
        });
      }
      
      // For native platforms, try to use expo-av (if available)
       try {
         if (Video && Video.createAsync) {
           const { sound } = await Video.createAsync({ uri: videoUri }, {}, false);
           const status = await sound.getStatusAsync();
           
           if (status.isLoaded) {
             const durationInSeconds = (status.durationMillis || 0) / 1000;
             console.log('Native video metadata loaded - duration:', durationInSeconds);
             return {
               duration: durationInSeconds,
               width: 1920, // Default values since expo-av doesn't provide dimensions
               height: 1080,
               frameRate: 30,
               size: fileInfo.size || 0,
             };
           }
         }
       } catch (avError) {
         console.log('Expo-AV metadata extraction failed:', avError);
       }
      
      // Fallback to default values
      console.log('Using fallback metadata - duration: 0');
      return {
        duration: 0, // Default 0 seconds
        width: 1920,
        height: 1080,
        frameRate: 30,
        size: fileInfo.size || 0,
      };
    } catch (error) {
      console.error('Error getting video metadata:', error);
      // Fallback to default values
      return {
        duration: 0, // Default 0 seconds
        width: 1920,
        height: 1080,
        frameRate: 30,
        size: 0,
      };
    }
  }

  /**
   * Extract video frames at specified intervals
   */
  static async extractVideoFrames(
    videoUri: string, 
    frameCount: number, 
    frameInterval: number = 0.5
  ): Promise<VideoFrame[]> {
    try {
      const frames: VideoFrame[] = [];
      
      // Get video metadata to determine actual duration
      const metadata = await this.getVideoMetadata(videoUri);
      console.log('Extracting frames - metadata duration:', metadata.duration, 'frameCount:', frameCount);
      const actualFrameInterval = metadata.duration / frameCount;
      console.log('Calculated frame interval:', actualFrameInterval);
      
      // For web platform, use HTML5 video to extract actual frame thumbnails
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          const video = document.createElement('video');
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          video.preload = 'metadata';
          video.crossOrigin = 'anonymous';
          
          video.onloadedmetadata = async () => {
            console.log('Web video loaded for frame extraction - duration:', video.duration);
            canvas.width = 160; // Thumbnail width
            canvas.height = 90;  // Thumbnail height (16:9 aspect ratio)
            
            const extractFrame = (index: number): Promise<string> => {
              return new Promise((frameResolve) => {
                const time = index * actualFrameInterval;
                console.log(`Extracting frame ${index} at time ${time}s`);
                video.currentTime = time;
                
                video.onseeked = () => {
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataURL = canvas.toDataURL('image/jpeg', 0.7);
                    console.log(`Frame ${index} extracted successfully, dataURL length:`, dataURL.length);
                    frameResolve(dataURL);
                  } else {
                    console.warn(`Frame ${index} extraction failed - no canvas context`);
                    frameResolve('');
                  }
                };
              });
            };
            
            // Extract frames sequentially
            console.log('Starting frame extraction loop...');
            for (let i = 0; i < frameCount; i++) {
              try {
                const thumbnail = await extractFrame(i);
                frames.push({
                  id: i,
                  time: i * actualFrameInterval,
                  thumbnail,
                });
                console.log(`Frame ${i} added to frames array`);
              } catch (frameError) {
                console.warn(`Failed to extract frame ${i}:`, frameError);
                frames.push({
                  id: i,
                  time: i * actualFrameInterval,
                  thumbnail: '',
                });
              }
            }
            
            console.log('Frame extraction completed. Total frames:', frames.length);
            resolve(frames);
          };
          
          video.onerror = () => {
            console.warn('Video loading failed, using placeholder frames');
            // Fallback to placeholder frames
            for (let i = 0; i < frameCount; i++) {
              frames.push({
                id: i,
                time: i * actualFrameInterval,
                thumbnail: '',
              });
            }
            resolve(frames);
          };
          
          video.src = videoUri;
        });
      }
      
      // For native platforms, generate actual thumbnails using expo-video-thumbnails
      console.log('Native platform detected - generating actual thumbnails');
      
      for (let i = 0; i < frameCount; i++) {
        const time = Math.min(i * actualFrameInterval, metadata.duration - 0.1);
        try {
          const thumbnailUri = await VideoProcessor.generateThumbnail(videoUri, time);
          frames.push({
            id: i,
            time,
            thumbnail: thumbnailUri,
          });
          console.log(`Native thumbnail ${i} generated for time ${time}s: ${thumbnailUri ? 'success' : 'failed'}`);
        } catch (error) {
          console.error(`Error generating thumbnail ${i} at time ${time}s:`, error);
          // Push frame with empty thumbnail on error
          frames.push({
            id: i,
            time,
            thumbnail: '',
          });
        }
      }
      
      return frames;
    } catch (error) {
      console.error('Error extracting video frames:', error);
      // Return placeholder frames as fallback
      const fallbackFrames: VideoFrame[] = [];
      for (let i = 0; i < frameCount; i++) {
        fallbackFrames.push({
          id: i,
          time: i * 0.5,
          thumbnail: '',
        });
      }
      return fallbackFrames;
    }
  }

  /**
   * Generate a thumbnail from video at specified time
   */
  static async generateThumbnail(
    videoUri: string, 
    timeInSeconds: number = 1
  ): Promise<string> {
    try {
      console.log(`generateThumbnail called with videoUri: ${videoUri}, time: ${timeInSeconds}s`);
      
      // For web platform, return empty string since we can't generate thumbnails
      if (Platform.OS === 'web') {
        console.log('Web platform: thumbnail generation not supported');
        return '';
      }
      
      // Check if expo-video-thumbnails is available
      if (!VideoThumbnails || !VideoThumbnails.getThumbnailAsync) {
        console.error('expo-video-thumbnails not available');
        return '';
      }
      
      // Get video metadata to validate time bounds
      const metadata = await this.getVideoMetadata(videoUri);
      console.log(`Video duration: ${metadata.duration}s, requested time: ${timeInSeconds}s`);
      console.log(videoUri);
      
      // Ensure requested time is within video duration
      if (timeInSeconds >= metadata.duration) {
        console.warn(`Requested time ${timeInSeconds}s exceeds video duration ${metadata.duration}s - using last valid frame`);
        timeInSeconds = Math.max(0, metadata.duration - 0.1); // Use frame 0.1s before end
      }
      
      // For native platforms, use expo-video-thumbnails
      console.log(`Generating thumbnail for ${videoUri} at adjusted time ${timeInSeconds}s`);
      
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: timeInSeconds * 1000, // Convert to milliseconds
        quality: 0.7, // Better performance with slightly lower quality
      });
      
      console.log(`Thumbnail generated successfully at ${timeInSeconds}s: ${uri}`);
      
      // Verify the file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.error(`Generated thumbnail file does not exist: ${uri}`);
        return '';
      }
      
      console.log(`Thumbnail file verified - size: ${fileInfo.size} bytes`);
      return uri;
    } catch (error) {
      console.error(`Failed to generate thumbnail at ${timeInSeconds}s:`, error);
      // Return empty string to show placeholder camera icon
      return '';
    }
  }

  /**
   * Clean up temporary files
   */
  static async cleanupTempFiles(): Promise<void> {
    try {
      const tempDirs = [
        `${FileSystem.cacheDirectory}video_frames/`,
        `${FileSystem.cacheDirectory}thumbnails/`,
      ];
      
      for (const dir of tempDirs) {
        const dirInfo = await FileSystem.getInfoAsync(dir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(dir, { idempotent: true });
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

export default VideoProcessor;