'use server';

/**
 * @fileOverview Estimates the road material type (asphalt, concrete) around a pothole from an image.
 *
 * - estimateRoadMaterial - A function that handles the road material estimation process.
 * - EstimateRoadMaterialInput - The input type for the estimateRoadMaterial function.
 * - EstimateRoadMaterialOutput - The return type for the estimateRoadMaterial function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateRoadMaterialInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the pothole and surrounding road, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EstimateRoadMaterialInput = z.infer<typeof EstimateRoadMaterialInputSchema>;

const EstimateRoadMaterialOutputSchema = z.object({
  materialType: z
    .string()
    .describe("The estimated road material type (asphalt, concrete, or unknown)."),
  confidence: z
    .number()
    .describe("A confidence score (0-1) for the material type estimation."),
});
export type EstimateRoadMaterialOutput = z.infer<typeof EstimateRoadMaterialOutputSchema>;

export async function estimateRoadMaterial(
  input: EstimateRoadMaterialInput
): Promise<EstimateRoadMaterialOutput> {
  return estimateRoadMaterialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateRoadMaterialPrompt',
  input: {schema: EstimateRoadMaterialInputSchema},
  output: {schema: EstimateRoadMaterialOutputSchema},
  prompt: `You are an expert in road materials.  Given a photo of a road with a pothole, determine the type of road material (asphalt, concrete, or unknown). Also, estimate your confidence in the determination.

  Analyze the following image to determine the road material type. Return 'unknown' if you are not able to determine the road material type.

  Photo: {{media url=photoDataUri}}

  Ensure that the output is valid JSON.  The confidence should be a number between 0 and 1.
  `,
});

const estimateRoadMaterialFlow = ai.defineFlow(
  {
    name: 'estimateRoadMaterialFlow',
    inputSchema: EstimateRoadMaterialInputSchema,
    outputSchema: EstimateRoadMaterialOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
