# Pothole Snap Mobile

A cross-platform mobile application for AI-powered pothole analysis and reporting, built with React Native and Expo.

## Features

- **Cross-Platform**: Runs on both iOS and Android
- **Camera Integration**: Capture pothole images directly from the app
- **AI Analysis**: Estimate dimensions, material, severity, and volume
- **Location Tagging**: Automatically tag pothole locations
- **Offline Capable**: Works without internet connection (sync when online)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Expo CLI: `npm install -g @expo/cli`
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your Google AI API key to .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Running on Devices

#### iOS Simulator (macOS only)
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

#### Physical Device
1. Install Expo Go app on your device
2. Scan the QR code from the terminal

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Project Structure

```
src/
├── app/                 # App router screens
├── components/          # React Native components
├── ai/                  # AI analysis flows
└── hooks/              # Custom hooks

assets/                  # App icons and splash screens
```

## Key Dependencies

- **Expo**: Development platform and build tools
- **React Native**: Cross-platform mobile framework
- **Expo Camera**: Camera functionality
- **Expo Location**: GPS location services
- **Expo Image Picker**: Gallery image selection
- **Google AI**: AI analysis capabilities

## Permissions

The app requires the following permissions:
- Camera access (for capturing pothole images)
- Location access (for tagging pothole locations)
- Photo library access (for selecting existing images)

## AI Features

- Pothole detection and highlighting
- Dimension estimation (length, width, depth)
- Road material identification
- Severity classification
- Volume calculation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## License

This project is licensed under the MIT License.