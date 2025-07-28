import { config } from 'dotenv';
config();

import '@/ai/flows/estimate-pothole-volume.ts';
import '@/ai/flows/estimate-pothole-dimensions.ts';
import '@/ai/flows/estimate-road-material.ts';
import '@/ai/flows/automatically-detect-potholes.ts';
import '@/ai/flows/classify-pothole-severity.ts';