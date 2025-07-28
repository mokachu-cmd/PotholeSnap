"use client";

import { useState, useMemo, type ReactNode, useRef } from "react";
import Image from "next/image";
import {
  Camera,
  MapPin,
  Calendar,
  Ruler,
  AlertTriangle,
  Beaker,
  TestTube,
  CheckCircle,
  Loader,
  Upload,
  Info,
  X,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { OnboardingGuide } from "@/components/pothole-snap/OnboardingGuide";
import { IconCard } from "@/components/pothole-snap/IconCard";
import type { EstimatePotholeDimensionsOutput } from "@/ai/flows/estimate-pothole-dimensions";
import { estimatePotholeDimensions } from "@/ai/flows/estimate-pothole-dimensions";
import type { EstimateRoadMaterialOutput } from "@/ai/flows/estimate-road-material";
import { estimateRoadMaterial } from "@/ai/flows/estimate-road-material";
import type { ClassifyPotholeSeverityOutput } from "@/ai/flows/classify-pothole-severity";
import { classifyPotholeSeverity } from "@/ai/flows/classify-pothole-severity";
import type { EstimatePotholeVolumeOutput } from "@/ai/flows/estimate-pothole-volume";
import { estimatePotholeVolume } from "@/ai/flows/estimate-pothole-volume";
import type { DetectPotholesOutput } from "@/ai/flows/automatically-detect-potholes";
import { detectPotholes } from "@/ai/flows/automatically-detect-potholes";

type Step = "welcome" | "capturing" | "analyzing" | "results";
type AnalysisResults = {
  dimensions?: EstimatePotholeDimensionsOutput;
  material?: EstimateRoadMaterialOutput;
  severity?: ClassifyPotholeSeverityOutput;
  volume?: EstimatePotholeVolumeOutput;
  detection?: DetectPotholesOutput;
};

const fileToDataUri = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function PotholeSnapClient() {
  const [step, setStep] = useState<Step>("welcome");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("welcome");
    setImageFile(null);
    setImageDataUri(null);
    setLocation(null);
    setAnalysisResults({});
    setIsLoading(false);
    setAnalysisProgress(0);
    setAnalysisMessage("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      fileToDataUri(file)
        .then((uri) => {
          setImageFile(file);
          setImageDataUri(uri);
          setStep("capturing");
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
              });
              setIsLoading(false);
            },
            (error) => {
              console.error("Geolocation error:", error);
              toast({
                variant: "destructive",
                title: "Location Error",
                description: "Could not get your location. Please ensure location services are enabled.",
              });
              setIsLoading(false);
            }
          );
        })
        .catch(() => {
          toast({
            variant: "destructive",
            title: "Image Error",
            description: "Could not read the selected image file.",
          });
          setIsLoading(false);
        });
    }
  };

  const runAnalysis = async () => {
    if (!imageDataUri) return;

    setStep("analyzing");
    setIsLoading(true);

    try {
      let dimensions: EstimatePotholeDimensionsOutput;
      let allResults: AnalysisResults = {};

      setAnalysisProgress(10);
      setAnalysisMessage("Detecting potholes...");
      const detectionResult = await detectPotholes({ photoDataUri: imageDataUri });
      allResults.detection = detectionResult;
      const analysisUri = detectionResult.highlightedImage || imageDataUri;
      setAnalysisProgress(25);

      setAnalysisMessage("Estimating dimensions and material...");
      const [dimensionsResult, materialResult] = await Promise.all([
        estimatePotholeDimensions({ photoDataUri: analysisUri }),
        estimateRoadMaterial({ photoDataUri: analysisUri }),
      ]);
      dimensions = dimensionsResult;
      allResults = { ...allResults, dimensions, material: materialResult };
      setAnalysisProgress(60);

      setAnalysisMessage("Classifying severity and volume...");
      const [severityResult, volumeResult] = await Promise.all([
        classifyPotholeSeverity({ photoDataUri: analysisUri, ...dimensions }),
        estimatePotholeVolume(dimensions),
      ]);
      allResults = { ...allResults, severity: severityResult, volume: volumeResult };
      setAnalysisProgress(100);

      setAnalysisResults(allResults);
      setStep("results");
    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "An error occurred during AI analysis. Please try again.",
      });
      setStep("capturing");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return <WelcomeScreen onStart={() => fileInputRef.current?.click()} />;
      case "capturing":
        return (
          <CaptureScreen
            imageUri={imageDataUri!}
            onAnalyze={runAnalysis}
            onCancel={resetState}
            isLoading={isLoading}
          />
        );
      case "analyzing":
        return (
          <AnalyzingScreen
            progress={analysisProgress}
            message={analysisMessage}
          />
        );
      case "results":
        return (
          <ResultsScreen
            results={analysisResults}
            location={location}
            onNewInspection={resetState}
          />
        );
      default:
        return <WelcomeScreen onStart={() => fileInputRef.current?.click()} />;
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="w-full max-w-md mx-auto">{renderStep()}</div>
    </main>
  );
}

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="text-center space-y-6">
    <div className="flex justify-center items-center">
      <div className="p-4 bg-primary/10 rounded-full">
        <div className="p-3 bg-primary/20 rounded-full">
          <Camera className="w-12 h-12 text-primary" />
        </div>
      </div>
    </div>
    <h1 className="text-4xl font-bold font-headline">Pothole Snap</h1>
    <p className="text-muted-foreground">
      Your AI-powered assistant for road damage assessment. Capture, analyze, and report potholes in seconds.
    </p>
    <Button size="lg" onClick={onStart} className="w-full">
      <Upload className="mr-2" /> Start Inspection
    </Button>
    <OnboardingGuide />
  </div>
);

const CaptureScreen = ({ imageUri, onAnalyze, onCancel, isLoading }: {
  imageUri: string;
  onAnalyze: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>Confirm Image</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="rounded-lg overflow-hidden border-2 border-primary shadow-lg">
        <Image
          src={imageUri}
          alt="Captured pothole"
          width={400}
          height={400}
          className="w-full h-auto object-cover"
          data-ai-hint="pothole road"
        />
      </div>
      <div className="flex gap-2 w-full">
        <Button variant="outline" onClick={onCancel} className="w-1/2">
          <X className="mr-2" /> Cancel
        </Button>
        <Button onClick={onAnalyze} disabled={isLoading} className="w-1/2">
          {isLoading ? (
            <Loader className="mr-2 animate-spin" />
          ) : (
            <CheckCircle className="mr-2" />
          )}
          Analyze Pothole
        </Button>
      </div>
    </CardContent>
  </Card>
);

const AnalyzingScreen = ({ progress, message }: { progress: number; message: string }) => (
  <div className="text-center space-y-6 flex flex-col items-center">
    <Loader className="w-16 h-16 text-primary animate-spin" />
    <h2 className="text-3xl font-bold font-headline">Analyzing...</h2>
    <div className="w-full space-y-2">
      <Progress value={progress} className="w-full" />
      <p className="text-primary text-sm font-medium">{message}</p>
    </div>
  </div>
);

const ResultsScreen = ({ results, location, onNewInspection }: {
  results: AnalysisResults;
  location: { lat: number; lon: number } | null;
  onNewInspection: () => void;
}) => {
  const { detection, dimensions, material, severity, volume } = results;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline">Analysis Complete</h2>
        <p className="text-muted-foreground">Review the AI-generated report below.</p>
      </div>
      <Card>
        <CardContent className="p-4">
          {detection?.highlightedImage && (
            <Image
              src={detection.highlightedImage}
              alt="Analyzed pothole with detection overlay"
              width={400}
              height={400}
              className="rounded-lg w-full h-auto object-cover"
              data-ai-hint="pothole road"
            />
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <IconCard icon={<MapPin />} title="Location">
          {location
            ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
            : "Not available"}
        </IconCard>
        <IconCard icon={<Calendar />} title="Date & Time">
          {new Date().toLocaleDateString()}
        </IconCard>
        <IconCard icon={<Ruler />} title="Dimensions (cm)">
          {dimensions
            ? `L:${dimensions.length} W:${dimensions.width} D:${dimensions.depth}`
            : "N/A"}
        </IconCard>
        <IconCard icon={<AlertTriangle />} title="Severity">
          <span className="capitalize">{severity?.severity || "N/A"}</span>
        </IconCard>
        <IconCard icon={<Beaker />} title="Road Material">
          <span className="capitalize">{material?.materialType || "N/A"}</span>
        </IconCard>
        <IconCard icon={<TestTube />} title="Est. Volume (cm³)">
          {volume?.volume ? Math.round(volume.volume) : "N/A"}
        </IconCard>
      </div>

      {severity?.justification && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="text-primary" /> Justification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{severity.justification}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <CheckCircle className="mr-2" /> Submit Report
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onNewInspection}
          className="w-full"
        >
          <Repeat className="mr-2" /> Start New Inspection
        </Button>
      </div>
    </div>
  );
};
