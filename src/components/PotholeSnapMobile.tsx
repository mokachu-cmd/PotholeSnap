import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { estimatePotholeDimensions } from '@/ai/flows/estimate-pothole-dimensions';
import { estimateRoadMaterial } from '@/ai/flows/estimate-road-material';
import { classifyPotholeSeverity } from '@/ai/flows/classify-pothole-severity';
import { estimatePotholeVolume } from '@/ai/flows/estimate-pothole-volume';
import { detectPotholes } from '@/ai/flows/automatically-detect-potholes';

const { width, height } = Dimensions.get('window');

type Step = 'welcome' | 'camera' | 'preview' | 'analyzing' | 'results';

type AnalysisResults = {
  dimensions?: any;
  material?: any;
  severity?: any;
  volume?: any;
  detection?: any;
};

export default function PotholeSnapMobile() {
  const [step, setStep] = useState<Step>('welcome');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const resetState = () => {
    setStep('welcome');
    setImageUri(null);
    setLocation(null);
    setAnalysisResults({});
    setIsLoading(false);
    setAnalysisProgress(0);
    setAnalysisMessage('');
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (cameraStatus !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to capture pothole images.');
      return false;
    }
    
    if (locationStatus !== 'granted') {
      Alert.alert('Permission needed', 'Location permission is required to tag pothole locations.');
      return false;
    }
    
    return true;
  };

  const startCapture = async () => {
    const hasPermissions = await requestPermissions();
    if (hasPermissions) {
      setStep('camera');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        
        if (photo) {
          setImageUri(photo.uri);
          
          // Get location
          try {
            const locationResult = await Location.getCurrentPositionAsync({});
            setLocation({
              lat: locationResult.coords.latitude,
              lon: locationResult.coords.longitude,
            });
          } catch (error) {
            console.error('Location error:', error);
          }
          
          setStep('preview');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to capture image');
        console.error('Camera error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep('preview');
    }
  };

  const runAnalysis = async () => {
    if (!imageUri) return;

    setStep('analyzing');
    setIsLoading(true);

    try {
      // Convert image to data URI
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        
        try {
          let dimensions: any;
          let allResults: AnalysisResults = {};

          setAnalysisProgress(10);
          setAnalysisMessage('Detecting potholes...');
          const detectionResult = await detectPotholes({ photoDataUri: dataUri });
          allResults.detection = detectionResult;
          const analysisUri = detectionResult.highlightedImage || dataUri;
          setAnalysisProgress(25);

          setAnalysisMessage('Estimating dimensions and material...');
          const [dimensionsResult, materialResult] = await Promise.all([
            estimatePotholeDimensions({ photoDataUri: analysisUri }),
            estimateRoadMaterial({ photoDataUri: analysisUri }),
          ]);
          dimensions = dimensionsResult;
          allResults = { ...allResults, dimensions, material: materialResult };
          setAnalysisProgress(60);

          setAnalysisMessage('Classifying severity and volume...');
          const [severityResult, volumeResult] = await Promise.all([
            classifyPotholeSeverity({ photoDataUri: analysisUri, ...dimensions }),
            estimatePotholeVolume(dimensions),
          ]);
          allResults = { ...allResults, severity: severityResult, volume: volumeResult };
          setAnalysisProgress(100);

          setAnalysisResults(allResults);
          setStep('results');
        } catch (error) {
          console.error('AI Analysis Error:', error);
          Alert.alert('Analysis Failed', 'An error occurred during AI analysis. Please try again.');
          setStep('preview');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error', 'Failed to process image');
      setIsLoading(false);
      setStep('preview');
    }
  };

  const renderWelcomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.welcomeContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="camera" size={80} color="#29ABE2" />
        </View>
        <Text style={styles.title}>Pothole Snap</Text>
        <Text style={styles.subtitle}>
          Your AI-powered assistant for road damage assessment. Capture, analyze, and report potholes in seconds.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={startCapture}>
          <Ionicons name="camera" size={24} color="white" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Start Inspection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
          <Ionicons name="images" size={24} color="#29ABE2" style={styles.buttonIcon} />
          <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderCameraScreen = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.cameraOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('welcome')}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Ionicons name="camera" size={32} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );

  const renderPreviewScreen = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.previewContainer}>
        <Text style={styles.sectionTitle}>Confirm Image</Text>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={resetState}
          >
            <Ionicons name="close" size={20} color="#29ABE2" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { flex: 1, marginLeft: 10 }]}
            onPress={runAnalysis}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="analytics" size={20} color="white" style={styles.buttonIcon} />
            )}
            <Text style={styles.primaryButtonText}>Analyze Pothole</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderAnalyzingScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.analyzingContainer}>
        <ActivityIndicator size="large" color="#29ABE2" />
        <Text style={styles.analyzingTitle}>Analyzing...</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${analysisProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{analysisMessage}</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderResultsScreen = () => {
    const { detection, dimensions, material, severity, volume } = analysisResults;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Analysis Complete</Text>
          <Text style={styles.subtitle}>Review the AI-generated report below.</Text>
          
          {detection?.highlightedImage && (
            <Image
              source={{ uri: detection.highlightedImage }}
              style={styles.resultImage}
            />
          )}

          <View style={styles.dataGrid}>
            <View style={styles.dataCard}>
              <Ionicons name="location" size={24} color="#29ABE2" />
              <Text style={styles.dataLabel}>Location</Text>
              <Text style={styles.dataValue}>
                {location
                  ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
                  : 'Not available'}
              </Text>
            </View>

            <View style={styles.dataCard}>
              <Ionicons name="calendar" size={24} color="#29ABE2" />
              <Text style={styles.dataLabel}>Date & Time</Text>
              <Text style={styles.dataValue}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.dataCard}>
              <Ionicons name="resize" size={24} color="#29ABE2" />
              <Text style={styles.dataLabel}>Dimensions (cm)</Text>
              <Text style={styles.dataValue}>
                {dimensions
                  ? `L:${dimensions.length} W:${dimensions.width} D:${dimensions.depth}`
                  : 'N/A'}
              </Text>
            </View>

            <View style={styles.dataCard}>
              <Ionicons name="warning" size={24} color="#29ABE2" />
              <Text style={styles.dataLabel}>Severity</Text>
              <Text style={[styles.dataValue, styles.capitalize]}>
                {severity?.severity || 'N/A'}
              </Text>
            </View>

            <View style={styles.dataCard}>
              <Ionicons name="construct" size={24} color="#29ABE2" />
              <Text style={styles.dataLabel}>Road Material</Text>
              <Text style={[styles.dataValue, styles.capitalize]}>
                {material?.materialType || 'N/A'}
              </Text>
            </View>

            <View style={styles.dataCard}>
              <Ionicons name="cube" size={24} color="#29ABE2" />
              <Text style={styles.dataLabel}>Est. Volume (cm³)</Text>
              <Text style={styles.dataValue}>
                {volume?.volume ? Math.round(volume.volume) : 'N/A'}
              </Text>
            </View>
          </View>

          {severity?.justification && (
            <View style={styles.justificationCard}>
              <View style={styles.justificationHeader}>
                <Ionicons name="information-circle" size={20} color="#29ABE2" />
                <Text style={styles.justificationTitle}>Justification</Text>
              </View>
              <Text style={styles.justificationText}>{severity.justification}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.submitButton}>
            <Ionicons name="checkmark-circle" size={24} color="white" style={styles.buttonIcon} />
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={resetState}
          >
            <Ionicons name="refresh" size={20} color="#29ABE2" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Start New Inspection</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  };

  switch (step) {
    case 'welcome':
      return renderWelcomeScreen();
    case 'camera':
      return renderCameraScreen();
    case 'preview':
      return renderPreviewScreen();
    case 'analyzing':
      return renderAnalyzingScreen();
    case 'results':
      return renderResultsScreen();
    default:
      return renderWelcomeScreen();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(41, 171, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#29ABE2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#29ABE2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  secondaryButtonText: {
    color: '#29ABE2',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#29ABE2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  previewContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#29ABE2',
    borderRadius: 2,
  },
  progressText: {
    color: '#29ABE2',
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    padding: 20,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dataCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  dataLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  dataValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  justificationCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  justificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  justificationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  justificationText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 15,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});