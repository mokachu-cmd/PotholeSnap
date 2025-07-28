// This file is machine-generated - edit with caution!
'use server';
/**
 * @fileOverview An AI flow that automatically detects and highlights potholes in an image.
 *
 * - detectPotholes - A function that handles the pothole detection process.
 * - DetectPotholesInput - The input type for the detectPotholes function.
 * - DetectPotholesOutput - The return type for the detectPotholes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPotholesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectPotholesInput = z.infer<typeof DetectPotholesInputSchema>;

const DetectPotholesOutputSchema = z.object({
  highlightedImage: z
    .string()
    .describe("An image with potholes highlighted, as a data URI."),
});
export type DetectPotholesOutput = z.infer<typeof DetectPotholesOutputSchema>;

export async function detectPotholes(input: DetectPotholesInput): Promise<DetectPotholesOutput> {
  return detectPotholesFlow(input);
}

const detectPotholesPrompt = ai.definePrompt({
  name: 'detectPotholesPrompt',
  input: {schema: DetectPotholesInputSchema},
  output: {schema: DetectPotholesOutputSchema},
  prompt: [
    {
      media: {url: '{{photoDataUri}}'},
    },
    {
      text: `You are an AI that specializes in detecting potholes in images.

      Your task is to identify potholes in the given image and return an image highlighting the detected potholes.
      The output MUST be a data URI of the new image with potholes highlighted.
      If no potholes are detected return the original image.
`,
    },
  ],
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const detectPotholesFlow = ai.defineFlow(
  {
    name: 'detectPotholesFlow',
    inputSchema: DetectPotholesInputSchema,
    outputSchema: DetectPotholesOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {media: {url: input.photoDataUri}},
        {
          text: `You are an AI that specializes in detecting potholes in images.

      Your task is to identify potholes in the given image and return an image highlighting the detected potholes.
      The output MUST be a data URI of the new image with potholes highlighted.
      If no potholes are detected return the original image.
`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    return {highlightedImage: media!.url!};
  }
);
