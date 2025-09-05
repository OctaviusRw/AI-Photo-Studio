
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { ImageData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidate = response.candidates?.[0];

    // Handle cases where the response was blocked for safety reasons by throwing an error
    if (candidate?.finishReason === 'SAFETY') {
      const safetyRatings = candidate.safetyRatings ? JSON.stringify(candidate.safetyRatings) : 'No details provided.';
      throw new Error(`Edit was blocked for safety reasons. Please adjust your prompt. Details: ${safetyRatings}`);
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
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidate = response.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
      const safetyRatings = candidate.safetyRatings ? JSON.stringify(candidate.safetyRatings) : 'No details provided.';
      throw new Error(`Edit was blocked for safety reasons. Details: ${safetyRatings}`);
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
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while communicating with the AI for the erase operation.");
  }
};

export const getEditingSuggestions = async (image: ImageData): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          },
          {
            text: "Analyze this image and provide 3 distinct, creative editing suggestions. The suggestions should be concise and phrased as commands an AI image editor can execute. For example: 'Change the background to a snowy mountain range' or 'Add a vintage film effect'.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A creative editing suggestion phrased as a command."
              }
            }
          },
          required: ["suggestions"],
        }
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new Error("AI returned an empty response for suggestions.");
    }

    const parsedResponse = JSON.parse(jsonText);
    if (parsedResponse && Array.isArray(parsedResponse.suggestions)) {
      return parsedResponse.suggestions.slice(0, 3); // Ensure we only take 3
    }

    throw new Error("Failed to parse suggestions from the AI response.");
  } catch (error) {
    console.error("Error getting editing suggestions:", error);
    // Don't throw a fatal error, just return an empty array so the app doesn't crash
    // The UI can show a message that suggestions couldn't be loaded.
    return [];
  }
};

export const generateImage = async (prompt: string): Promise<ImageData> => {
  try {
    if (!prompt.trim()) {
      throw new Error("Prompt cannot be empty.");
    }

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    const generatedImage = response.generatedImages?.[0];

    // FIX: The `GeneratedImage` type does not have `finishReason` or `safetyRatings` properties, causing errors on lines 249-250.
    // The safety check has been corrected to use `response.promptFeedback` when no image is returned.
    if (!generatedImage?.image?.imageBytes) {
      if (response.promptFeedback?.blockReason) {
        const safetyRatings = response.promptFeedback.safetyRatings ? JSON.stringify(response.promptFeedback.safetyRatings) : 'No details provided.';
        throw new Error(`Image generation was blocked for safety reasons. Please adjust your prompt. Details: ${safetyRatings}`);
      }
      console.error("Invalid API response structure for image generation.", response);
      throw new Error("The AI did not return an image. Please try again.");
    }

    return {
      base64: generatedImage.image.imageBytes,
      mimeType: 'image/png',
    };

  } catch (error) {
    console.error("Error generating image with Gemini API:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while communicating with the AI for image generation.");
  }
};
