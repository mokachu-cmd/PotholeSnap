"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Camera, Bot, FileText } from "lucide-react";

export function OnboardingGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
          <Info className="mr-2 h-4 w-4" />
          How it works
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>How Pothole Snap Works</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">1. Capture</h3>
              <p className="text-sm text-muted-foreground">
                Take a clear picture of the pothole. For best results, capture it from directly above.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">2. Analyze</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes the image to estimate dimensions, material, severity, and more.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">3. Confirm & Submit</h3>
              <p className="text-sm text-muted-foreground">
                Review the AI-generated data and submit the report to the relevant authorities.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
