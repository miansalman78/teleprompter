import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

export interface AudioMixOptions {
  videoPath: string;
  audioPath: string;
  outputPath: string;
  audioStartTime: number; // in seconds
  audioEndTime: number; // in seconds
  audioVolume: number; // 0-100
  muteOriginalAudio: boolean;
  videoVolume: number; // 0-100
}

export class AudioMixer {
  /**
   * Mix audio with video using ffmpeg-kit (offline processing)
   */
  static async mixAudioWithVideo(options: AudioMixOptions): Promise<string> {
    const {
      videoPath,
      audioPath,
      outputPath,
      audioStartTime,
      audioEndTime,
      audioVolume,
      muteOriginalAudio,
      videoVolume,
    } = options;

    try {
      // Calculate audio duration
      const audioDuration = audioEndTime - audioStartTime;
      
      // Convert volume percentages to ffmpeg volume filters (0.0 to 1.0)
      const audioVolumeFloat = audioVolume / 100;
      const videoVolumeFloat = videoVolume / 100;
      
      // Build ffmpeg command for audio mixing
      let command = `-i "${videoPath}" -i "${audioPath}"`;
      
      // Add audio trimming and volume adjustment
      command += ` -filter_complex "[1:a]atrim=start=${audioStartTime}:end=${audioEndTime},volume=${audioVolumeFloat}[audio];`;
      
      // Handle original video audio
      if (muteOriginalAudio) {
        command += `[0:a]volume=0[video_audio];`;
      } else {
        command += `[0:a]volume=${videoVolumeFloat}[video_audio];`;
      }
      
      // Mix the audio tracks
      command += `[video_audio][audio]amix=inputs=2:duration=first[out]"`;
      
      // Output settings
      command += ` -map 0:v -map "[out]" -c:v copy -c:a aac -b:a 128k -shortest "${outputPath}"`;
      
      console.log('FFmpeg command:', command);
      
      // Execute ffmpeg command
      const session = await FFmpegKit.executeAsync(command);
      const returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        console.log('Audio mixing completed successfully');
        return outputPath;
      } else {
        const logs = await session.getLogs();
        const errorMessage = logs.map(log => log.getMessage()).join('\n');
        throw new Error(`FFmpeg failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error mixing audio with video:', error);
      throw new Error(`Failed to mix audio: ${error}`);
    }
  }

  /**
   * Extract audio from video for preview
   */
  static async extractAudioFromVideo(videoPath: string, outputPath: string): Promise<string> {
    try {
      const command = `-i "${videoPath}" -vn -acodec copy "${outputPath}"`;
      
      const session = await FFmpegKit.executeAsync(command);
      const returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        return outputPath;
      } else {
        throw new Error('Failed to extract audio from video');
      }
    } catch (error) {
      console.error('Error extracting audio:', error);
      throw error;
    }
  }

  /**
   * Get audio duration
   */
  static async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const command = `-i "${audioPath}" -f null -`;
      
      const session = await FFmpegKit.executeAsync(command);
      const logs = await session.getLogs();
      
      // Parse duration from ffmpeg output
      const durationMatch = logs
        .map(log => log.getMessage())
        .join('')
        .match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        return hours * 3600 + minutes * 60 + seconds;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0;
    }
  }

  /**
   * Create audio preview with volume adjustment
   */
  static async createAudioPreview(
    audioPath: string,
    outputPath: string,
    volume: number
  ): Promise<string> {
    try {
      const volumeFloat = volume / 100;
      const command = `-i "${audioPath}" -af "volume=${volumeFloat}" -c:a aac "${outputPath}"`;
      
      const session = await FFmpegKit.executeAsync(command);
      const returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        return outputPath;
      } else {
        throw new Error('Failed to create audio preview');
      }
    } catch (error) {
      console.error('Error creating audio preview:', error);
      throw error;
    }
  }
}
