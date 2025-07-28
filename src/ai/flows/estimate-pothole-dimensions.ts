// estimate-pothole-dimensions.ts
'use server';

/**
 * @fileOverview Estimates the dimensions (length, width, depth) of a pothole from an image using AI.
 *
 * - estimatePotholeDimensions - A function that handles the pothole dimension estimation process.
 * - EstimatePotholeDimensionsInput - The input type for the estimatePotholeDimensions function.
 * - EstimatePotholeDimensionsOutput - The return type for the estimatePotholeDimensions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimatePotholeDimensionsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a pothole, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EstimatePotholeDimensionsInput = z.infer<typeof EstimatePotholeDimensionsInputSchema>;

const EstimatePotholeDimensionsOutputSchema = z.object({
  length: z.number().describe('The estimated length of the pothole in centimeters.'),
  width: z.number().describe('The estimated width of the pothole in centimeters.'),
  depth: z.number().describe('The estimated depth of the pothole in centimeters.'),
  unit: z.string().describe('The unit of measurement for the pothole dimensions, which is centimeters.')
});
export type EstimatePotholeDimensionsOutput = z.infer<typeof EstimatePotholeDimensionsOutputSchema>;

export async function estimatePotholeDimensions(input: EstimatePotholeDimensionsInput): Promise<EstimatePotholeDimensionsOutput> {
  return estimatePotholeDimensionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimatePotholeDimensionsPrompt',
  input: {schema: EstimatePotholeDimensionsInputSchema},
  output: {schema: EstimatePotholeDimensionsOutputSchema},
  prompt: `You are an expert in analyzing images of potholes to estimate their dimensions.

  Given the following image of a pothole, estimate its length, width, and depth in centimeters.
  Return the dimensions as a JSON object.

  Photo: {{media url=photoDataUri}}
  `,
});

const estimatePotholeDimensionsFlow = ai.defineFlow(
  {
    name: 'estimatePotholeDimensionsFlow',
    inputSchema: EstimatePotholeDimensionsInputSchema,
    outputSchema: EstimatePotholeDimensionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
