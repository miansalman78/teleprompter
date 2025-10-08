# Teleprompter App 📱

A professional teleprompter application built with React Native and Expo, designed for creating high-quality pitch videos and presentations with advanced permission management and user-friendly features.

##  Features

### ✅ Core Functionality
- **Video Recording**: High-quality video recording with camera and microphone integration
- **Teleprompter Display**: Smooth scrolling text overlay during video recording
- **Recording Modes**: Support for 1-minute and 3-minute recording sessions
- **Permission Management**: Comprehensive camera and microphone permission handling
- **Cross-Platform Support**: Works seamlessly on both Android and iOS devices

### ✅ User Interface
- **Modern UI Design**: Clean and intuitive interface with Material Icons
- **Responsive Design**: Adaptive layout for different screen sizes
- **Lottie Animations**: Smooth loading animations and visual feedback
- **Real-time Controls**: Recording timer, pause/resume, and stop functionality

### ✅ Advanced Features
- **Script Management**: Text input, editing, and clipboard paste functionality
- **Font Controls**: Adjustable font size and scroll speed for teleprompter
- **Camera Controls**: Front/back camera switching and aspect ratio toggle
- **Orientation Support**: Seamless portrait and landscape mode switching
- **Button Overlay**: Properly positioned Edit, Settings, and Rotate buttons
- **Video Storage**: Local video storage with AsyncStorage integration
- **Upload Capability**: AWS upload preparation and flagging system
- **Error Handling**: Comprehensive error handling and user feedback
- **EAS Updates**: Over-the-air updates for seamless app improvements

### ✅ Permission System
- **Automatic Permission Requests**: Smart permission checking on screen focus
- **Permission Validation**: Multiple checkpoints before recording starts
- **Retry Mechanism**: User-friendly retry options for denied permissions
- **Settings Integration**: Guidance for manual permission enabling
- **Real-time Status**: Live permission status indicators

### ✅ Technical Implementation
- **Expo Camera Integration**: Full camera API utilization
- **File System Management**: Efficient video file handling and cleanup
- **Navigation**: React Navigation with proper routing
- **State Management**: Efficient React hooks and context API
- **Performance Optimization**: Smooth animations and responsive UI

## 🛠️ Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npx expo start
   ```

3. **Run on Device/Emulator**
   ```bash
   # Android
   npx expo run:android
   
   # iOS
   npx expo run:ios
   ```

## 📱 App Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # Home screen
│   ├── script.tsx         # Script management
│   └── videos.tsx         # Video library
├── screens/
│   ├── videoShoot.tsx     # Main recording screen
│   ├── PreviewVideoShoot.tsx # Video preview
│   └── videoShootStyles.ts # Styling
└── _layout.tsx            # App layout
```

## 🎯 Key Features

### ✅ Permission Management
- [x] Camera permission handling
- [x] Microphone permission handling
- [x] Permission retry functionality
- [x] User-friendly error messages
- [x] Settings guidance integration

### ✅ Video Recording
- [x] High-quality video capture
- [x] Audio recording integration
- [x] Recording time limits (1min/3min)
- [x] Pause/resume functionality
- [x] Recording status indicators

### ✅ Teleprompter Features
- [x] Smooth scrolling text display
- [x] Adjustable scroll speed
- [x] Font size controls
- [x] Script editing capabilities
- [x] Clipboard integration
- [x] Portrait mode optimization
- [x] Landscape mode support with proper rotation
- [x] Button visibility optimization (Edit, Settings, Rotate)
- [x] Proper text orientation in all modes

### ✅ User Experience
- [x] Intuitive interface design
- [x] Loading animations
- [x] Error handling and feedback
- [x] Cross-platform compatibility
- [x] Responsive design

## 🔧 Technologies Used

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **Expo Camera**: Camera and video recording
- **Expo Router**: File-based navigation
- **AsyncStorage**: Local data persistence
- **Lottie**: Animation library for smooth visual effects
- **Material Icons**: Modern icon system
- **TypeScript**: Type-safe development

## 📋 Recent Updates

- ✅ Improved teleprompter portrait mode styling and text orientation
- ✅ Enhanced button visibility in teleprompter overlay
- ✅ Optimized z-index values for Edit, Settings, and Rotate buttons
- ✅ Implemented responsive styling for landscape and portrait modes
- ✅ Refined teleprompter transform rotation for better display
- ✅ Published app updates via EAS for public access
- ✅ Enhanced permission validation in video recording
- ✅ Updated all permission messages to English
- ✅ Improved retry mechanism for permissions
- ✅ Enhanced error handling and user feedback
- ✅ Implemented comprehensive permission checking
- ✅ Added settings guidance for users

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npx expo start`
4. Run on your preferred platform (Android/iOS)
5. Grant camera and microphone permissions when prompted
6. Start creating professional pitch videos!

## 📞 Support

For issues or questions, please check the permission settings in your device and ensure camera and microphone access is granted to the application. For additional support, refer to the documentation or contact the development team.
