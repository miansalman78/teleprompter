import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AudioTrack {
  id: string;
  name: string;
  uri: string;
  duration?: number;
}

interface VolumeContextType {
  // Video volume controls
  volume: number; // Volume percentage (0-100)
  isMuted: boolean;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  getActualVolume: () => number; // Returns 0 if muted, otherwise volume/100
  
  // Audio track controls
  audioTrack: AudioTrack | null;
  audioVolume: number; // Audio track volume percentage (0-100)
  isAudioMuted: boolean;
  setAudioTrack: (track: AudioTrack | null) => void;
  setAudioVolume: (volume: number) => void;
  setAudioMuted: (muted: boolean) => void;
  toggleAudioMute: () => void;
  getActualAudioVolume: () => number; // Returns 0 if muted, otherwise audioVolume/100
}

const VolumeContext = createContext<VolumeContextType | undefined>(undefined);

interface VolumeProviderProps {
  children: ReactNode;
}

export const VolumeProvider: React.FC<VolumeProviderProps> = ({ children }) => {
  // Video volume state
  const [volume, setVolume] = useState<number>(100); // Default to 100%
  const [isMuted, setMuted] = useState<boolean>(false);
  
  // Audio track state
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(50); // Default to 50%
  const [isAudioMuted, setAudioMuted] = useState<boolean>(false);

  const toggleMute = () => {
    setMuted(!isMuted);
  };

  const toggleAudioMute = () => {
    setAudioMuted(!isAudioMuted);
  };

  const getActualVolume = (): number => {
    return isMuted ? 0 : volume / 100; // Convert percentage to 0-1 range
  };

  const getActualAudioVolume = (): number => {
    return isAudioMuted ? 0 : audioVolume / 100; // Convert percentage to 0-1 range
  };

  const value: VolumeContextType = {
    // Video volume
    volume,
    isMuted,
    setVolume,
    setMuted,
    toggleMute,
    getActualVolume,
    
    // Audio track
    audioTrack,
    audioVolume,
    isAudioMuted,
    setAudioTrack,
    setAudioVolume,
    setAudioMuted,
    toggleAudioMute,
    getActualAudioVolume,
  };

  return (
    <VolumeContext.Provider value={value}>
      {children}
    </VolumeContext.Provider>
  );
};

export const useVolume = (): VolumeContextType => {
  const context = useContext(VolumeContext);
  if (context === undefined) {
    throw new Error('useVolume must be used within a VolumeProvider');
  }
  return context;
};

