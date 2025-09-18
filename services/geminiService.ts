import { GoogleGenAI, Modality, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ImageData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

export const editImageWithPrompt = async (
  image: ImageData,
  prompt: string
): Promise<ImageData> => { // No longer returns null
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      // FIX: Moved safetySettings into the config object to resolve the type error.
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        safetySettings,
      },
    });

    const candidate = response.candidates?.[0];

    // Handle cases where the response was blocked for safety reasons by throwing an error
    if (candidate?.finishReason === 'SAFETY') {
      const safetyRatings = candidate.safetyRatings ? JSON.stringify(candidate.safetyRatings) : 'No details provided.';
      throw new Error(`Edit was blocked for safety reasons. Please adjust your prompt. Details: ${safetyRatings}`);
    }
    if (candidate?.finishReason === 'PROHIBITED_CONTENT') {
      throw new Error('Your request was blocked because the content is prohibited. Please modify your prompt or image.');
    }
    
    if (!candidate && response.promptFeedback?.blockReason) {
        throw new Error(`Request was blocked: ${response.promptFeedback.blockReason}. Please adjust your prompt.`);
    }

    if (!candidate?.content?.parts) {
      console.error("Invalid API response structure.", response);
      throw new Error("The AI returned an invalid or empty response. Please try again.");
    }

    let editedImage: ImageData | null = null;
    let textResponse: string | null = null;

    // The model can return both image and text, or just text.
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        editedImage = {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
      } else if (part.text) {
        textResponse = part.text;
      }
    }

    // Prioritize returning the image if it exists.
    if (editedImage) {
      return editedImage;
    }

    // If no image was returned, the AI may have responded with text explaining why.
    if (textResponse) {
      throw new Error(`AI Response: ${textResponse}`);
    }

    // If we reach here, the response was valid but contained neither image nor text.
    console.error("No image or text part found in API response.", response);
    throw new Error("The AI did not return an image. Please try a different prompt.");

  } catch (error) {
    console.error("Error editing image with Gemini API:", error);
    if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429'))) {
        throw new Error("You've exceeded your API request quota. Please check your plan and billing details.");
    }
    // Re-throw the error so it can be caught and displayed by the UI
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
};


export const eraseImageWithMask = async (
  image: ImageData,
  mask: ImageData
): Promise<ImageData> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          },
          {
            inlineData: {
              data: mask.base64,
              mimeType: mask.mimeType,
            },
          },
          {
            text: "Inpaint the area indicated by the second image (the mask). The mask shows the region to be removed and filled in. Fill this area seamlessly to match the surrounding background.",
          },
        ],
      },
      // FIX: Moved safetySettings into the config object to resolve the type error.
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        safetySettings,
      },
    });

    const candidate = response.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
      const safetyRatings = candidate.safetyRatings ? JSON.stringify(candidate.safetyRatings) : 'No details provided.';
      throw new Error(`Edit was blocked for safety reasons. Details: ${safetyRatings}`);
    }
    if (candidate?.finishReason === 'PROHIBITED_CONTENT') {
      throw new Error('Your request was blocked because the content is prohibited. Please modify your prompt or image.');
    }
    
    if (!candidate && response.promptFeedback?.blockReason) {
        throw new Error(`Request was blocked: ${response.promptFeedback.blockReason}.`);
    }

    if (!candidate?.content?.parts) {
      console.error("Invalid API response structure.", response);
      throw new Error("The AI returned an invalid or empty response. Please try again.");
    }

    let editedImage: ImageData | null = null;
    let textResponse: string | null = null;

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        editedImage = {
          base64: part.inlineData.data,
          // FIX: Corrected property from `mime` to `mimeType` to fix error on line 146.
          mimeType: part.inlineData.mimeType,
        };
      } else if (part.text) {
        textResponse = part.text;
      }
    }

    if (editedImage) {
      return editedImage;
    }

    if (textResponse) {
      throw new Error(`AI Response: ${textResponse}`);
    }

    console.error("No image or text part found in API response.", response);
    throw new Error("The AI did not return an image. Please try again.");

  } catch (error) {
    console.error("Error during Magic Erase with Gemini API:", error);
    if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429'))) {
        throw new Error("You've exceeded your API request quota. Please check your plan and billing details.");
    }
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while communicating with the AI for the erase operation.");
  }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<ImageData> => {
  try {
    if (!prompt.trim()) {
      throw new Error("Prompt cannot be empty.");
    }

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      // FIX: Moved safetySettings outside the config object to resolve the type error.
      // `safetySettings` is a top-level parameter for the `generateImages` method, not part of `config`.
      safetySettings,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio,
      },
    });

    const generatedImage = response.generatedImages?.[0];

    // FIX: The `GenerateImagesResponse` type does not have the `promptFeedback` property.
    // The safety check has been updated to provide a generic error when no image is returned,
    // which can happen if the prompt violates safety policies.
    if (!generatedImage?.image?.imageBytes) {
      console.error("Invalid API response structure for image generation, or generation was blocked.", response);
      throw new Error("The AI did not return an image. This could be due to a safety policy violation. Please adjust your prompt and try again.");
    }

    return {
      base64: generatedImage.image.imageBytes,
      mimeType: 'image/png',
    };

  } catch (error) {
    console.error("Error generating image with Gemini API:", error);
    if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429'))) {
        throw new Error("You've exceeded your API request quota. Please check your plan and billing details.");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while communicating with the AI for image generation.");
  }
};