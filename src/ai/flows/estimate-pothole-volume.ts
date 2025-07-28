'use server';
/**
 * @fileOverview This file defines a Genkit flow for estimating the volume of a pothole based on its dimensions.
 *
 * - estimatePotholeVolume - A function that calculates the pothole volume.
 * - EstimatePotholeVolumeInput - The input type for the estimatePotholeVolume function.
 * - EstimatePotholeVolumeOutput - The return type for the estimatePotholeVolume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimatePotholeVolumeInputSchema = z.object({
  length: z.number().describe('The length of the pothole in centimeters.'),
  width: z.number().describe('The width of the pothole in centimeters.'),
  depth: z.number().describe('The depth of the pothole in centimeters.'),
});
export type EstimatePotholeVolumeInput = z.infer<typeof EstimatePotholeVolumeInputSchema>;

const EstimatePotholeVolumeOutputSchema = z.object({
  volume: z
    .number()
    .describe('The estimated volume of the pothole in cubic centimeters.'),
  materialSuggestion: z
    .string()
    .describe('A suggestion for the type of material to use for filling the pothole.'),
});
export type EstimatePotholeVolumeOutput = z.infer<typeof EstimatePotholeVolumeOutputSchema>;

export async function estimatePotholeVolume(input: EstimatePotholeVolumeInput): Promise<EstimatePotholeVolumeOutput> {
  return estimatePotholeVolumeFlow(input);
}

const estimatePotholeVolumePrompt = ai.definePrompt({
  name: 'estimatePotholeVolumePrompt',
  input: {schema: EstimatePotholeVolumeInputSchema},
  output: {schema: EstimatePotholeVolumeOutputSchema},
  prompt: `You are an expert in road repair and material science.  A user has provided the dimensions of a pothole.  Estimate the volume of the pothole and suggest a suitable material for repair.

Pothole Length: {{length}} cm
Pothole Width: {{width}} cm
Pothole Depth: {{depth}} cm

Calculate the volume of this pothole, and suggest an appropriate material for filling it.`,
});

const estimatePotholeVolumeFlow = ai.defineFlow(
  {
    name: 'estimatePotholeVolumeFlow',
    inputSchema: EstimatePotholeVolumeInputSchema,
    outputSchema: EstimatePotholeVolumeOutputSchema,
  },
  async input => {
    const {output} = await estimatePotholeVolumePrompt(input);
    return output!;
  }
);
