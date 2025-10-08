import { moderateScale } from "@/utils/scaling"
import { MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useIsFocused } from "@react-navigation/native"
import { Camera, CameraView } from "expo-camera"
import * as Clipboard from "expo-clipboard"
import * as FileSystem from "expo-file-system"
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import LottieView from "lottie-react-native"
import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import styles from "./videoShootStyles"
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const guidelineBaseWidth = 375
const guidelineBaseHeight = 812
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size

const VideoShoot = () => {
  const backPressedRef = useRef(false)
  const { mode } = useLocalSearchParams<{ mode: string }>()
  const recordingMode = mode || '1min'
  const maxRecordingTime = recordingMode === '3min' ? 180000 : 60000 // 3min or 1min in milliseconds

  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownText, setCountdownText] = useState("3")
  const [contentHeight, setContentHeight] = useState(0)
  const [showText, setShowText] = useState(false)
  const [scrollSpeedMultiplier, setScrollSpeedMultiplier] = useState(1)
  const [fontSize, setFontSize] = useState(moderateScale(32))
  const [showSettings, setShowSettings] = useState(false)
  const [showFontControls, setShowFontControls] = useState(false)
  const [scriptText, setScriptText] = useState("")
  const [showPasteSuccess, setShowPasteSuccess] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null)
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<
    boolean | null
  >(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [permissionLoading, setPermissionLoading] = useState(true)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedUri, setRecordedUri] = useState<string | null>(null)
  const [recordingReady, setRecordingReady] = useState(false)
  const [countdownInProgress, setCountdownInProgress] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)

  const scrollY = useRef(new Animated.Value(0)).current
  const scrollViewRef = useRef(null)
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  const countdownScale = useRef(new Animated.Value(1)).current
  const settingsAnim = useRef(new Animated.Value(0)).current
  const pasteSuccessAnim = useRef(new Animated.Value(0)).current
  const textInputRef = useRef<TextInput>(null)
  const cameraRef = useRef<CameraView>(null)
  const recordingPromiseRef = useRef<Promise<any> | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const isFocused = useIsFocused()
  const [cameraAspectRatio, setCameraAspectRatio] = useState<
    "portrait" | "landscape"
  >("portrait")
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front")
  const [teleprompterOrientation, setTeleprompterOrientation] = useState<
    "portrait" | "landscape"
  >("portrait")

  // Check permissions whenever screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const requestPermissions = async () => {
        try {
          console.log("Starting permission request...")
          setPermissionLoading(true)
          setPermissionError(null)
          
          // First check existing permissions
          const { status: existingCameraStatus } = await Camera.getCameraPermissionsAsync()
          const { status: existingAudioStatus } = await Camera.getMicrophonePermissionsAsync()
          
          console.log("Existing permissions - Camera:", existingCameraStatus, "Audio:", existingAudioStatus)
          
          let cameraStatus = existingCameraStatus
          let audioStatus = existingAudioStatus
          
          // Request camera permission if not granted
          if (existingCameraStatus !== "granted") {
            const result = await Camera.requestCameraPermissionsAsync()
            cameraStatus = result.status
          }
          
          // Request microphone permission if not granted
          if (existingAudioStatus !== "granted") {
            const result = await Camera.requestMicrophonePermissionsAsync()
            audioStatus = result.status
          }
          
          console.log("Final permission status - Camera:", cameraStatus, "Audio:", audioStatus)
          
          setHasCameraPermission(cameraStatus === "granted")
          setHasMicrophonePermission(audioStatus === "granted")
          
          // Set error messages for denied permissions
          if (cameraStatus !== "granted" && audioStatus !== "granted") {
            setPermissionError("Camera and microphone permissions are required for video recording")
            setShowPermissionDialog(true)
          } else if (cameraStatus !== "granted") {
            setPermissionError("Camera permission is required for video recording")
            setShowPermissionDialog(true)
          } else if (audioStatus !== "granted") {
            setPermissionError("Microphone permission is required for video recording")
            setShowPermissionDialog(true)
          } else {
            setShowPermissionDialog(false)
          }
          
          setPermissionLoading(false)
          
        } catch (error) {
          console.error("Permission request failed:", error)
          setHasCameraPermission(false)
          setHasMicrophonePermission(false)
          setPermissionError("Permission request failed. Please try again.")
          setShowPermissionDialog(true)
          setPermissionLoading(false)
        }
      }
      
      // Only request permissions when screen is focused
      if (isFocused) {
        requestPermissions()
      }
    }, [isFocused])
  )

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", () => {
      if (showText && contentHeight > 0) {
        startScrollAnimation()
      }
    })
    return () => subscription?.remove()
  }, [showText, contentHeight, scrollSpeedMultiplier, fontSize, scriptText])

  useEffect(() => {
    if (showText && contentHeight > 0) {
      startScrollAnimation()
    }
  }, [showText, contentHeight, scrollSpeedMultiplier, fontSize, scriptText])

  // Helper function to check if all permissions are granted
  const hasAllPermissions = () => {
    return hasCameraPermission === true && hasMicrophonePermission === true
  }

  useEffect(() => {
    loadSavedScript()
  }, [])

  // Recording timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingIntervalRef.current = setInterval(() => {
        const currentTime = Date.now()
        if (recordingStartTime) {
          const elapsed = currentTime - recordingStartTime
          setRecordingTime(elapsed)
          
          // Auto-stop when time limit reached
          if (elapsed >= maxRecordingTime) {
            handleCameraButton() // Stop recording
          }
        }
      }, 100)
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording, isPaused, recordingStartTime, maxRecordingTime])

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isRecording) {
          backPressedRef.current = true
          setIsRecording(false)
          if (cameraRef.current) cameraRef.current.stopRecording()
          router.back()
          return true
        }
        return false
      }
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      )
      return () => subscription.remove()
    }, [isRecording])
  )

  const toggleTheme = () => setIsDarkMode(!isDarkMode)
  const onContentSizeChange = (_: number, height: number) =>
    setContentHeight(height)

  const startScrollAnimation = (resumeFromCurrent = false) => {
    if (contentHeight > 0) {
      const viewHeight = SCREEN_HEIGHT * 0.3
      const scrollDistance = contentHeight + viewHeight / 2
      const baseScrollSpeed = moderateScale(20)
      const adjustedScrollSpeed = baseScrollSpeed * scrollSpeedMultiplier
      const duration = (scrollDistance / adjustedScrollSpeed) * 600

      if (!resumeFromCurrent) {
        scrollY.setValue(viewHeight / 2)
      }
      
      if (animationRef.current) animationRef.current.stop()

      // Calculate remaining distance from current position
      const currentValue = scrollY._value
      const remainingDistance = Math.abs(-contentHeight - currentValue)
      const adjustedDuration = resumeFromCurrent ? 
        (remainingDistance / scrollDistance) * duration : duration

      animationRef.current = Animated.timing(scrollY, {
        toValue: -contentHeight,
        duration: adjustedDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
      animationRef.current.start()
    }
  }

  const startCountdown = () => {
    if (countdownInProgress || !hasAllPermissions()) return

    setCountdownInProgress(true)
    setShowCountdown(true)
    setCountdownText("5")
    countdownScale.setValue(1)

    const countdownSteps = ["4", "3", "2", "1", "GO"]
    countdownSteps.forEach((text, index) => {
      setTimeout(() => setCountdownText(text), (index + 1) * 1000)
    })

    const sequence = Animated.sequence(
      Array(6).fill(
        Animated.sequence([
          Animated.timing(countdownScale, {
            toValue: 0.5,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(countdownScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    )

    sequence.start(() => {
      setCountdownInProgress(false)
      setShowCountdown(false)
      setShowText(true)
      handleCameraButton()
    })
  }
  const toggleCameraAspectRatio = () => {
    setCameraAspectRatio((prev) =>
      prev === "portrait" ? "landscape" : "portrait"
    )
  }

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => prev === "front" ? "back" : "front")
  }

  const toggleTeleprompterOrientation = () => {
    setTeleprompterOrientation((prev) =>
      prev === "portrait" ? "landscape" : "portrait"
    )
  }

  const handleCameraButton = async () => {
    if (countdownInProgress) {
      setCountdownInProgress(false)
      setShowCountdown(false)
      setCountdownText("5")
      countdownScale.setValue(1)
      return
    }

    if (isRecording) {
      // Stop recording completely
      setIsRecording(false)
      setIsPaused(false)
      if (cameraRef.current) {
        cameraRef.current.stopRecording()
      }
      setRecordingReady(false)
      setShowText(false)
      setRecordingTime(0)
      setRecordingStartTime(null)
      // Stop teleprompter animation when recording is stopped
      if (animationRef.current) {
        animationRef.current.stop()
      }
    } else {
      // Check permissions before starting recording
      if (!hasAllPermissions()) {
        console.log("Recording blocked - missing permissions")
        setPermissionError("Camera and microphone permissions are required for video recording")
        setShowPermissionDialog(true)
        return
      }
      
      if (cameraRef.current) {
        setIsRecording(true)
        setIsPaused(false)
        setRecordingReady(false)
        setRecordingStartTime(Date.now())
        recordingPromiseRef.current = cameraRef.current.recordAsync()
        setTimeout(() => setRecordingReady(true), 500)

        try {
          const video = await recordingPromiseRef.current
          setIsRecording(false)
          setRecordingReady(false)
          setRecordingTime(0)
          setRecordingStartTime(null)

          if (backPressedRef.current) {
            if (video?.uri) {
              FileSystem.deleteAsync(video.uri, { idempotent: true }).catch(
                () => { }
              )
            }
            backPressedRef.current = false
            return
          }

          if (video?.uri) {
            setRecordedUri(video.uri)
            // Save video to AsyncStorage with AWS upload flagging
            await saveVideoWithUploadFlag(video.uri)
            // Don't navigate to preview automatically, just store the video URI
          }
        } catch (err) {
          setIsRecording(false)
          setRecordingReady(false)
          setRecordingTime(0)
          setRecordingStartTime(null)
          backPressedRef.current = false
        }
      }
    }
  }

  const handlePauseResume = () => {
    if (!isRecording) return
    
    setIsPaused(!isPaused)
    
    if (isPaused) {
      // Resume: adjust start time to account for paused duration
      const pausedDuration = Date.now() - (recordingStartTime || 0) - recordingTime
      setRecordingStartTime((recordingStartTime || 0) + pausedDuration)
      // Resume teleprompter animation
      if (showText && contentHeight > 0) {
        startScrollAnimation(true)
      }
    } else {
      // Pause teleprompter animation
      if (animationRef.current) {
        animationRef.current.stop()
      }
    }
  }

  const handleRestart = () => {
    setShowText(false)
    setContentHeight(0)
    scrollY.setValue(0)
    startCountdown()
  }

  const cycleSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2, 2.5, 3];
    const currentIndex = speeds.indexOf(scrollSpeedMultiplier);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setScrollSpeedMultiplier(speeds[nextIndex]);
  };

  const increaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.min(prev + 2, 50);
      if (showText && contentHeight > 0) {
        setTimeout(() => startScrollAnimation(true), 100);
      }
      return newSize;
    });
  };

  const decreaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.max(prev - 2, 12);
      if (showText && contentHeight > 0) {
        setTimeout(() => startScrollAnimation(true), 100);
      }
      return newSize;
    });
  };

  const resetFontSize = () => {
    setFontSize(20);
    if (showText && contentHeight > 0) {
      setTimeout(() => startScrollAnimation(true), 100);
    }
  };

  const toggleSettings = () => {
    if (showSettings && showFontControls) setShowFontControls(false)
    Animated.timing(settingsAnim, {
      toValue: showSettings ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
    setShowSettings(!showSettings)
  }

  const toggleFontControls = () => setShowFontControls(!showFontControls)
  const handleLongPress = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync()
      if (clipboardContent) {
        handlePaste(clipboardContent)
      }
    } catch (err) {
      console.warn("Failed to read from clipboard:", err)
    }
  }

  const handlePaste = (text: string) => {
    setScriptText(text)
    setShowPasteSuccess(true)
    Animated.timing(pasteSuccessAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(pasteSuccessAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => setShowPasteSuccess(false))
      }, 2000)
    })
  }

  const toggleEditModal = () => {
    setShowEditModal(!showEditModal)
  }

  const loadSavedScript = async () => {
    try {
      const savedScript = await AsyncStorage.getItem('teleprompter_script')
      if (savedScript) {
        setScriptText(savedScript)
      }
    } catch (error) {
      console.log('Error loading saved script:', error)
    }
  }

  const saveVideoWithUploadFlag = async (videoUri: string) => {
    try {
      // Get existing videos from AsyncStorage
      const existingVideos = await AsyncStorage.getItem('saved_videos')
      const videos = existingVideos ? JSON.parse(existingVideos) : []
      
      // Create new video object with AWS upload flagging
      const newVideo = {
        id: Date.now().toString(),
        uri: videoUri,
        mode: recordingMode,
        createdAt: new Date().toISOString(),
        flaggedForUpload: true, // Flag for AWS upload
        uploaded: false, // Not uploaded yet
        title: `${recordingMode === '1min' ? '1-Minute Pitch' : '3-Minute Presentation'} recording`,
        duration: recordingMode === '1min' ? 'Up to 1:00' : 'Up to 3:00'
      }
      
      // Add new video to the beginning of the array
      videos.unshift(newVideo)
      
      // Save updated videos array
      await AsyncStorage.setItem('saved_videos', JSON.stringify(videos))
      
      console.log('Video saved with upload flag:', newVideo)
    } catch (error) {
      console.error('Error saving video with upload flag:', error)
    }
  }

  // Debug logging for render states
  console.log("Render - Camera Permission:", hasCameraPermission, "Microphone Permission:", hasMicrophonePermission)
  console.log("Render - hasAllPermissions():", hasAllPermissions())
  console.log("Render - permissionError:", permissionError)

  return (
    <View style={styles.fullScreenContainer}>
      {/* Full Screen Camera */}
      {permissionLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.permissionText, { marginBottom: 20 }]}>Checking permissions...</Text>
          <LottieView
            autoPlay
            loop={true}
            style={styles.lottie}
            source={require("../../assets/lottie/Animation - 1751571052954.json")}
          />
          <Text style={[styles.permissionText, { fontSize: 14, marginTop: 20 }]}>
            Camera: {hasCameraPermission === null ? 'Checking...' : hasCameraPermission ? 'Permission granted' : 'Permission denied'}
          </Text>
          <Text style={[styles.permissionText, { fontSize: 14, marginTop: 10 }]}>
            Microphone: {hasMicrophonePermission === null ? 'Checking...' : hasMicrophonePermission ? 'Permission granted' : 'Permission denied'}
          </Text>
        </View>
      ) : hasAllPermissions() ? (
        <CameraView
          mode="video"
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
        />
      ) : (
        <View style={styles.permissionContainer}>
          <MaterialIcons
            name="videocam-off"
            size={60}
            color="#ff6b6b"
            style={{ marginBottom: 20 }}
          />
          <Text style={[styles.permissionText, { fontSize: 18, fontWeight: '600', marginBottom: 15 }]}>
            Permission Required
          </Text>
          <Text style={styles.permissionText}>
            {permissionError || "Camera and microphone permissions are required"}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 20 }}>
            <View style={{ alignItems: 'center', marginHorizontal: 15 }}>
              <MaterialIcons
                name={hasCameraPermission ? "check-circle" : "cancel"}
                size={24}
                color={hasCameraPermission ? "#4CAF50" : "#ff6b6b"}
              />
              <Text style={[styles.permissionText, { fontSize: 12, marginTop: 5 }]}>Camera</Text>
            </View>
            <View style={{ alignItems: 'center', marginHorizontal: 15 }}>
              <MaterialIcons
                name={hasMicrophonePermission ? "check-circle" : "cancel"}
                size={24}
                color={hasMicrophonePermission ? "#4CAF50" : "#ff6b6b"}
              />
              <Text style={[styles.permissionText, { fontSize: 12, marginTop: 5 }]}>Microphone</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={async () => {
              console.log("Retry button pressed")
              setPermissionLoading(true)
              setHasCameraPermission(null)
              setHasMicrophonePermission(null)
              setPermissionError(null)
              setShowPermissionDialog(false)
              
              try {
                // Request permissions again
                const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync()
                const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync()
                
                console.log("Retry - Camera:", cameraStatus, "Audio:", audioStatus)
                
                setHasCameraPermission(cameraStatus === "granted")
                setHasMicrophonePermission(audioStatus === "granted")
                
                // Set error messages for denied permissions
                if (cameraStatus !== "granted" && audioStatus !== "granted") {
                  setPermissionError("Camera and microphone permissions are required for video recording")
                  setShowPermissionDialog(true)
                } else if (cameraStatus !== "granted") {
                  setPermissionError("Camera permission is required for video recording")
                  setShowPermissionDialog(true)
                } else if (audioStatus !== "granted") {
                  setPermissionError("Microphone permission is required for video recording")
                  setShowPermissionDialog(true)
                } else {
                  setShowPermissionDialog(false)
                }
                
                setPermissionLoading(false)
              } catch (error) {
                console.error("Permission retry failed:", error)
                setPermissionError("Permission request failed. Please try again.")
                setShowPermissionDialog(true)
                setPermissionLoading(false)
              }
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: '#666', marginTop: 10 }]} 
            onPress={() => {
              console.log("Opening device settings")
              // Note: Opening device settings requires platform-specific implementation
              // For now, show instruction to user
              setPermissionError("Please go to device Settings > Apps > Teleprompter > Permissions and enable Camera and Microphone")
            }}
          >
            <Text style={styles.retryButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Controls - Only Timer */}
      <View style={styles.topControls}>
        {/* Recording Timer */}
        {isRecording && (
          <View style={styles.timerContainer}>
            <View style={[styles.recordingDot, isPaused && styles.pausedDot]} />
            <Text style={styles.timerText}>
              {Math.floor(recordingTime / 60000).toString().padStart(2, '0')}:
              {Math.floor((recordingTime % 60000) / 1000).toString().padStart(2, '0')}
              {isPaused && ' (PAUSED)'}
            </Text>
            <Text style={styles.limitText}>
              / {Math.floor(maxRecordingTime / 60000)}:00
            </Text>
          </View>
        )}
      </View>

      {/* Teleprompter Overlay */}
      <TouchableOpacity
        style={[
          teleprompterOrientation === 'landscape' ? styles.teleprompterLandscape : styles.teleprompterOverlay
        ]}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={false}
          onContentSizeChange={onContentSizeChange}
        >
          <Animated.View style={{ transform: [{ translateY: scrollY }] }}>
            {showText && (
              <Text
                style={[
                  styles.teleprompterText,
                  { fontSize },
                ]}
              >
                {scriptText || "Write your script here"}
              </Text>
            )}
            {!showText && !showCountdown && (
              <Text
                style={[
                  styles.teleprompterText,
                  { fontSize: moderateScale(16) },
                ]}
              >
                {scriptText || "Write your script here"}
              </Text>
            )}
          </Animated.View>
        </ScrollView>
        
        {/* Edit Icon */}
        <TouchableOpacity style={styles.editIcon} onPress={toggleEditModal}>
          <MaterialIcons
            name="edit"
            size={moderateScale(20)}
            color="white"
          />
        </TouchableOpacity>
        
        {/* Settings Icon */}
        <TouchableOpacity style={styles.settingsIcon} onPress={toggleSettings}>
          <MaterialIcons
            name="settings"
            size={moderateScale(20)}
            color="white"
          />
        </TouchableOpacity>
        
        {/* Rotate Icon */}
        <TouchableOpacity style={styles.rotateIcon} onPress={toggleTeleprompterOrientation}>
          <MaterialIcons
            name="screen-rotation"
            size={moderateScale(20)}
            color="white"
          />
        </TouchableOpacity>
        
        {/* Settings Panel */}
        {showSettings && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: moderateScale(50),
                right: moderateScale(10),
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: moderateScale(10),
                padding: moderateScale(15),
                minWidth: moderateScale(200),
              },
              {
                opacity: settingsAnim,
                transform: [
                  {
                    translateY: settingsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-moderateScale(20), 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Font Size Controls */}
            <View style={{ marginBottom: moderateScale(15) }}>
              <Text style={{ color: 'white', fontSize: moderateScale(14), marginBottom: moderateScale(8) }}>
                Font Size
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  onPress={decreaseFontSize}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: moderateScale(20),
                    width: moderateScale(35),
                    height: moderateScale(35),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="remove" size={moderateScale(18)} color="white" />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: moderateScale(12), marginHorizontal: moderateScale(10) }}>
                  {Math.round(fontSize)}
                </Text>
                <TouchableOpacity
                  onPress={increaseFontSize}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: moderateScale(20),
                    width: moderateScale(35),
                    height: moderateScale(35),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="add" size={moderateScale(18)} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={resetFontSize}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: moderateScale(15),
                    paddingHorizontal: moderateScale(8),
                    paddingVertical: moderateScale(4),
                    marginLeft: moderateScale(10),
                  }}
                >
                  <Text style={{ color: 'white', fontSize: moderateScale(10) }}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Speed Controls */}
            <View>
              <Text style={{ color: 'white', fontSize: moderateScale(14), marginBottom: moderateScale(8) }}>
                Scroll Speed
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  onPress={() => {
                    setScrollSpeedMultiplier(prev => {
                      const newSpeed = Math.max(prev - 0.5, 0.5);
                      if (showText && contentHeight > 0) {
                        setTimeout(() => startScrollAnimation(true), 100);
                      }
                      return newSpeed;
                    });
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: moderateScale(20),
                    width: moderateScale(35),
                    height: moderateScale(35),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="remove" size={moderateScale(18)} color="white" />
                </TouchableOpacity>
                <Text style={{ color: 'white', fontSize: moderateScale(12), marginHorizontal: moderateScale(10) }}>
                  {scrollSpeedMultiplier}x
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setScrollSpeedMultiplier(prev => {
                      const newSpeed = Math.min(prev + 0.5, 5);
                      if (showText && contentHeight > 0) {
                        setTimeout(() => startScrollAnimation(true), 100);
                      }
                      return newSpeed;
                    });
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: moderateScale(20),
                    width: moderateScale(35),
                    height: moderateScale(35),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="add" size={moderateScale(18)} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setScrollSpeedMultiplier(1);
                    if (showText && contentHeight > 0) {
                      setTimeout(() => startScrollAnimation(true), 100);
                    }
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: moderateScale(15),
                    paddingHorizontal: moderateScale(8),
                    paddingVertical: moderateScale(4),
                    marginLeft: moderateScale(10),
                  }}
                >
                  <Text style={{ color: 'white', fontSize: moderateScale(10) }}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Camera Controls Below Teleprompter */}
      <View style={styles.cameraControlsBelow}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="close"
            size={moderateScale(24)}
            color="white"
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cameraFlipButton}
          onPress={toggleCameraFacing}
        >
          <MaterialIcons
            name="flip-camera-ios"
            size={moderateScale(24)}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Recording Controls Below Camera Controls */}
      <View style={styles.recordingControlsBelow}>
        <TouchableOpacity
          style={styles.sideButton}
          onPress={handleRestart}
        >
          <MaterialIcons
            name="refresh"
            size={moderateScale(24)}
            color="white"
          />
        </TouchableOpacity>
        
        {/* Pause/Resume Button (only show when recording) */}
        {isRecording && (
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={handlePauseResume}
          >
            <MaterialIcons 
              name={isPaused ? "play-arrow" : "pause"} 
              size={moderateScale(24)} 
              color="white" 
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => {
            if (!isRecording) {
              // Check permissions before starting countdown
              if (!hasAllPermissions()) {
                setPermissionError("Camera and microphone permissions are required for video recording")
                setShowPermissionDialog(true)
                return
              }
              startCountdown();
            } else {
              handleCameraButton();
            }
          }}
        >
          {isRecording ? (
            <MaterialIcons
              name="stop"
              size={moderateScale(32)}
              color="white"
            />
          ) : (
            <View style={[
              styles.recordButtonInner,
              { backgroundColor: "#FF0000" }
            ]} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.sideButton}
          onPress={() => {
            // OK/Done functionality - navigate to preview if video exists
            if (recordedUri) {
              router.replace({
                pathname: "/screens/PreviewVideoShoot",
                params: { videoUri: recordedUri, orientation: cameraAspectRatio },
              });
            } else {
              router.back();
            }
          }}
        >
          <MaterialIcons
            name="check"
            size={moderateScale(24)}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Countdown Overlay */}
      {showCountdown && (
        <View style={styles.countdownContainer}>
          <Animated.Text
            style={[
              styles.countdownText,
              {
                transform: [{ scale: countdownScale }],
              },
            ]}
          >
            {countdownText}
          </Animated.Text>
        </View>
      )}

      {/* Paste Success Message */}
      {showPasteSuccess && (
        <Animated.View
          style={[
            styles.pasteSuccessContainer,
            {
              opacity: pasteSuccessAnim,
              transform: [
                {
                  translateY: pasteSuccessAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [moderateScale(20), 0],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialIcons
            name="check-circle"
            size={moderateScale(24)}
            color="white"
          />
          <Text style={styles.pasteSuccessText}>
            Script pasted successfully
          </Text>
        </Animated.View>
      )}

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleEditModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: moderateScale(20)
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: moderateScale(15),
            padding: moderateScale(20),
            width: '100%',
            maxHeight: '80%'
          }}>
            <Text style={{
              fontSize: moderateScale(18),
              fontWeight: 'bold',
              marginBottom: moderateScale(15),
              textAlign: 'center',
              color: '#333'
            }}>
              Edit Script
            </Text>
            
            <TextInput
              ref={textInputRef}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: moderateScale(10),
                padding: moderateScale(15),
                fontSize: moderateScale(16),
                textAlignVertical: 'top',
                minHeight: moderateScale(200),
                maxHeight: moderateScale(300),
                backgroundColor: '#f9f9f9'
              }}
              multiline={true}
              placeholder="Enter your script here..."
              value={scriptText}
              onChangeText={setScriptText}
              autoFocus={true}
            />
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: moderateScale(20)
            }}>
              <TouchableOpacity
                onPress={toggleEditModal}
                style={{
                  backgroundColor: '#6c757d',
                  paddingHorizontal: moderateScale(30),
                  paddingVertical: moderateScale(12),
                  borderRadius: moderateScale(25),
                  flex: 0.45
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: moderateScale(16),
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await AsyncStorage.setItem('teleprompter_script', scriptText)
                  } catch (error) {
                    console.log('Error saving script:', error)
                  }
                  toggleEditModal()
                  // Restart animation if text is showing
                  if (showText && contentHeight > 0) {
                    setTimeout(() => startScrollAnimation(true), 100)
                  }
                }}
                style={{
                  backgroundColor: '#007bff',
                  paddingHorizontal: moderateScale(30),
                  paddingVertical: moderateScale(12),
                  borderRadius: moderateScale(25),
                  flex: 0.45
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: moderateScale(16),
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default VideoShoot