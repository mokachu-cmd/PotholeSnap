// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview Classifies the severity (minor, moderate, severe) of a pothole based on its visual characteristics.
 *
 * - classifyPotholeSeverity - A function that classifies the severity of a pothole.
 * - ClassifyPotholeSeverityInput - The input type for the classifyPotholeSeverity function.
 * - ClassifyPotholeSeverityOutput - The return type for the classifyPotholeSeverity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyPotholeSeverityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a pothole, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  length: z.number().describe('The estimated length of the pothole in centimeters.'),
  width: z.number().describe('The estimated width of the pothole in centimeters.'),
  depth: z.number().describe('The estimated depth of the pothole in centimeters.'),
});
export type ClassifyPotholeSeverityInput = z.infer<typeof ClassifyPotholeSeverityInputSchema>;

const ClassifyPotholeSeverityOutputSchema = z.object({
  severity: z
    .enum(['minor', 'moderate', 'severe'])
    .describe('The severity of the pothole (minor, moderate, or severe).'),
  justification: z
    .string()
    .describe('The justification for the assigned severity based on visual characteristics and dimensions.'),
});
export type ClassifyPotholeSeverityOutput = z.infer<typeof ClassifyPotholeSeverityOutputSchema>;

export async function classifyPotholeSeverity(
  input: ClassifyPotholeSeverityInput
): Promise<ClassifyPotholeSeverityOutput> {
  return classifyPotholeSeverityFlow(input);
}

const classifyPotholeSeverityPrompt = ai.definePrompt({
  name: 'classifyPotholeSeverityPrompt',
  input: {schema: ClassifyPotholeSeverityInputSchema},
  output: {schema: ClassifyPotholeSeverityOutputSchema},
  prompt: `You are an expert in assessing road damage and classifying pothole severity.

  Based on the provided image, length, width, and depth, classify the pothole's severity as minor, moderate, or severe.
  Also provide a brief justification for your classification.

  Photo: {{media url=photoDataUri}}
  Length: {{length}} cm
  Width: {{width}} cm
  Depth: {{depth}} cm

  Respond in the following JSON format:
  { "severity": "minor | moderate | severe", "justification": "..." }
  `,
});

const classifyPotholeSeverityFlow = ai.defineFlow(
  {
    name: 'classifyPotholeSeverityFlow',
    inputSchema: ClassifyPotholeSeverityInputSchema,
    outputSchema: ClassifyPotholeSeverityOutputSchema,
  },
  async input => {
    const {output} = await classifyPotholeSeverityPrompt(input);
    return output!;
  }
);
