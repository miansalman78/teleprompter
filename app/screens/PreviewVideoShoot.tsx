import { moderateScale } from "@/utils/scaling";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from "@react-navigation/native";
import { useEvent } from "expo";
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Dimensions, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StickerItem from "../../components/StickerItem";
import TextItem from "../../components/TextItem";
import VolumeControl from "../../components/VolumeControl";
import { AppColors } from "../../constants/Colors";
import { useVolume } from '../../contexts/VolumeContext';

// VideoEditor Components
import VideoEditingTools from "../../components/VideoEditor/VideoEditingTools";
import BottomToolbar from "../components/VideoEditor/BottomToolbar";
import StickerOverlay from "../components/VideoEditor/StickerOverlay";
import TextOverlay from "../components/VideoEditor/TextOverlay";
import TransitionOverlay from "../components/VideoEditor/TransitionOverlay";
import VideoTimeline from "../components/VideoEditor/VideoTimeline";

// Video Processing
import AudioProcessor, { AudioMixOptions, AudioTrack } from "../../utils/audioProcessor";
import VideoProcessor from "../../utils/videoProcessor";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PreviewVideoShoot = () => {
  const router = useRouter();
  const route = useRoute();
  const { videoUri: initialVideoUri } = (route.params || {}) as {
    videoUri?: string;
    orientation?: "portrait" | "landscape";
  };
  
  // Get global volume context
  const { getActualVolume, isMuted, volume, audioTrack, setAudioTrack, getActualAudioVolume } = useVolume();

  // Add videoUri state to manage the current video URI
  const [videoUri, setVideoUri] = useState<string | undefined>(initialVideoUri);
  const [isUploaded, setIsUploaded] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isDiscardConfirmed, setIsDiscardConfirmed] = useState(false);
  const [flaggedForUpload, setFlaggedForUpload] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'pending' | 'uploading' | 'completed' | 'failed'>('pending');
  const [currentVideoData, setCurrentVideoData] = useState<any>(null);
  const [showUploadToaster, setShowUploadToaster] = useState(false);

  // Video Editor States
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [activeEditorTool, setActiveEditorTool] = useState<'edit' | 'text' | 'stickers' | 'audio' | 'filters' | 'transitions' | null>(null);
  
  // Text Overlay States
  const [textOverlays, setTextOverlays] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    alignment: 'left' | 'center' | 'right';
    timestamp: number;
    isSelected?: boolean;
  }>>([]);

  // Audio States
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0.5);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  
  // Audio Player for background music
  const audioPlayerRef = useRef<Audio.Sound | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const [isAudioLoaded, setIsAudioLoaded] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [previousVideoTime, setPreviousVideoTime] = useState<number>(0);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [voicePlayerRef, setVoicePlayerRef] = useState<Audio.Sound | null>(null);
  const [isVoiceLoaded, setIsVoiceLoaded] = useState<boolean>(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(50);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Transition Effects State
  const [transitionEffects, setTransitionEffects] = useState<Array<{
    id: string;
    name: string;
    icon: string;
    timestamp: number;
    duration: number;
  }>>([]);
  const [activeTransition, setActiveTransition] = useState<{
    id: string;
    name: string;
    progress: number; // 0 to 1
  } | null>(null);

  // Sticker Overlay States
  const [stickerOverlays, setStickerOverlays] = useState<Array<{
    id: string;
    sticker: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    timestamp: number;
    isSelected: boolean;
  }>>([]);
  
  // Video Processing States
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [videoFrames, setVideoFrames] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  // Simulated trim bounds (in seconds, relative to original video)
  const [trimStartSec, setTrimStartSec] = useState<number>(0);
  const [trimEndSec, setTrimEndSec] = useState<number | null>(null);
  // Simulated non-destructive edit segments over the original video
  const [segments, setSegments] = useState<Array<{ start: number; end: number }>>([]);
  // UI state for split slider to let the editor remember selection across openings
  const [uiSplitTime, setUiSplitTime] = useState<number>(0);

  const getFullDuration = () => (videoMetadata?.duration || player?.duration || 0);

  const normalizeSegments = (list: Array<{ start: number; end: number }>) => {
    const merged = [...list]
      .map(s => ({ start: Math.max(0, s.start), end: Math.max(0, s.end) }))
      .filter(s => s.end > s.start)
      .sort((a, b) => a.start - b.start);
    const out: Array<{ start: number; end: number }> = [];
    for (const s of merged) {
      if (out.length === 0) { out.push(s); continue; }
      const last = out[out.length - 1];
      if (s.start <= last.end + 0.001) {
        last.end = Math.max(last.end, s.end);
      } else {
        out.push(s);
      }
    }
    return out;
  };

  const findSegmentIndexAt = (t: number) => {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (t >= seg.start && t <= seg.end) return i;
    }
    // If not inside, find next segment after t
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].start > t) return i;
    }
    return segments.length > 0 ? segments.length - 1 : -1;
  };

  const sumSegmentsDuration = () => segments.reduce((acc, s) => acc + (s.end - s.start), 0);

  const toVirtualTime = (absolute: number) => {
    let acc = 0;
    for (const s of segments) {
      if (absolute < s.start) break;
      if (absolute <= s.end) {
        return acc + (absolute - s.start);
      }
      acc += (s.end - s.start);
    }
    return acc;
  };

  const toAbsoluteTime = (virtual: number) => {
    let remaining = virtual;
    for (const s of segments) {
      const len = s.end - s.start;
      if (remaining <= len) return s.start + remaining;
      remaining -= len;
    }
    // If beyond, clamp to end of last segment
    if (segments.length > 0) return segments[segments.length - 1].end;
    return Math.max(0, Math.min(getFullDuration(), virtual));
  };

  const player = useVideoPlayer(videoUri || "", (player) => {
    player.loop = false;
    // Don't auto-play, let user control it
  });

  useEvent(player, 'statusChange', {
    status: player.status,
  });

  // Function to handle audio duration synchronization (optimized with debounce)
  const handleAudioDurationSync = async () => {
    if (!audioPlayerRef.current || !isAudioLoaded || !player || audioDuration === 0 || videoDuration === 0) {
      return;
    }

    // Debounce: only sync if enough time has passed since last sync
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 300) { // Minimum 300ms between syncs
      return;
    }
    lastSyncTimeRef.current = now;

    try {
      const audioStatus = await audioPlayerRef.current.getStatusAsync();
      if (!audioStatus.isLoaded || !audioStatus.isPlaying) return;

      const currentAudioTime = audioStatus.positionMillis! / 1000;
      const currentVideoTime = player.currentTime || 0;

      // If audio is longer than video, stop audio when video ends
      if (audioDuration >= videoDuration) {
        if (currentVideoTime >= videoDuration - 0.1) { // Stop slightly before end
          await audioPlayerRef.current.pauseAsync();
          console.log('Audio stopped at video end');
        }
      } else {
        // If video is longer than audio, loop the audio
        if (currentAudioTime >= audioDuration - 0.1) { // Loop slightly before end
          await audioPlayerRef.current.setPositionAsync(0);
          console.log('Audio looped back to start');
        }
      }
    } catch (error) {
      console.error('Error in audio duration sync:', error);
    }
  };

  // Function to handle voice recording duration synchronization
  const handleVoiceDurationSync = async () => {
    if (!voicePlayerRef || !isVoiceLoaded || !player || videoDuration === 0) {
      return;
    }

    try {
      const voiceStatus = await voicePlayerRef.getStatusAsync();
      if (!voiceStatus.isLoaded || !voiceStatus.isPlaying) return;

      const currentVoiceTime = voiceStatus.positionMillis! / 1000;
      const currentVideoTime = player.currentTime || 0;

      // Voice recording should match video duration exactly
      if (currentVideoTime >= videoDuration - 0.1) { // Stop slightly before end
        await voicePlayerRef.pauseAsync();
        console.log('Voice recording stopped at video end');
      }
    } catch (error) {
      console.error('Error in voice duration sync:', error);
    }
  };

  // Function to reset audio position when video is restarted
  const resetAudioPosition = async () => {
    if (audioPlayerRef.current && isAudioLoaded) {
      try {
        await audioPlayerRef.current.setPositionAsync(0);
        console.log('Audio position reset to start');
      } catch (error) {
        console.error('Error resetting audio position:', error);
      }
    }
  };

  // Function to reset voice recording position when video is restarted
  const resetVoicePosition = async () => {
    if (voicePlayerRef && isVoiceLoaded) {
      try {
        await voicePlayerRef.setPositionAsync(0);
        console.log('Voice recording position reset to start');
      } catch (error) {
        console.error('Error resetting voice recording position:', error);
      }
    }
  };

  // Function to update voice recording volume
  const updateVoiceVolume = async (newVolume: number) => {
    setVoiceVolume(newVolume);
    if (voicePlayerRef && isVoiceLoaded) {
      try {
        await voicePlayerRef.setVolumeAsync(newVolume / 100);
        console.log('Voice recording volume updated to:', newVolume);
      } catch (error) {
        console.error('Error updating voice recording volume:', error);
      }
    }
  };

  // Function to toggle voice recording mute
  const toggleVoiceMute = async () => {
    const newMutedState = !isVoiceMuted;
    setIsVoiceMuted(newMutedState);
    
    if (voicePlayerRef && isVoiceLoaded) {
      try {
        await voicePlayerRef.setVolumeAsync(newMutedState ? 0 : voiceVolume / 100);
        console.log('Voice recording mute toggled to:', newMutedState);
      } catch (error) {
        console.error('Error toggling voice recording mute:', error);
      }
    }
  };

  // Function to sync audio position with video position when seeking (optimized with debounce)
  const syncAudioPositionWithVideo = async () => {
    if (!audioPlayerRef.current || !isAudioLoaded || !player || audioDuration === 0 || videoDuration === 0) {
      return;
    }

    // Debounce: only sync if enough time has passed since last sync
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 500) { // Minimum 500ms between seeks
      return;
    }
    lastSyncTimeRef.current = now;

    try {
      const currentVideoTime = player.currentTime || 0;
      let targetAudioTime = currentVideoTime;

      // If video is longer than audio, calculate the correct audio position within the loop
      if (videoDuration > audioDuration) {
        targetAudioTime = currentVideoTime % audioDuration;
      } else {
        // If audio is longer than video, clamp to audio duration
        targetAudioTime = Math.min(currentVideoTime, audioDuration);
      }

      await audioPlayerRef.current.setPositionAsync(targetAudioTime * 1000);
      console.log(`Audio synced to video position: ${targetAudioTime.toFixed(1)}s`);
    } catch (error) {
      console.error('Error syncing audio position with video:', error);
    }
  };

  // Sync audio player with video playback
  useEffect(() => {
    const syncAudioWithVideo = async () => {
      if (audioPlayerRef.current && isAudioLoaded && player) {
        try {
          const isPlaying = player.playing;
          setIsVideoPlaying(isPlaying);
          
          if (isPlaying) {
            await audioPlayerRef.current.playAsync();
            console.log('Audio started playing with video');
          } else {
            await audioPlayerRef.current.pauseAsync();
            console.log('Audio paused with video');
          }
        } catch (error) {
          console.error('Error syncing audio with video:', error);
        }
      }

      // Sync voice recording with video playback
      if (voicePlayerRef && isVoiceLoaded && player) {
        try {
          const isPlaying = player.playing;
          
          if (isPlaying) {
            await voicePlayerRef.playAsync();
            console.log('Voice recording started playing with video');
          } else {
            await voicePlayerRef.pauseAsync();
            console.log('Voice recording paused with video');
          }
        } catch (error) {
          console.error('Error syncing voice recording with video:', error);
        }
      }
    };

    syncAudioWithVideo();
  }, [player?.playing, isAudioLoaded, isVoiceLoaded]);

  // Monitor audio duration synchronization while playing (optimized)
  useEffect(() => {
    if (!isVideoPlaying || !isAudioLoaded || audioDuration === 0 || videoDuration === 0) {
      return;
    }

    const syncInterval = setInterval(() => {
      handleAudioDurationSync();
    }, 500); // Reduced frequency to 500ms to prevent lag

    return () => clearInterval(syncInterval);
  }, [isVideoPlaying, isAudioLoaded, audioDuration, videoDuration]);

  // Monitor voice recording duration synchronization while playing
  useEffect(() => {
    if (!isVideoPlaying || !isVoiceLoaded || videoDuration === 0) {
      return;
    }

    const syncInterval = setInterval(() => {
      handleVoiceDurationSync();
    }, 500); // Same frequency as audio sync

    return () => clearInterval(syncInterval);
  }, [isVideoPlaying, isVoiceLoaded, videoDuration]);

  // Reset audio position when video is restarted (optimized)
  useEffect(() => {
    if (player && isAudioLoaded && currentTime < 1) { // Video restarted (near beginning)
      resetAudioPosition();
    }
    if (player && isVoiceLoaded && currentTime < 1) { // Video restarted (near beginning)
      resetVoicePosition();
    }
  }, [currentTime, isAudioLoaded, isVoiceLoaded]);

  // Sync audio position when video is seeked (optimized - only on significant changes)
  useEffect(() => {
    if (isVideoPlaying && isAudioLoaded && audioDuration > 0 && videoDuration > 0) {
      // Only sync on significant time changes to prevent excessive operations
      const timeDiff = Math.abs(currentTime - (previousVideoTime || 0));
      if (timeDiff > 1.0) { // Increased threshold to 1 second to reduce sync frequency
        syncAudioPositionWithVideo();
        setPreviousVideoTime(currentTime);
      }
    }
  }, [currentTime, isVideoPlaying, isAudioLoaded, audioDuration, videoDuration]);

  // Set up audio mode for better control
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        });
        console.log('Audio mode set successfully');
      } catch (error) {
        console.log('Failed to set audio mode:', error);
      }
    };
    setupAudio();
  }, []);

  // Control video player volume using global volume context
  useEffect(() => {
    if (player) {
      const actualVolume = getActualVolume();
      console.log('Setting global volume to:', actualVolume, 'muted:', isMuted);
      
      // Try to set volume and muted as properties
      try {
        (player as any).volume = actualVolume;
        console.log('Set volume via property to:', actualVolume);
      } catch (error) {
        console.log('Failed to set volume:', error);
      }
      
      try {
        (player as any).muted = isMuted;
        console.log('Set muted via property to:', isMuted);
      } catch (error) {
        console.log('Failed to set muted:', error);
      }
    }
  }, [player, getActualVolume, isMuted]);

  // Control audio player volume when context changes
  useEffect(() => {
    const updateAudioVolume = async () => {
      if (audioPlayerRef.current && isAudioLoaded) {
        try {
          const actualVolume = getActualAudioVolume();
          console.log('Setting audio player volume to:', actualVolume);
          await audioPlayerRef.current.setVolumeAsync(actualVolume);
        } catch (error) {
          console.error('Error setting audio volume:', error);
        }
      }
    };

    updateAudioVolume();
  }, [getActualAudioVolume, isAudioLoaded]);

  // Cleanup audio player on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.unloadAsync().catch(console.error);
      }
      if (voicePlayerRef) {
        voicePlayerRef.unloadAsync().catch(console.error);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);

  // Update currentTime based on player's currentTime property
  useEffect(() => {
    const interval = setInterval(() => {
      if (player && typeof player.currentTime === 'number') {
        let playerTime = Math.round(player.currentTime * 10) / 10; // Round to 1 decimal place
        // Enforce playback within trimmed region and loop back to start when reaching the end
        const fullDuration = getFullDuration();

        if (segments.length > 0) {
          const idx = findSegmentIndexAt(playerTime);
          if (idx === -1) {
            // Jump to first segment start if outside all
            const start0 = segments[0].start;
            console.log('Player outside segments, jumping to first segment start:', start0);
            player.currentTime = start0;
            playerTime = start0;
          } else {
            const seg = segments[idx];
            if (playerTime < seg.start) {
              console.log('Player before segment start, jumping to segment start:', seg.start);
              player.currentTime = seg.start;
              playerTime = seg.start;
            } else if (playerTime >= seg.end - 0.05) {
              // Advance to next segment or loop to first
              const nextIdx = idx + 1 < segments.length ? idx + 1 : 0;
              const nextStart = segments[nextIdx].start;
              console.log('Player reached segment end, advancing to next segment:', nextStart);
              player.currentTime = nextStart;
              playerTime = nextStart;
            }
          }
        } else {
          const startBound = trimStartSec || 0;
          const endBound = (trimEndSec ?? fullDuration);
          const hasValidTrim = endBound > startBound;
          if (!Number.isNaN(startBound) && playerTime < startBound) {
            player.currentTime = startBound;
            playerTime = startBound;
          }
          if (hasValidTrim && endBound && playerTime >= endBound - 0.05) {
            player.currentTime = startBound;
            playerTime = startBound;
          }
        }
        const stateTime = Math.round(currentTime * 10) / 10;
        
        if (Math.abs(playerTime - stateTime) > 0.1) { // Only update if difference is significant
          setCurrentTime(playerTime);
        }

        // Check for active transitions
        const currentTransition = transitionEffects.find(effect => {
          const startTime = effect.timestamp;
          const endTime = effect.timestamp + effect.duration;
          return playerTime >= startTime && playerTime <= endTime;
        });

        if (currentTransition) {
          const progress = (playerTime - currentTransition.timestamp) / currentTransition.duration;
          setActiveTransition({
            id: currentTransition.id,
            name: currentTransition.name,
            progress: Math.max(0, Math.min(1, progress))
          });
        } else {
          setActiveTransition(null);
        }
      }
    }, 100); // Update every 100ms for smooth timeline movement

    return () => clearInterval(interval);
  }, [player, trimStartSec, trimEndSec, videoMetadata?.duration, segments, transitionEffects]); // Include segments and transitionEffects

  useEffect(() => {
    loadVideoData();
    processVideoData();
    
    // Auto-initialize trim to full video duration (same as clicking trim "Done" button)
    if (videoUri) {
      setTimeout(() => {
        initializeVideoTrim();
      }, 1000); // Small delay to ensure video metadata is loaded
    }
  }, [videoUri]);

  const initializeVideoTrim = async () => {
    const full = videoMetadata?.duration || player?.duration || 0;
    if (full > 0) {
      const start = 0;
      const end = full;
      setTrimStartSec(start);
      setTrimEndSec(end);
      setSegments(normalizeSegments([{ start, end }]));
      if (player) {
        player.currentTime = start;
      }
      console.log('Auto-initialized video trim:', { start, end, full });
    }
  };

  const loadVideoData = async () => {
    try {
      const savedVideos = await AsyncStorage.getItem('saved_videos');
      if (savedVideos) {
        const videos = JSON.parse(savedVideos);
        const currentVideo = videos.find((video: any) => video.uri === videoUri);
        if (currentVideo) {
          setCurrentVideoData(currentVideo);
          setFlaggedForUpload(currentVideo.flaggedForUpload || false);
          setUploadStatus(currentVideo.uploaded ? 'completed' : 'pending');
        }
      }
    } catch (error) {
      console.error('Error loading video data:', error);
    }
  };

  const processVideoData = async () => {
    if (!videoUri) return;
    
    setIsLoadingVideo(true);
    try {
      // Extract video metadata
      console.log('Processing video data for URI:', videoUri);
      const metadata = await VideoProcessor.getVideoMetadata(videoUri);
      console.log('Video metadata loaded:', metadata);
      setVideoMetadata(metadata);
      // Initialize segments to full video on load
      setTrimStartSec(0);
      setTrimEndSec(metadata.duration || 0);
      const d = metadata.duration || 0;
      setSegments([{ start: 0, end: d }]);
      setUiSplitTime(d > 0 ? d / 2 : 0);
      
      // Auto-initialize trim (same as clicking trim "Done" button)
      setTimeout(() => {
        initializeVideoTrim();
      }, 500);
      
      // Calculate frame count based on video duration (1 frame per second, minimum 8 frames)
      const frameCount = Math.max(8, Math.ceil(metadata.duration));
      console.log(`Video duration: ${metadata.duration}s, calculated frameCount: ${frameCount}`);
      
      // Extract video frames for timeline thumbnails
      console.log(`Starting frame extraction with frameCount: ${frameCount}`);
      console.log('Video URI for frame extraction:', videoUri);
      const frames = await VideoProcessor.extractVideoFrames(videoUri, frameCount);
      console.log('Frames extracted:', frames.length, 'frames');
      console.log('Sample frame data:', frames[0]);
      
      if (frames.length === 0) {
        console.warn('No frames were extracted from the video!');
      }
      
      // Debug: Check each frame's thumbnail data
      frames.forEach((frame, index) => {
        console.log(`Frame ${index}:`, {
          id: frame.id,
          time: frame.time,
          hasThumbnail: !!frame.thumbnail,
          thumbnailLength: frame.thumbnail ? frame.thumbnail.length : 0,
          thumbnailType: frame.thumbnail ? (frame.thumbnail.startsWith('data:') ? 'base64' : 'uri') : 'empty'
        });
      });
      
      // Convert frames to string array for VideoTimeline
      const frameUris = frames.map(frame => frame.thumbnail);
      console.log('Frame URIs for VideoTimeline:', frameUris.length, 'items');
      console.log('Non-empty frame URIs:', frameUris.filter(uri => uri && uri.trim() !== '').length);
      
      // Set frames even if empty - this will show the loading state
      setVideoFrames(frameUris);
      
      if (frameUris.length === 0 || frameUris.every(uri => !uri || uri.trim() === '')) {
        console.warn('No valid frame URIs generated. Timeline will show without thumbnails.');
      }
      
    } catch (error) {
      console.error('Error processing video:', error);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const toggleUploadFlag = async () => {
    try {
      const savedVideos = await AsyncStorage.getItem('saved_videos');
      if (savedVideos) {
        const videos = JSON.parse(savedVideos);
        const updatedVideos = videos.map((video: any) => {
          if (video.uri === videoUri) {
            return { ...video, flaggedForUpload: !flaggedForUpload };
          }
          return video;
        });
        await AsyncStorage.setItem('saved_videos', JSON.stringify(updatedVideos));
        setFlaggedForUpload(!flaggedForUpload);
      }
    } catch (error) {
      console.error('Error updating upload flag:', error);
    }
  };

  const simulateUpload = async () => {
    if (!flaggedForUpload) return;
    
    setUploadStatus('uploading');
    
    // Simulate upload process
    setTimeout(async () => {
      try {
        const savedVideos = await AsyncStorage.getItem('saved_videos');
        if (savedVideos) {
          const videos = JSON.parse(savedVideos);
          const updatedVideos = videos.map((video: any) => {
            if (video.uri === videoUri) {
              return { ...video, uploaded: true, uploadedAt: new Date().toISOString() };
            }
            return video;
          });
          await AsyncStorage.setItem('saved_videos', JSON.stringify(updatedVideos));
          setUploadStatus('completed');
        }
      } catch (error) {
        console.error('Error updating upload status:', error);
        setUploadStatus('failed');
      }
    }, 3000); // 3 second simulated upload
  };

  const handleApprove = async () => {
    if (!videoUri) return;

    setIsUploaded(true);
    setUploadStatus('uploading');

    try {
      // Simulate upload process with proper status updates
      setTimeout(async () => {
        try {
          const savedVideos = await AsyncStorage.getItem('saved_videos');
          if (savedVideos) {
            const videos = JSON.parse(savedVideos);
            const updatedVideos = videos.map((video: any) => {
              if (video.uri === videoUri) {
                return { ...video, uploaded: true, uploadedAt: new Date().toISOString() };
              }
              return video;
            });
            await AsyncStorage.setItem('saved_videos', JSON.stringify(updatedVideos));
            setUploadStatus('completed');
            console.log("✅ Video uploaded successfully");
          }
        } catch (error) {
          console.error('Error updating upload status:', error);
          setUploadStatus('failed');
          setIsUploaded(false);
        }
      }, 3000); // 3 second simulated upload

    } catch (error) {
      console.error("Video upload failed:", error);
      setUploadStatus('failed');
      setIsUploaded(false);
    }
  };

  const handleDiscard = () => {
    setShowDiscardModal(true);
    setIsDiscardConfirmed(false);
  };

  const confirmDiscard = async () => {
    if (videoUri) {
      try {
        await FileSystem.deleteAsync(videoUri, { idempotent: true });
        console.log("✅ Video discarded successfully");
      } catch (e) {
        console.warn("Failed to delete video:", e);
      }
    }
    setIsDiscardConfirmed(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.replace("/");
  };

  const handleDiscardModalClose = () => {
    setShowDiscardModal(false);
    if (isDiscardConfirmed) {
      router.replace("/screens/videoShoot");
    }
  };

  // Video Editor Functions
  const openVideoEditor = (tool: 'edit' | 'text' | 'stickers' | 'audio' | 'filters' | 'transitions') => {
    setActiveEditorTool(tool);
    setShowVideoEditor(true);
  };

  const closeVideoEditor = () => {
    setShowVideoEditor(false);
    setActiveEditorTool(null);
  };

  const handleVideoEdit = async (action: string, data: any) => {
    console.log('Video edit action:', action, data);
    
    if (!videoUri) {
      Alert.alert('Error', 'No video selected for editing');
      return;
    }
    
    try {
      const outputDir = `${FileSystem.documentDirectory}edited_videos/`;
      await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });
      const timestamp = Date.now();
      
      switch (action) {
        case 'trim':
          console.log('Trimming video...');
          // Implement video trimming with FFmpeg
          const trimCommand = `-y -i "${videoUri}" -ss 0 -t 30 -c copy "${outputDir}trimmed_${timestamp}.mp4"`;
          await executeFFmpegCommand(trimCommand, 'Video trimmed successfully');
          break;
          
        case 'addText':
          console.log('Adding text overlay:', data.text);
          const textCommand = `-y -i "${videoUri}" -vf "drawtext=text='${data.text || 'Sample Text'}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" "${outputDir}text_${timestamp}.mp4"`;
          await executeFFmpegCommand(textCommand, 'Text added successfully');
          setActiveEditorTool('text');
          break;
          
        case 'audioChange':
          if (data.type === 'addMusic') {
            console.log('Adding background music:', data.data);
            setIsProcessingAudio(true);
            
            try {
              // data.data is now the complete track object from AudioEditor
              const selectedTrack = data.data;
              
              if (selectedTrack && selectedTrack.id && selectedTrack.name) {
                setSelectedAudioTrack(selectedTrack);
                
                // Mix audio with video using AudioProcessor
                const mixOptions: AudioMixOptions = {
                  volume: audioVolume,
                  startTime: 0,
                  fadeIn: 2, // 2 second fade in
                  fadeOut: 2 // 2 second fade out
                };
                
                const outputPath = await AudioProcessor.mixAudioWithVideo(
                  videoUri,
                  selectedTrack,
                  mixOptions
                );
                
                if (outputPath) {
                  // Update video URI to the new mixed version
                  setVideoUri(outputPath);
                  Alert.alert(
                    'Success', 
                    `Music "${selectedTrack.name}" has been added to your video successfully!`,
                    [{ text: 'OK' }]
                  );
                } else {
                  throw new Error('Failed to mix audio with video');
                }
              } else {
                Alert.alert('Error', 'Invalid music track selected');
              }
            } catch (error) {
              console.error('Error adding music:', error);
              Alert.alert(
                'Error',
                'Failed to add music to video. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsProcessingAudio(false);
            }
          } else if (data.type === 'volume') {
            console.log('Adjusting volume to:', data.volume);
            const newVolume = data.volume || 1.0;
            setAudioVolume(newVolume);
            
            // If there's a selected track, re-mix with new volume
            if (selectedAudioTrack) {
              setIsProcessingAudio(true);
              try {
                const mixOptions: AudioMixOptions = {
                  volume: newVolume,
                    startTime: 0,
                  fadeIn: 2,
                    fadeOut: 2
                };
                
                const outputPath = await AudioProcessor.mixAudioWithVideo(
                  videoUri,
                  selectedAudioTrack,
                  mixOptions
                );
                
                if (outputPath) {
                  setVideoUri(outputPath);
                  Alert.alert(
                    'Success',
                    `Volume adjusted to ${Math.round(newVolume * 100)}%`,
                    [{ text: 'OK' }]
                  );
                }
              } catch (error) {
                console.error('Error adjusting volume:', error);
                Alert.alert('Error', 'Failed to adjust volume');
              } finally {
                setIsProcessingAudio(false);
              }
            } else {
              Alert.alert(
                'Success',
                `Volume set to ${Math.round(newVolume * 100)}%. This will be applied when you add music.`,
                [{ text: 'OK' }]
              );
            }
          } else if (data.type === 'importMusic') {
            console.log('Importing music from device...');
            setIsProcessingAudio(true);
            
            try {
              const importedTrack = await AudioProcessor.importAudioFromDevice();
              if (importedTrack) {
                setSelectedAudioTrack(importedTrack);
                
                const mixOptions: AudioMixOptions = {
                  volume: audioVolume,
                startTime: 0,
                  fadeIn: 1,
                  fadeOut: 1,
                };
                
                const outputPath = await AudioProcessor.mixAudioWithVideo(
                  videoUri,
              importedTrack,
                  mixOptions
                );
                
                if (outputPath) {
                  setVideoUri(outputPath);
                  Alert.alert(
                    'Success',
                    `Imported music "${importedTrack.name}" has been added to your video!`,
                    [{ text: 'OK' }]
                  );
                }
              }
            } catch (error) {
              console.error('Error importing music:', error);
              Alert.alert('Error', 'Failed to import music from device');
            } finally {
              setIsProcessingAudio(false);
            }
          } else if (data.type === 'addEffect') {
            console.log('Adding sound effect:', data);
            setIsProcessingAudio(true);
            
            try {
              const effectTracks = await AudioProcessor.getAudioTracksByCategory('effects');
              const selectedEffect = effectTracks.find(track => track.name === data) || effectTracks[0];
              
              if (selectedEffect) {
                
                const mixOptions: AudioMixOptions = {
                  volume: audioVolume,
                  startTime: 0,
                  fadeIn: 0.1,
                  fadeOut: 0.1
                };
                
                const outputPath = await AudioProcessor.mixAudioWithVideo(
                  videoUri,
                  selectedEffect,
                  mixOptions
                );
                
                if (outputPath) {
                  setVideoUri(outputPath);
                  Alert.alert(
                    'Success',
                    `Sound effect "${selectedEffect.name}" added successfully!`,
                    [{ text: 'OK' }]
                  );
                }
              }
            } catch (error) {
              console.error('Error adding sound effect:', error);
              Alert.alert('Error', 'Failed to add sound effect');
            } finally {
              setIsProcessingAudio(false);
            }
          } else if (data.type === 'startRecording') {
            Alert.alert(
              'Voice Recording',
              'Voice recording started! This feature would record your voice-over.',
              [{ text: 'OK' }]
            );
          } else if (data.type === 'stopRecording') {
            Alert.alert(
              'Voice Recording',
              'Voice recording stopped and added to video!',
              [{ text: 'OK' }]
            );
          } else if (data.type === 'extractAudio') {
            console.log('Extracting audio from video...');
            setIsProcessingAudio(true);
            
            try {
              const extractedAudioPath = await AudioProcessor.extractAudioFromVideo(videoUri);
              if (extractedAudioPath) {
                Alert.alert(
                  'Success',
                  'Audio extracted from video successfully! You can now use it in other projects.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Error extracting audio:', error);
              Alert.alert('Error', 'Failed to extract audio from video');
            } finally {
              setIsProcessingAudio(false);
            }
          }
          setActiveEditorTool('audio');
          break;
          
        case 'applyFilter':
          console.log('Applying filter:', data.filter);
          let filterCommand = '';
          switch (data.filter) {
            case 'blur':
              filterCommand = `-y -i "${videoUri}" -vf "boxblur=2:1" "${outputDir}blur_${timestamp}.mp4"`;
              break;
            case 'brightness':
              filterCommand = `-y -i "${videoUri}" -vf "eq=brightness=0.3" "${outputDir}bright_${timestamp}.mp4"`;
              break;
            default:
              filterCommand = `-y -i "${videoUri}" -vf "hue=s=1.5" "${outputDir}filter_${timestamp}.mp4"`;
          }
          await executeFFmpegCommand(filterCommand, 'Filter applied successfully');
          setActiveEditorTool('filters');
          break;
          
        case 'rotate':
          console.log('Rotating video...');
          const rotateCommand = `-y -i "${videoUri}" -vf "transpose=1" "${outputDir}rotated_${timestamp}.mp4"`;
          await executeFFmpegCommand(rotateCommand, 'Video rotated successfully');
          break;
          
        case 'speed':
          console.log('Changing video speed to:', data.speed);
          const speedValue = data.speed || 1.0;
          const speedCommand = `-y -i "${videoUri}" -filter:v "setpts=${1/speedValue}*PTS" -filter:a "atempo=${speedValue}" "${outputDir}speed_${timestamp}.mp4"`;
          await executeFFmpegCommand(speedCommand, 'Video speed changed successfully');
          break;

        case 'addSticker':
          console.log('Adding sticker overlay:', data.sticker, 'size:', data.size);
          // Add sticker to overlay state instead of FFmpeg processing
          const newSticker: { id: string; sticker: string; x: number; y: number; size: number; rotation: number; timestamp: number; isSelected: boolean } = {
            id: `sticker_${Date.now()}`,
            sticker: data.sticker,
            x: 50, // Default position
            y: 50,
            size: data.size || 40,
            rotation: 0,
            timestamp: currentTime,
            isSelected: false,
          };
          setStickerOverlays(prev => [...prev, newSticker]);
          setActiveEditorTool('stickers');
          Alert.alert('Success', 'Sticker added successfully!');
          break;
          
        default:
          console.log('Video edit action:', action, 'is not yet implemented');
          Alert.alert('Info', `${action} feature is coming soon!`);
      }
    } catch (error) {
      console.error('Error processing video edit:', error);
      Alert.alert('Error', 'Failed to process video. Please try again.');
    }
  };

  const executeFFmpegCommand = async (command: string, successMessage: string) => {
    try {
      console.log('Executing FFmpeg command:', command);
      
      return new Promise((resolve, reject) => {
        FFmpegKit.executeAsync(
          command,
          async (session) => {
            try {
              if (!session) {
                console.error('FFmpeg session is null');
                Alert.alert('Error', 'Video processing failed.');
                reject(new Error('FFmpeg session is null'));
                return;
              }
              const returnCode = await session.getReturnCode();
              if (ReturnCode.isSuccess(returnCode)) {
                Alert.alert('Success', successMessage);
                console.log('FFmpeg command executed successfully');
                resolve(true);
              } else {
                const code = returnCode?.getValue();
                console.error('FFmpeg failed with return code:', code);
                Alert.alert('Error', `Video processing failed (code ${code}).`);
                reject(new Error(`FFmpeg failed with code ${code}`));
              }
            } catch (sessionError) {
              console.error('Error in FFmpeg session callback:', sessionError);
              Alert.alert('Error', 'Video processing failed.');
              reject(sessionError);
            }
          },
          (log) => {
            try { console.log('FFmpeg log:', log?.getMessage?.()); } catch {}
          },
          (statistics) => {
            try { console.log('FFmpeg statistics:', statistics); } catch {}
          }
        );
      });
      
    } catch (error) {
      console.error('FFmpeg execution error:', error);
      Alert.alert('Error', 'Video processing failed.');
      return Promise.resolve(true);
    }
  };

  const handleTextAdd = (text: string, style: any) => {
    console.log('Adding text:', text, style);
    
    // Create a new text overlay
    const newOverlay = {
      id: Date.now().toString(),
      text: text || 'Sample Text',
      x: SCREEN_WIDTH * 0.1, // 10% from left
      y: moderateScale(100), // 100px from top
      fontSize: style?.fontSize || 24,
      color: style?.color || '#FFFFFF',
      fontFamily: style?.fontFamily || 'System',
      alignment: style?.alignment || 'center' as 'left' | 'center' | 'right',
      timestamp: currentTime,
      isSelected: false,
    };
    
    // Add the overlay to the state
    setTextOverlays(prev => [...prev, newOverlay]);
    
    // Show text overlay editor
    setActiveEditorTool('text');
    
    // Show success message
    Alert.alert('Success', 'Text overlay added to video!');
  };

  const handleStickerAdd = (sticker: string, size: number) => {
    console.log('Adding sticker:', sticker, size);
    // Show sticker overlay editor
    setActiveEditorTool('stickers');
    handleVideoEdit('addSticker', { sticker, size });
  };

  const handleStickerSelect = (stickerId: string) => {
    setStickerOverlays(prev => 
      prev.map(sticker => ({
        ...sticker,
        isSelected: sticker.id === stickerId ? !sticker.isSelected : false
      }))
    );
  };

  const handleStickerRemove = (stickerId: string) => {
    Alert.alert(
      'Remove Sticker',
      'Are you sure you want to remove this sticker?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setStickerOverlays(prev => prev.filter(sticker => sticker.id !== stickerId));
            Alert.alert('Success', 'Sticker removed successfully!');
          }
        }
      ]
    );
  };

  const handleStickerPositionUpdate = (stickerId: string, x: number, y: number) => {
    setStickerOverlays(prev => 
      prev.map(sticker => 
        sticker.id === stickerId 
          ? { ...sticker, x, y }
          : sticker
      )
    );
  };

  const handleStickerResize = (stickerId: string, newSize: number) => {
    setStickerOverlays(prev => 
      prev.map(sticker => 
        sticker.id === stickerId 
          ? { ...sticker, size: Math.max(20, Math.min(100, newSize)) } // Limit size between 20-100
          : sticker
      )
    );
  };

  // Text Overlay Helper Functions
  const handleTextSelect = (textId: string) => {
    setTextOverlays(prev => 
      prev.map(text => ({
        ...text,
        isSelected: text.id === textId ? !text.isSelected : false
      }))
    );
  };

  const handleTextRemove = (textId: string) => {
    Alert.alert(
      'Remove Text',
      'Are you sure you want to remove this text overlay?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setTextOverlays(prev => prev.filter(text => text.id !== textId));
          }
        }
      ]
    );
  };

  const handleTextPositionUpdate = (textId: string, x: number, y: number) => {
    setTextOverlays(prev => 
      prev.map(text => 
        text.id === textId 
          ? { ...text, x, y }
          : text
      )
    );
  };

  const handleTextResize = (textId: string, newFontSize: number) => {
    setTextOverlays(prev => 
      prev.map(text => 
        text.id === textId 
          ? { ...text, fontSize: Math.max(12, Math.min(72, newFontSize)) } // Limit font size between 12-72
          : text
      )
    );
  };

  const handleFilterApply = (filter: string, intensity: number) => {
    console.log('Applying filter:', filter, intensity);
    // Show filter overlay editor
    setActiveEditorTool('filters');
    handleVideoEdit('applyFilter', { filter, intensity });
  };

  const handleAudioChange = (type: string, data: any) => {
    console.log('Audio change:', type, data);
    // Show audio editor and process the audio change
    setActiveEditorTool('audio');
    
    // Handle different audio operations
    if (type === 'addMusic') {
      handleVideoEdit('audioChange', { type: 'addMusic', data });
    } else if (type === 'volume') {
      handleVideoEdit('audioChange', { type: 'volume', volume: data });
    } else if (type === 'mute') {
      handleVideoEdit('audioChange', { type: 'volume', volume: data ? 0 : 1 });
    } else {
      handleVideoEdit('audioChange', { type, data });
    }
  };


  const handleTransitionAdd = (transitionEffect: {
    id: string;
    name: string;
    icon: string;
    timestamp: number;
    duration: number;
  }) => {
    console.log('Adding transition effect:', transitionEffect);
    setTransitionEffects(prev => [...prev, transitionEffect]);
  };

  const handleTransitionRemove = (transitionId: string) => {
    console.log('Removing transition:', transitionId);
    setTransitionEffects(prev => prev.filter(t => t.id !== transitionId));
  };

  const getTransitionStyle = (transition: { name: string; progress: number }) => {
    const { name, progress } = transition;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    switch (name) {
      case 'fade':
        // Complete black screen, then fade back to video
        if (progress < 0.5) {
          // First half: fade to black
          return {
            backgroundColor: `rgba(0, 0, 0, ${progress * 2})`,
          };
        } else {
          // Second half: fade back from black
          return {
            backgroundColor: `rgba(0, 0, 0, ${2 - progress * 2})`,
          };
        }
      case 'slide-left':
        // Complete slide from right to left
        if (progress < 0.5) {
          // First half: black screen
          return {
            backgroundColor: 'rgba(0, 0, 0, 1)',
          };
        } else {
          // Second half: slide video in from right
          const slideProgress = (progress - 0.5) * 2;
          return {
            backgroundColor: 'rgba(0, 0, 0, 1)',
            transform: [{ translateX: screenWidth * (1 - slideProgress) }],
          };
        }
      case 'slide-right':
        // Complete slide from left to right
        if (progress < 0.5) {
          return {
            backgroundColor: 'rgba(0, 0, 0, 1)',
          };
        } else {
          const slideProgress = (progress - 0.5) * 2;
          return {
            backgroundColor: 'rgba(0, 0, 0, 1)',
            transform: [{ translateX: -screenWidth * (1 - slideProgress) }],
          };
        }
      case 'slide-up':
        // Complete slide from bottom to top
        if (progress < 0.5) {
          return {
            backgroundColor: 'rgba(0, 0, 0, 1)',
          };
        } else {
          const slideProgress = (progress - 0.5) * 2;
          return {
            backgroundColor: 'rgba(0, 0, 0, 1)',
            transform: [{ translateY: screenHeight * (1 - slideProgress) }],
          };
        }
      case 'slide-down':
        // Complete slide from top to bottom
        if (progress < 0.5) {
          return {
            backgroundColor: 'rgba(0, 0, 0, 1)',
          };
        } else {
          const slideProgress = (progress - 0.5) * 2;
          return {
            backgroundColor: 'rgba(0, 0, 0, 1)',
            transform: [{ translateY: -screenHeight * (1 - slideProgress) }],
          };
        }
      case 'zoom-in':
        // Dramatic zoom in effect
        if (progress < 0.3) {
          return {
            backgroundColor: 'rgba(0, 0, 0, 1)',
          };
        } else {
          const zoomProgress = (progress - 0.3) / 0.7;
          return {
            backgroundColor: `rgba(0, 0, 0, ${1 - zoomProgress})`,
            transform: [{ scale: 0.1 + zoomProgress * 0.9 }],
          };
        }
      case 'zoom-out':
        // Dramatic zoom out effect
        return {
          backgroundColor: `rgba(0, 0, 0, ${progress * 0.8})`,
          transform: [{ scale: 1 + progress * 2 }],
        };
      case 'spin':
        // Complete 360 degree spin with black background
        return {
          backgroundColor: `rgba(0, 0, 0, ${Math.sin(progress * Math.PI) * 0.8})`,
          transform: [{ rotate: `${progress * 720}deg` }], // Double spin for more dramatic effect
        };
      case 'blur':
        // Simulate blur with white overlay and scale
        return {
          backgroundColor: `rgba(255, 255, 255, ${Math.sin(progress * Math.PI) * 0.6})`,
          transform: [{ scale: 1 + Math.sin(progress * Math.PI) * 0.1 }],
        };
      default:
        return {
          backgroundColor: `rgba(0, 0, 0, ${progress})`,
        };
    }
  };

  const handleAudioRemoved = async () => {
    try {
      // Clean up audio player
      if (audioPlayerRef.current) {
        await audioPlayerRef.current.unloadAsync();
        audioPlayerRef.current = null;
      }
      
      setIsAudioLoaded(false);
      setAudioTrack(null);
      setSelectedAudioTrack(null);
      Alert.alert('Success', 'Background music removed successfully!');
    } catch (error) {
      console.error('Error removing audio:', error);
      Alert.alert('Error', 'Failed to remove background music');
    }
  };

  // Voice Recording Functions
  const startVoiceRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is required for voice recording');
        return;
      }

      // Set up audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });

      // Create recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      recordingRef.current = recording;
      await recording.startAsync();
      setIsRecording(true);

      // Auto-stop recording when video duration is reached
      const videoDuration = getFullDuration();
      if (videoDuration > 0) {
        setTimeout(async () => {
          if (isRecording) {
            await stopVoiceRecording();
          }
        }, videoDuration * 1000);
      }

      console.log('Voice recording started');
    } catch (error) {
      console.error('Error starting voice recording:', error);
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const stopVoiceRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        setRecordedAudioUri(uri);
        
        // Load the recorded audio
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          {
            shouldPlay: false,
            volume: voiceVolume / 100,
            isLooping: false,
          }
        );

        setVoicePlayerRef(sound);
        setIsVoiceLoaded(true);
        setIsRecording(false);
        recordingRef.current = null;

        console.log('Voice recording completed:', uri);
        Alert.alert('Success', 'Voice recording completed successfully!');
      }
    } catch (error) {
      console.error('Error stopping voice recording:', error);
      Alert.alert('Error', 'Failed to stop voice recording');
      setIsRecording(false);
    }
  };

  const deleteVoiceRecording = async () => {
    try {
      if (voicePlayerRef) {
        await voicePlayerRef.unloadAsync();
        setVoicePlayerRef(null);
      }
      
      if (recordedAudioUri) {
        await FileSystem.deleteAsync(recordedAudioUri, { idempotent: true });
        setRecordedAudioUri(null);
      }
      
      setIsVoiceLoaded(false);
      setIsRecording(false);
      Alert.alert('Success', 'Voice recording deleted successfully!');
    } catch (error) {
      console.error('Error deleting voice recording:', error);
      Alert.alert('Error', 'Failed to delete voice recording');
    }
  };

  const handleAudioAdded = async (audioUri: string, audioName: string) => {
    if (!videoUri) {
      Alert.alert('Error', 'No video loaded to add audio to');
      return;
    }

    setIsProcessingAudio(true);
    try {
      // Create audio track object for the context
      const newAudioTrack = {
        id: Date.now().toString(),
        name: audioName,
        uri: audioUri,
      };

      // Set the audio track in context
      setAudioTrack(newAudioTrack);

      console.log('Loading audio file:', { audioUri, audioName });
      
      // Get video duration
      const currentVideoDuration = getFullDuration();
      console.log('Video duration:', currentVideoDuration);
      
      // Load the audio file using expo-av
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: false,
          volume: getActualAudioVolume(),
          isLooping: false, // We'll handle looping manually based on duration
        }
      );

      // Get audio duration
      const audioStatus = await sound.getStatusAsync();
      const currentAudioDuration = audioStatus.isLoaded ? audioStatus.durationMillis! / 1000 : 0;
      console.log('Audio duration:', currentAudioDuration);

      // Store durations in state
      setVideoDuration(currentVideoDuration);
      setAudioDuration(currentAudioDuration);

      // Store the audio player reference
      audioPlayerRef.current = sound;
      setIsAudioLoaded(true);

      // Set up audio duration synchronization
      if (currentAudioDuration > 0 && currentVideoDuration > 0) {
        if (currentAudioDuration >= currentVideoDuration) {
          // Audio is longer than video - we'll stop it at video duration
          console.log('Audio is longer than video, will stop at video duration');
        } else {
          // Video is longer than audio - we'll loop the audio
          console.log('Video is longer than audio, will loop audio');
        }
      }

      Alert.alert(
        'Success',
        `Background music "${audioName}" loaded successfully!\nVideo: ${currentVideoDuration.toFixed(1)}s, Audio: ${currentAudioDuration.toFixed(1)}s`,
        [{ text: 'OK' }]
      );

      // If video is currently playing, start the audio too
      if (player?.playing && isVideoPlaying) {
        await sound.playAsync();
        console.log('Audio started with video on load');
      }

    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Failed to load background music');
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'pending': return '#ffa500';
      case 'uploading': return '#259B9A';
      case 'completed': return '#4CAF50';
      case 'failed': return '#F44336';
      default: return '#767577';
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'pending': return 'Pending';
      case 'uploading': return 'Uploading...';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  if (!videoUri) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noVideoText}>No video to preview.</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!isUploaded && !(showDiscardModal && isDiscardConfirmed) ? (
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Preview</Text>
            
            {/* Header Action Icons */}
            <View style={styles.headerActions}>
              {/* AWS Upload Icon */}
              {flaggedForUpload && uploadStatus === 'pending' && (
                <TouchableOpacity style={styles.headerIcon} onPress={() => setShowUploadToaster(true)}>
                  <MaterialIcons name="cloud-upload" size={24} color="#259B9A" />
                </TouchableOpacity>
              )}
              
              {/* Save Video Icon */}
              <TouchableOpacity style={styles.headerIcon} onPress={handleApprove}>
                <MaterialIcons name="save" size={24} color="#259B9A" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerLine} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Video Preview */}
            <View style={styles.videoContainer}>
              <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
              />
              
              {/* Play/Pause Overlay Button */}
              <TouchableOpacity 
                style={styles.playPauseOverlay}
                onPress={() => {
                  if (player.playing) {
                    player.pause();
                    setIsVideoPlaying(false);
                  } else {
                    player.play();
                    setIsVideoPlaying(true);
                  }
                }}
              >
                <MaterialIcons 
                  name={player.playing ? "pause" : "play-arrow"} 
                  size={moderateScale(50)} 
                  color="rgba(255, 255, 255, 0.8)" 
                />
              </TouchableOpacity>
                
                {/* Transition Effect Overlay */}
                {activeTransition && (
                  <View style={[styles.transitionOverlay, getTransitionStyle(activeTransition)]} />
                )}
              
              {/* Text Overlays */}
              {textOverlays.map((overlay) => (
                <TextItem
                  key={overlay.id}
                  textOverlay={overlay}
                  onSelect={handleTextSelect}
                  onRemove={handleTextRemove}
                  onResize={handleTextResize}
                  onPositionUpdate={handleTextPositionUpdate}
                  screenWidth={SCREEN_WIDTH}
                  styles={styles}
                />
              ))}

              {/* Sticker Overlays */}
              {stickerOverlays.map((sticker) => (
                <StickerItem
                  key={sticker.id}
                  sticker={sticker}
                  onSelect={handleStickerSelect}
                  onRemove={handleStickerRemove}
                  onResize={handleStickerResize}
                  onPositionUpdate={handleStickerPositionUpdate}
                  screenWidth={SCREEN_WIDTH}
                  styles={styles}
                />
              ))}
            </View>

            {/* Video Timeline - CapCut Style */}
            <VideoTimeline 
              videoDuration={(() => {
                if (segments.length > 0) return sumSegmentsDuration();
                const full = getFullDuration();
                const start = trimStartSec || 0;
                const end = (trimEndSec ?? full);
                return Math.max(0, end - start);
              })()}
              currentTime={(() => {
                if (segments.length > 0) return toVirtualTime(currentTime);
                return Math.max(0, (currentTime - (trimStartSec || 0)));
              })()}
              onTimeChange={(relativeTime) => {
                let absoluteTime: number;
                if (segments.length > 0) {
                  absoluteTime = toAbsoluteTime(relativeTime);
                } else {
                  const full = getFullDuration();
                  const start = trimStartSec || 0;
                  const end = (trimEndSec ?? full);
                  absoluteTime = Math.max(start, Math.min(start + relativeTime, end));
                }
                setCurrentTime(absoluteTime);
                if (player && typeof absoluteTime === 'number') {
                  player.currentTime = absoluteTime;
                }
              }}
              videoFrames={videoFrames}
              isLoading={isLoadingVideo}
            />
            
            {/* Bottom Toolbar - CapCut Style */}
            <BottomToolbar 
              onToolSelect={(tool: string) => {
                console.log('Tool selected:', tool);
                // Cast to expected union where applicable
                openVideoEditor(tool as 'edit' | 'text' | 'stickers' | 'audio' | 'filters' | 'transitions');
              }}
              activeTool="edit"
            />
          </ScrollView>
        </View>
      ) : isUploaded ? (
        <View style={[styles.videoView, { backgroundColor: "black" }]}>
          <LottieView
            autoPlay
            loop={false}
            style={styles.lottie}
            source={require("../../assets/lottie/guXmTJWvVE.json")}
            onAnimationFinish={() => {
              setShowSuccessModal(true);
            }}
          />
        </View>
      ) : null}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Your video is successfully saved to:
            </Text>
            <Text style={styles.modalUrl}>
              https://startuppal-video-storage.s3.amazonaws.com/user-uploads/test-video.mp4
            </Text>
            <TouchableOpacity
              style={[styles.YesNoButton, { backgroundColor: "#4CAF50" }]}
              onPress={handleModalClose}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDiscardModal}
        onRequestClose={handleDiscardModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!isDiscardConfirmed ? (
              <>
                <Text style={styles.modalText}>
                  Are you sure you want to discard this video?
                </Text>
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.YesNoButton, { backgroundColor: "#4CAF50" }]}
                    onPress={confirmDiscard}
                  >
                    <Text style={styles.buttonText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.YesNoButton, { backgroundColor: "#F44336" }]}
                    onPress={handleDiscardModalClose}
                  >
                    <Text style={styles.buttonText}>No</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalText}>
                  Your video is discarded successfully, please record again.
                </Text>
                <TouchableOpacity
                  style={[styles.YesNoButton, { backgroundColor: "#4CAF50" }]}
                  onPress={handleDiscardModalClose}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* AWS Upload Settings Toaster */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUploadToaster}
        onRequestClose={() => setShowUploadToaster(false)}
      >
        <View style={styles.toasterOverlay}>
          <View style={styles.toasterContent}>
            <View style={styles.toasterHeader}>
              <Text style={styles.toasterTitle}>AWS Upload Settings</Text>
              <TouchableOpacity onPress={() => setShowUploadToaster(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.toasterBody}>
              <View style={styles.uploadRow}>
                <Text style={styles.uploadLabel}>Flag for AWS Upload:</Text>
                <Switch
                  value={flaggedForUpload}
                  onValueChange={toggleUploadFlag}
                  trackColor={{ false: '#767577', true: '#259B9A' }}
                  thumbColor={flaggedForUpload ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.uploadStatusRow}>
                <Text style={styles.uploadLabel}>Upload Status:</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                  <Text style={styles.statusText}>{getStatusText()}</Text>
                </View>
              </View>
              
              {flaggedForUpload && uploadStatus === 'pending' && (
                <TouchableOpacity 
                  style={styles.uploadButton} 
                  onPress={() => {
                    simulateUpload();
                  }}
                >
                  <MaterialIcons name="cloud-upload" size={20} color="white" />
                  <Text style={styles.uploadButtonText}>Upload to AWS</Text>
                </TouchableOpacity>
              )}
              
              {uploadStatus === 'uploading' && (
                <View style={styles.uploadingContainer}>
                  <MaterialIcons name="cloud-upload" size={20} color="#259B9A" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
              
              {uploadStatus === 'completed' && (
                <View style={styles.completedContainer}>
                  <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.completedText}>Upload Completed!</Text>
                </View>
              )}
              
              {uploadStatus === 'failed' && (
                <View style={styles.failedContainer}>
                  <MaterialIcons name="error" size={20} color="#F44336" />
                  <Text style={styles.failedText}>Upload Failed</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Editor Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showVideoEditor}
        onRequestClose={closeVideoEditor}
      >
        <View style={styles.toasterOverlay}>
          <View style={styles.toasterContent}>
            <View style={styles.toasterHeader}>
              <Text style={styles.toasterTitle}>
                {activeEditorTool === 'edit' && 'Video Editor'}
                {activeEditorTool === 'text' && 'Add Text'}
                {activeEditorTool === 'stickers' && 'Add Stickers'}
                {activeEditorTool === 'audio' && 'Audio Editor'}
                {activeEditorTool === 'filters' && 'Video Filters'}
              </Text>
              <TouchableOpacity onPress={closeVideoEditor}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.toasterBody}>
              {activeEditorTool === 'edit' && (
                <VideoEditingTools
                  videoUri={videoUri}
                  videoDuration={(videoMetadata?.duration || player?.duration || 0)}
                  splitTime={uiSplitTime}
                  onSplitTimeChange={(t) => setUiSplitTime(Math.max(0, Math.min(t, getFullDuration())))}
                  keptLeft={(segments.some(s => (Math.min(uiSplitTime, s.end) > s.start)))}
                  keptRight={(segments.some(s => (s.end > Math.max(uiSplitTime, s.start))))}
                  onConfirmTrim={async (startSec, endSec) => {
                    // Simulate trimming on Expo: constrain playback and timeline to range
                    const full = videoMetadata?.duration || player?.duration || 0;
                    const start = Math.max(0, Math.min(startSec, full));
                    const end = Math.max(start, Math.min(endSec, full));
                    setTrimStartSec(start);
                    setTrimEndSec(end);
                    setSegments(normalizeSegments([{ start, end }]));
                    if (player) {
                      player.currentTime = start;
                    }
                    setActiveEditorTool(null);
                    setShowVideoEditor(false);
                    Alert.alert('Trim Applied', 'Preview limited to selected range (simulation).');
                  }}
                  onSplitVideo={(timeSec) => {
                    const full = getFullDuration();
                    const t = Math.max(0, Math.min(timeSec, full));
                    setUiSplitTime(t);
                    if (segments.length === 0) return;
                    const newSegs: Array<{ start: number; end: number }> = [];
                    for (const s of segments) {
                      if (t <= s.start || t >= s.end) {
                        newSegs.push({ ...s });
                      } else {
                        newSegs.push({ start: s.start, end: t });
                        newSegs.push({ start: t, end: s.end });
                      }
                    }
                    setSegments(normalizeSegments(newSegs));
                    Alert.alert('Split', `Video split at ${t.toFixed(2)}s (simulation).`);
                  }}
                  onCropVideo={() => handleVideoEdit('crop', {})}
                  onRotateVideo={() => handleVideoEdit('rotate', {})}
                  onSpeedChange={(speed) => handleVideoEdit('speed', { speed })}
                  onDeleteClip={(startSec, endSec) => {
                    const full = getFullDuration();
                    const start = Math.max(0, Math.min(startSec, full));
                    const end = Math.max(start, Math.min(endSec, full));
                    if (segments.length === 0) return;
                    
                    console.log('Delete operation:', { start, end, currentSegments: segments });
                    
                    const updated: Array<{ start: number; end: number }> = [];
                    for (const s of segments) {
                      // If [start,end] fully outside segment, keep as is
                      if (end <= s.start || start >= s.end) {
                        updated.push({ ...s });
                        continue;
                      }
                      // Overlap cases: cut out [start,end] portion from s
                      if (start > s.start) {
                        updated.push({ start: s.start, end: Math.min(start, s.end) });
                      }
                      if (end < s.end) {
                        updated.push({ start: Math.max(end, s.start), end: s.end });
                      }
                    }
                    
                    const normalized = normalizeSegments(updated);
                    console.log('Updated segments after delete:', normalized);
                    setSegments(normalized);
                    
                    // If all segments deleted, fall back to empty (no playback)
                    if (normalized.length > 0) {
                      const nextStart = normalized[0].start;
                      if (player) {
                        player.currentTime = nextStart;
                        console.log('Seeking player to:', nextStart);
                      }
                      setCurrentTime(nextStart);
                    }
                    Alert.alert('Delete', 'Current segment deleted (simulation).');
                  }}
                  onDuplicateClip={() => handleVideoEdit('duplicate', {})}
                  onMergeClips={() => handleVideoEdit('merge', {})}
                  onReverseVideo={() => handleVideoEdit('reverse', {})}
                />
              )}
              
              {activeEditorTool === 'text' && (
                <TextOverlay
                  onAddText={handleTextAdd}
                  onAddTemplate={(template) => handleTextAdd(template, {})}
                  
                />
              )}
              
              {activeEditorTool === 'stickers' && (
                <StickerOverlay
                  onAddSticker={handleStickerAdd}
                />
              )}
              
              {activeEditorTool === 'audio' && (
                  <ScrollView 
                    style={styles.audioEditorContainer}
                    contentContainerStyle={styles.audioEditorContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <VolumeControl 
                      style={styles.audioVolumeControl}
                      showLabel={true}
                      onAudioAdded={handleAudioAdded}
                      onAudioRemoved={handleAudioRemoved}
                      // Voice recording props
                      isRecording={isRecording}
                      isVoiceLoaded={isVoiceLoaded}
                      voiceVolume={voiceVolume}
                      isVoiceMuted={isVoiceMuted}
                      onStartRecording={startVoiceRecording}
                      onStopRecording={stopVoiceRecording}
                      onDeleteVoice={deleteVoiceRecording}
                      onVoiceVolumeChange={updateVoiceVolume}
                      onVoiceMuteToggle={toggleVoiceMute}
                    />
                  </ScrollView>
              )}
          
              
              {activeEditorTool === 'transitions' && (
                <TransitionOverlay
                  videoDuration={getFullDuration()}
                  currentTime={currentTime}
                  onAddTransition={handleTransitionAdd}
                  onRemoveTransition={handleTransitionRemove}
                  existingTransitions={transitionEffects}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  audioEditorContainer: {
    flex: 1,
    padding: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(8),
    margin: moderateScale(10),
  },
  audioEditorContent: {
    flexGrow: 1,
    paddingBottom: moderateScale(20),
  },
  audioVolumeControl: {
    backgroundColor: 'transparent',
    margin: 0,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(8),
  },
  header: {
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(20),
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: moderateScale(20),
    top: moderateScale(58),
    zIndex: 1,
  },
  headerLine: {
    width: SCREEN_WIDTH * 0.8,
    height: 1,
    backgroundColor: '#259B9A',
    marginTop: moderateScale(15),
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: AppColors.white,
    textAlign: "center",
  },
  headerActions: {
    position: "absolute",
    right: moderateScale(20),
    top: moderateScale(50),
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(15),
    zIndex: 1,
  },
  headerIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "rgba(37, 155, 154, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#259B9A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScale(30),
  },
  videoContainer: {
    alignItems: "center",
    marginTop: moderateScale(20),
    marginBottom: moderateScale(30),
    paddingHorizontal: moderateScale(10),
  },
  video: {
    width: SCREEN_WIDTH * 0.9 + 9,
    height: moderateScale(440),
    borderRadius: moderateScale(10),
    backgroundColor: "black",
  },
  playPauseOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  playControlContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(30),
  },
  playButton: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(15),
  },
  timeText: {
    color: "white",
    fontSize: moderateScale(16),
  },
  saveButton: {
    backgroundColor: "#259B9A",
    marginHorizontal: moderateScale(20),
    paddingVertical: moderateScale(18),
    borderRadius: moderateScale(12),
    alignItems: "center",
    marginBottom: moderateScale(30),
  },
  saveButtonText: {
    color: "white",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  editSection: {
    paddingHorizontal: moderateScale(20),
    marginTop: moderateScale(20), // Move buttons further down
  },
  editButtonsContainer: {
    paddingHorizontal: moderateScale(8),
  },
  editButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    marginHorizontal: moderateScale(8),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: moderateScale(8),
    minWidth: moderateScale(62), // Increase width by 2px (from 60 to 62)
  },
  editButtonText: {
    color: "white",
    fontSize: moderateScale(12),
    marginTop: moderateScale(4),
    textAlign: "center",
  },
  videoView: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    position: "relative",
    height: "90%",
    marginTop: 50,
  },
  YesNoButton: {
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 80
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    marginRight: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  noVideoText: {
    color: "#fff",
    fontSize: 18,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: moderateScale(300),
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalUrl: {
    fontSize: 14,
    color: "#0000EE",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  uploadSection: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
    backgroundColor: "rgba(37, 155, 154, 0.1)",
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginHorizontal: moderateScale(20),
  },
  uploadTitle: {
    color: "white",
    fontSize: moderateScale(16),
    fontWeight: "600",
    marginBottom: moderateScale(15),
  },
  uploadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  uploadStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(15),
  },
  uploadLabel: {
    color: "white",
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(8),
  },
  statusText: {
    color: "white",
    fontSize: moderateScale(14),
  },
  uploadButton: {
    backgroundColor: "#259B9A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(10),
  },
  uploadButtonText: {
    color: "white",
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginLeft: moderateScale(8),
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(10),
  },
  uploadingText: {
    color: "#259B9A",
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginLeft: moderateScale(8),
  },
  completedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(10),
  },
  completedText: {
    color: "#4CAF50",
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginLeft: moderateScale(8),
  },
  failedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(10),
  },
  failedText: {
    color: "#F44336",
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginLeft: moderateScale(8),
  },
  toasterOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  toasterContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingBottom: moderateScale(30),
    maxHeight: "85%",
    minHeight: "50%",
  },
  toasterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  toasterTitle: {
    color: "white",
    fontSize: moderateScale(18),
    fontWeight: "600",
  },
  toasterBody: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    flex: 1,
    minHeight: moderateScale(200),
  },
 
   textOverlay: {
     position: 'absolute',
     zIndex: 10,
     backgroundColor: 'transparent',
   },
   overlayText: {
     fontWeight: 'bold',
     textShadowColor: 'rgba(0, 0, 0, 0.75)',
     textShadowOffset: { width: 1, height: 1 },
     textShadowRadius: 2,
   },
   stickerOverlay: {
     position: 'absolute',
     zIndex: 10,
     backgroundColor: 'transparent',
     borderRadius: 8,
     padding: 4,
   },
   stickerText: {
     textAlign: 'center',
   },
   toasterContainer: {
     borderBottomWidth: 1,
     borderBottomColor: "rgba(255, 255, 255, 0.1)",
   },
 
});

export default PreviewVideoShoot;