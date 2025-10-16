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
- **AWS S3 Upload**: Complete AWS S3 integration with real upload functionality
- **Offline Video Editing**: Full FFmpeg-kit integration for offline processing
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

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd teleprompter-main

# Install dependencies
npm install

# For React Native dependencies, you may need to use legacy peer deps
npm install --legacy-peer-deps
```

### 2. AWS S3 Configuration (Optional but Recommended)
The app supports uploading videos to AWS S3. To enable this feature:

1. **Create an AWS S3 Bucket:**
   - Go to AWS Console → S3
   - Create a new bucket
   - Note down the bucket name and region

2. **Create IAM User with S3 Permissions:**
   - Go to AWS Console → IAM
   - Create a new user with programmatic access
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Note down the Access Key ID and Secret Access Key

3. **Configure in App:**
   - Open the app
   - Go to Settings (gear icon)
   - Enter your AWS credentials:
     - Region (e.g., `us-east-1`)
     - Bucket Name
     - Access Key ID
     - Secret Access Key
   - Test the connection
   - Save configuration

### 3. Start Development Server
```bash
# Start Expo development server
npx expo start

# Or start with specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

### 4. Run on Device/Emulator
```bash
# Android
npx expo run:android

# iOS (macOS only)
npx expo run:ios

# Web
npx expo start --web
```

### 5. Build for Production
```bash
# Build for Android
npx expo build:android

# Build for iOS
npx expo build:ios

# Or use EAS Build (recommended)
npx eas build --platform android
npx eas build --platform ios
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

## 🆕 Latest Updates (v1.1.0)

### ✨ New Features Added
- ✅ **Complete AWS S3 Integration**: Real upload functionality with progress tracking
- ✅ **Settings Screen**: Comprehensive configuration management
- ✅ **Environment Configuration**: Secure credential management
- ✅ **Enhanced Video Processing**: Optimized FFmpeg-kit implementation
- ✅ **Upload Status Tracking**: Real-time upload progress and status management
- ✅ **Connection Testing**: AWS S3 connection validation
- ✅ **Feature Toggles**: Enable/disable specific app features
- ✅ **Comprehensive Documentation**: Detailed setup and usage guides

### 🔧 Technical Improvements
- ✅ **AWS SDK Integration**: Full AWS S3 client implementation
- ✅ **Configuration Management**: Persistent app settings storage
- ✅ **Error Handling**: Enhanced error management for uploads
- ✅ **Progress Tracking**: Real-time upload progress monitoring
- ✅ **Security**: Secure credential storage and management

## 📋 Previous Updates

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

### Quick Start Guide

1. **Clone and Setup:**
   ```bash
   git clone <repository-url>
   cd teleprompter-main
   npm install --legacy-peer-deps
   npx expo start
   ```

2. **First Launch:**
   - Grant camera and microphone permissions when prompted
   - The app will guide you through the initial setup

3. **Configure AWS S3 (Optional):**
   - Go to Settings → AWS S3 Configuration
   - Enter your AWS credentials
   - Test the connection
   - Save configuration

4. **Start Recording:**
   - Choose recording mode (1-minute or 3-minute)
   - Add your script text
   - Adjust teleprompter settings (font size, scroll speed)
   - Start recording your pitch video

## 📖 Detailed Usage Guide

### 🎬 Recording Videos

1. **Select Recording Mode:**
   - **1-Minute Pitch**: Perfect for elevator pitches, quick demos
   - **3-Minute Presentation**: Ideal for detailed product presentations

2. **Script Management:**
   - Type or paste your script in the Script tab
   - Use the teleprompter during recording for smooth delivery
   - Adjust font size and scroll speed for optimal readability

3. **Camera Controls:**
   - Switch between front and rear cameras
   - Toggle between portrait and landscape modes
   - Use the aspect ratio toggle for different video formats

4. **Recording Process:**
   - Press and hold the record button to start
   - Use pause/resume for breaks
   - Stop recording when finished
   - Preview your video before saving

### ✂️ Video Editing Features

The app includes comprehensive offline video editing capabilities:

1. **Basic Editing:**
   - **Trim**: Cut video to desired length
   - **Split**: Divide video into segments
   - **Delete**: Remove unwanted sections
   - **Duplicate**: Copy video segments

2. **Advanced Effects:**
   - **Text Overlays**: Add titles, captions, or watermarks
   - **Stickers**: Insert static or animated stickers
   - **Filters**: Apply visual effects (blur, brightness, hue)
   - **Transitions**: Add smooth transitions between clips

3. **Audio Editing:**
   - **Mute Original**: Remove original audio
   - **Add Music**: Mix background music
   - **Voice-over**: Add narration
   - **Volume Control**: Adjust audio levels

4. **Video Processing:**
   - **Speed Control**: Slow down or speed up video
   - **Rotation**: Rotate video orientation
   - **Crop**: Adjust video dimensions

### ☁️ AWS S3 Upload

1. **Setup AWS S3:**
   - Create an AWS S3 bucket
   - Generate IAM credentials with S3 permissions
   - Configure credentials in app settings

2. **Upload Process:**
   - Flag videos for upload in the preview screen
   - Monitor upload progress
   - Access uploaded videos via presigned URLs

3. **Upload Status:**
   - **Pending**: Video flagged but not uploaded
   - **Uploading**: Upload in progress
   - **Completed**: Successfully uploaded to S3
   - **Failed**: Upload failed (check credentials/connection)

### 🎛️ Settings and Configuration

1. **AWS S3 Settings:**
   - Region configuration
   - Bucket name
   - Access credentials
   - Connection testing

2. **Feature Toggles:**
   - Enable/disable AWS upload
   - Enable/disable video editing
   - Enable/disable offline processing

3. **Video Settings:**
   - Maximum video size limits
   - Default video quality settings

### 📱 App Navigation

- **Home Tab**: Start new recordings, access recent videos
- **Script Tab**: Manage and edit teleprompter scripts
- **Videos Tab**: View saved videos, manage uploads
- **Settings**: Configure app preferences and AWS credentials

### 🔧 Troubleshooting

**Common Issues:**

1. **Permission Denied:**
   - Go to device Settings → Apps → Teleprompter
   - Enable Camera and Microphone permissions

2. **AWS Upload Failed:**
   - Check AWS credentials in Settings
   - Verify bucket name and region
   - Test connection in Settings

3. **Video Editing Not Working:**
   - Ensure FFmpeg-kit is properly installed
   - Check if offline processing is enabled in Settings
   - Restart the app if issues persist

4. **App Crashes:**
   - Clear app cache
   - Restart device
   - Reinstall app if necessary

**Performance Tips:**

- Close other apps while recording for better performance
- Use lower video quality for longer recordings
- Clear old videos regularly to free up storage
- Keep the app updated for latest features and fixes

## 📞 Support

For issues or questions, please check the permission settings in your device and ensure camera and microphone access is granted to the application. For additional support, refer to the documentation or contact the development team.
