export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number; // in seconds
  category: string;
  license: string;
  attribution: string;
  filePath: string;
  isLocal: boolean;
}

export const ROYALTY_FREE_MUSIC: MusicTrack[] = [
  {
    id: '2',
    name: 'Sunny',
    artist: 'Bensound',
    duration: 150,
    category: 'Upbeat',
    license: 'CC BY 4.0',
    attribution: 'Music by Bensound',
    filePath: 'https://www.bensound.com/bensound-music/bensound-sunny.mp3',
    isLocal: false,
  },
  {
    id: '3',
    name: 'Creative Minds',
    artist: 'Bensound',
    duration: 180,
    category: 'Corporate',
    license: 'CC BY 4.0',
    attribution: 'Music by Bensound',
    filePath: 'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3',
    isLocal: false,
  },
  {
    id: '4',
    name: 'Acoustic Breeze',
    artist: 'Bensound',
    duration: 140,
    category: 'Acoustic',
    license: 'CC BY 4.0',
    attribution: 'Music by Bensound',
    filePath: 'https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3',
    isLocal: false,
  },
  {
    id: '5',
    name: 'Happiness',
    artist: 'Bensound',
    duration: 160,
    category: 'Happy',
    license: 'CC BY 4.0',
    attribution: 'Music by Bensound',
    filePath: 'https://www.bensound.com/bensound-music/bensound-happiness.mp3',
    isLocal: false,
  },
  {
    id: '6',
    name: 'Jazzy Frenchy',
    artist: 'Bensound',
    duration: 200,
    category: 'Jazz',
    license: 'CC BY 4.0',
    attribution: 'Music by Bensound',
    filePath: 'https://www.bensound.com/bensound-music/bensound-jazzyfrenchy.mp3',
    isLocal: false,
  },
  {
    id: '7',
    name: 'Little Idea',
    artist: 'Bensound',
    duration: 130,
    category: 'Creative',
    license: 'CC BY 4.0',
    attribution: 'Music by Bensound',
    filePath: 'https://www.bensound.com/bensound-music/bensound-littleidea.mp3',
    isLocal: false,
  },
  {
    id: '8',
    name: 'Memories',
    artist: 'Bensound',
    duration: 170,
    category: 'Emotional',
    license: 'CC BY 4.0',
    attribution: 'Music by Bensound',
    filePath: 'https://www.bensound.com/bensound-music/bensound-memories.mp3',
    isLocal: false,
  },
  {
    id: '9',
    name: 'Sweet',
    artist: 'Bensound',
    duration: 145,
    category: 'Romantic',
    license: 'CC BY 4.0',
    attribution: 'Music by Bensound',
    filePath: 'https://www.bensound.com/bensound-music/bensound-sweet.mp3',
    isLocal: false,
  },
  {
    id: '10',
    name: 'Tenderness',
    artist: 'Bensound',
    duration: 155,
    category: 'Soft',
    license: 'CC BY 4.0',
    attribution: 'Music by Bensound',
    filePath: 'https://www.bensound.com/bensound-music/bensound-tenderness.mp3',
    isLocal: false,
  },
];

export const getMusicByCategory = (category: string): MusicTrack[] => {
  if (category === 'All') {
    return ROYALTY_FREE_MUSIC;
  }
  return ROYALTY_FREE_MUSIC.filter(track => track.category === category);
};

export const getMusicCategories = (): string[] => {
  const categories = ['All', ...new Set(ROYALTY_FREE_MUSIC.map(track => track.category))];
  return categories;
};