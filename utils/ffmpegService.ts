// FileSystem import removed to avoid deprecation errors
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

export interface FFmpegProgress {
  progress: number;
  time: number;
  speed: string;
}

export interface VideoEditOptions {
  startTime?: number;
  endTime?: number;
  speed?: number;
  rotation?: number;
  filters?: string[];
  audioVolume?: number;
  outputQuality?: 'low' | 'medium' | 'high';
}

export interface VideoEditResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration?: number;
}

export class FFmpegService {
  private static outputDir = `processed_videos/`;

  /**
   * Initialize FFmpeg service (simplified for demo)
   */
  static async initialize(): Promise<void> {
    try {
      console.log('FFmpeg service initialized successfully (demo mode)');
    } catch (error) {
      console.error('Failed to initialize FFmpeg service:', error);
      throw error;
    }
  }

  /**
   * Execute FFmpeg command with progress tracking
   */
  static async executeCommand(
    command: string,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoEditResult> {
    try {
      console.log('Executing FFmpeg command:', command);

      return new Promise((resolve) => {
        const session = FFmpegKit.executeAsync(
          command,
          (session) => {
            const returnCode = session.getReturnCode();
            const output = session.getOutput();
            const errorOutput = session.getFailStackTrace();

            console.log('FFmpeg execution completed:', {
              returnCode,
              output: output?.substring(0, 200) + '...',
              errorOutput: errorOutput?.substring(0, 200) + '...',
            });

            if (ReturnCode.isSuccess(returnCode)) {
              resolve({
                success: true,
                outputPath: this.extractOutputPath(command),
              });
            } else {
              resolve({
                success: false,
                error: errorOutput || 'FFmpeg execution failed',
              });
            }
          },
          (log) => {
            const message = log.getMessage();
            console.log('FFmpeg log:', message);
            
            // Parse progress from log messages
            if (onProgress && message.includes('time=')) {
              const progress = this.parseProgressFromLog(message);
              if (progress) {
                onProgress(progress);
              }
            }
          },
          (statistics) => {
            const progress = this.convertStatisticsToProgress(statistics);
            if (onProgress) {
              onProgress(progress);
            }
          }
        );
      });
    } catch (error) {
      console.error('FFmpeg execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Trim video to specified time range
   */
  static async trimVideo(
    inputPath: string,
    startTime: number,
    endTime: number,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoEditResult> {
    const outputPath = `${this.outputDir}trimmed_${Date.now()}.mp4`;
    const duration = endTime - startTime;
    
    const command = `-y -i "${inputPath}" -ss ${startTime} -t ${duration} -c copy "${outputPath}"`;
    
    return this.executeCommand(command, onProgress);
  }

  /**
   * Change video speed
   */
  static async changeSpeed(
    inputPath: string,
    speed: number,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoEditResult> {
    const outputPath = `${this.outputDir}speed_${Date.now()}.mp4`;
    
    // For speed changes, we need to re-encode
    const command = `-y -i "${inputPath}" -filter:v "setpts=${1/speed}*PTS" -filter:a "atempo=${speed}" -c:v libx264 -c:a aac "${outputPath}"`;
    
    return this.executeCommand(command, onProgress);
  }

  /**
   * Rotate video
   */
  static async rotateVideo(
    inputPath: string,
    rotation: number,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoEditResult> {
    const outputPath = `${this.outputDir}rotated_${Date.now()}.mp4`;
    
    let transpose = '';
    switch (rotation) {
      case 90:
        transpose = 'transpose=1';
        break;
      case 180:
        transpose = 'transpose=2,transpose=2';
        break;
      case 270:
        transpose = 'transpose=2';
        break;
      default:
        return { success: false, error: 'Invalid rotation angle' };
    }
    
    const command = `-y -i "${inputPath}" -vf "${transpose}" -c:a copy "${outputPath}"`;
    
    return this.executeCommand(command, onProgress);
  }

  /**
   * Add text overlay to video
   */
  static async addTextOverlay(
    inputPath: string,
    text: string,
    options: {
      x?: string;
      y?: string;
      fontSize?: number;
      fontColor?: string;
      startTime?: number;
      duration?: number;
    } = {},
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoEditResult> {
    const outputPath = `${this.outputDir}text_${Date.now()}.mp4`;
    
    const {
      x = '(w-text_w)/2',
      y = '(h-text_h)/2',
      fontSize = 24,
      fontColor = 'white',
      startTime = 0,
      duration = 0,
    } = options;

    let drawtextFilter = `drawtext=text='${text}':fontcolor=${fontColor}:fontsize=${fontSize}:x=${x}:y=${y}`;
    
    if (startTime > 0) {
      drawtextFilter += `:enable='between(t,${startTime},${startTime + duration})'`;
    }
    
    const command = `-y -i "${inputPath}" -vf "${drawtextFilter}" -c:a copy "${outputPath}"`;
    
    return this.executeCommand(command, onProgress);
  }

  /**
   * Apply video filters
   */
  static async applyFilters(
    inputPath: string,
    filters: string[],
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoEditResult> {
    const outputPath = `${this.outputDir}filtered_${Date.now()}.mp4`;
    
    const filterString = filters.join(',');
    const command = `-y -i "${inputPath}" -vf "${filterString}" -c:a copy "${outputPath}"`;
    
    return this.executeCommand(command, onProgress);
  }

  /**
   * Mix audio with video
   */
  static async mixAudio(
    inputPath: string,
    audioPath: string,
    options: {
      volume?: number;
      startTime?: number;
      duration?: number;
    } = {},
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoEditResult> {
    const outputPath = `${this.outputDir}mixed_${Date.now()}.mp4`;
    
    const { volume = 0.5, startTime = 0, duration = 0 } = options;
    
    let command = `-y -i "${inputPath}" -i "${audioPath}"`;
    
    if (startTime > 0) {
      command += ` -ss ${startTime}`;
    }
    
    if (duration > 0) {
      command += ` -t ${duration}`;
    }
    
    command += ` -filter_complex "[1:a]volume=${volume}[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=3" -c:v copy "${outputPath}"`;
    
    return this.executeCommand(command, onProgress);
  }

  /**
   * Compress video for smaller file size
   */
  static async compressVideo(
    inputPath: string,
    quality: 'low' | 'medium' | 'high' = 'medium',
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoEditResult> {
    const outputPath = `${this.outputDir}compressed_${Date.now()}.mp4`;
    
    let crf = '23'; // Default medium quality
    switch (quality) {
      case 'low':
        crf = '28';
        break;
      case 'high':
        crf = '18';
        break;
    }
    
    const command = `-y -i "${inputPath}" -c:v libx264 -crf ${crf} -c:a aac -b:a 128k "${outputPath}"`;
    
    return this.executeCommand(command, onProgress);
  }

  /**
   * Extract video frames as images
   */
  static async extractFrames(
    inputPath: string,
    frameCount: number = 10,
    onProgress?: (progress: FFmpegProgress) => void
  ): Promise<VideoEditResult> {
    const outputPath = `${this.outputDir}frames/frame_%03d.jpg`;
    
    // Create frames directory
    await FileSystem.makeDirectoryAsync(`${this.outputDir}frames/`, { intermediates: true });
    
    const command = `-y -i "${inputPath}" -vf "fps=1/${frameCount}" "${outputPath}"`;
    
    return this.executeCommand(command, onProgress);
  }

  /**
   * Get video information
   */
  static async getVideoInfo(inputPath: string): Promise<any> {
    try {
      const command = `-i "${inputPath}" -f null -`;
      
      return new Promise((resolve) => {
        FFmpegKit.executeAsync(
          command,
          (session) => {
            const output = session.getOutput();
            const info = this.parseVideoInfo(output);
            resolve(info);
          }
        );
      });
    } catch (error) {
      console.error('Failed to get video info:', error);
      return null;
    }
  }

  /**
   * Clean up temporary files
   */
  static async cleanup(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.outputDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.outputDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(this.outputDir, { intermediates: true });
      }
      console.log('FFmpeg service cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup FFmpeg service:', error);
    }
  }

  // Private helper methods

  private static extractOutputPath(command: string): string {
    const matches = command.match(/"([^"]*\.mp4)"/g);
    return matches ? matches[matches.length - 1].replace(/"/g, '') : '';
  }

  private static parseProgressFromLog(message: string): FFmpegProgress | null {
    try {
      const timeMatch = message.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      const speedMatch = message.match(/speed=\s*([\d.]+)x/);
      
      if (timeMatch && speedMatch) {
        return {
          progress: 0, // Will be calculated from statistics
          time: this.parseTimeToSeconds(timeMatch[1]),
          speed: speedMatch[1],
        };
      }
    } catch (error) {
      console.error('Failed to parse progress from log:', error);
    }
    return null;
  }

  private static convertStatisticsToProgress(statistics: any): FFmpegProgress {
    return {
      progress: statistics.getTime() / 1000, // Convert to seconds
      time: statistics.getTime() / 1000,
      speed: `${statistics.getSpeed() || 0}x`,
    };
  }

  private static parseTimeToSeconds(timeString: string): number {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  private static parseVideoInfo(output: string): any {
    // Basic video info parsing - can be enhanced
    const durationMatch = output.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
    const resolutionMatch = output.match(/(\d{3,4}x\d{3,4})/);
    
    return {
      duration: durationMatch ? this.parseTimeToSeconds(durationMatch[1]) : 0,
      resolution: resolutionMatch ? resolutionMatch[1] : 'unknown',
    };
  }
}

export default FFmpegService;




