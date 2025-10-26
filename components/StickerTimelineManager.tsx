import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import StickerTimeline from './StickerTimeline';
import StickerItem from './StickerItem';
import { moderateScale } from '@/utils/scaling';

interface StickerTimelineManagerProps {
  videoDuration: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
  screenWidth: number;
}

const StickerTimelineManager: React.FC<StickerTimelineManagerProps> = ({
  videoDuration,
  currentTime,
  onTimeChange,
  screenWidth,
}) => {
  // State for stickers with timestamps
  const [stickers, setStickers] = useState<Array<{
    id: string;
    sticker: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    isSelected: boolean;
    timestamp: number;
  }>>([]);
  
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // Add a sticker at a specific time
  const handleAddStickerAtTime = (time: number) => {
    const newSticker = {
      id: `sticker-${Date.now()}`,
      sticker: '😀', // Default sticker
      x: screenWidth / 2 - 30,
      y: 100,
      size: 40,
      rotation: 0,
      isSelected: false,
      timestamp: time,
    };
    
    setStickers([...stickers, newSticker]);
  };

  // Handle sticker selection
  const handleStickerSelect = (id: string) => {
    setStickers(stickers.map(sticker => ({
      ...sticker,
      isSelected: sticker.id === id
    })));
    setSelectedStickerId(id);
  };

  // Handle sticker removal
  const handleStickerRemove = (id: string) => {
    setStickers(stickers.filter(sticker => sticker.id !== id));
    if (selectedStickerId === id) {
      setSelectedStickerId(null);
    }
  };

  // Handle sticker resize
  const handleStickerResize = (id: string, size: number) => {
    setStickers(stickers.map(sticker => 
      sticker.id === id ? { ...sticker, size } : sticker
    ));
  };

  // Handle sticker position update
  const handleStickerPositionUpdate = (id: string, x: number, y: number) => {
    setStickers(stickers.map(sticker => 
      sticker.id === id ? { ...sticker, x, y } : sticker
    ));
  };

  // Handle sticker timestamp update
  const handleStickerTimestampUpdate = (id: string, timestamp: number) => {
    setStickers(stickers.map(sticker => 
      sticker.id === id ? { ...sticker, timestamp } : sticker
    ));
  };

  // Get stickers that should be visible at the current time
  const visibleStickers = stickers.filter(sticker => 
    Math.abs(sticker.timestamp - currentTime) < 0.5 // Show stickers within 0.5 seconds of current time
  );

  return (
    <View style={styles.container}>
      {/* Timeline for adding stickers at specific times */}
      <StickerTimeline
        videoDuration={videoDuration}
        currentTime={currentTime}
        onTimeChange={onTimeChange}
        onAddStickerAtTime={handleAddStickerAtTime}
        stickers={stickers.map(s => ({ id: s.id, time: s.timestamp, sticker: s.sticker }))}
        onStickerPress={handleStickerSelect}
      />
      
      {/* Render visible stickers */}
      {visibleStickers.map(sticker => (
        <StickerItem
          key={sticker.id}
          sticker={sticker}
          onSelect={handleStickerSelect}
          onRemove={handleStickerRemove}
          onResize={handleStickerResize}
          onPositionUpdate={handleStickerPositionUpdate}
          onTimestampUpdate={handleStickerTimestampUpdate}
          screenWidth={screenWidth}
          styles={styles}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  stickerOverlay: {
    position: 'absolute',
    padding: moderateScale(5),
    zIndex: 10,
  },
  stickerText: {
    textAlign: 'center',
  },
});

export default StickerTimelineManager;