

import { GoogleGenAI, Modality, Type } from '@google/genai';
import { addImageWatermark } from '../utils/watermark';
import { AspectRatio, GeneratedShot, ParsedScene, SceneCharacter } from '../types';

// Ensure the API key is available from environment variables
if (!process.env.API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this example, we'll throw an error to make it obvious.
  throw new Error("API_KEY environment variable not set.");
}

// FIX: Initialize GoogleGenAI with a named apiKey parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


/**
 * A centralized handler for API errors to provide more specific feedback.
 * @param error The caught error object.
 * @param context A string describing the operation that failed (e.g., "Image generation").
 * @returns A new Error object with a user-friendly message.
 */
const handleApiError = (error: unknown, context: string): Error => {
  console.error(`Error in ${context} service:`, error);

  // Check for the specific quota error. The error from the SDK is often an object.
  if (typeof error === 'object' && error !== null) {
    // Stringifying is a simple way to check for keywords in the error response.
    const errorString = JSON.stringify(error);
    if (errorString.includes("RESOURCE_EXHAUSTED") || (errorString.includes("429") && errorString.includes("Quota exceeded"))) {
      // This provides a more specific and actionable error message for the developer.
      return new Error(
        `${context} failed due to a quota issue (RESOURCE_EXHAUSTED). ` +
        "This usually means the API key's project is missing billing information or the 'Generative Language API' is not enabled. " +
        "Please check your Google Cloud project configuration."
      );
    }
  }

  if (error instanceof Error) {
    // Preserve the original error message if it's an Error instance.
    return new Error(`${context} failed: ${error.message}`);
  }

  // Fallback for unknown error types.
  return new Error(`An unknown error occurred during ${context}.`);
};



/**
 * Parses a script into a structured scene object.
 */
const parseScriptToScene = async (script: string): Promise<ParsedScene> => {
    const systemInstruction = `You are a screenplay analysis AI that breaks down a movie script scene into a structured format for a video generation pipeline. Your task is to read the provided script and output a JSON object. Do not add any conversational text or explanations. Only output the JSON.

The JSON must have two top-level keys: "characters" and "shots".

1.  **characters**: An array of objects. For each character who speaks, create an object with:
    *   \`name\`: The character's name in uppercase (e.g., "ANNA").
    *   \`description\`: A detailed, consistent visual description for the video generator. Be specific about appearance, clothing, age, and any defining features. This description will be used for every shot featuring this character to maintain visual consistency.

2.  **shots**: An array of objects, representing the sequence of camera shots. For each shot, create an object with:
    *   \`shotNumber\`: A sequential integer starting from 1.
    *   \`description\`: A concise but descriptive prompt for the video generator, detailing the camera angle (e.g., "WIDE SHOT", "CLOSE UP"), the setting, and the action. If a character is in the shot, mention their name.
    *   \`dialogue\`: If there is dialogue in the shot, this should be an object with \`character\` (the speaker's name in uppercase) and \`line\` (the dialogue text). If there is no dialogue, this should be \`null\`.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: script,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        characters: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                },
                                required: ['name', 'description'],
                            },
                        },
                        shots: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    shotNumber: { type: Type.INTEGER },
                                    description: { type: Type.STRING },
                                    dialogue: {
                                        type: Type.OBJECT,
                                        nullable: true,
                                        properties: {
                                            character: { type: Type.STRING },
                                            line: { type: Type.STRING },
                                        },
                                        required: ['character', 'line'],
                                    },
                                },
                                required: ['shotNumber', 'description', 'dialogue'],
                            },
                        },
                    },
                    required: ['characters', 'shots'],
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ParsedScene;

    } catch (error) {
        throw handleApiError(error, "Script parsing");
    }
};


/**
 * Orchestrates the generation of a full scene from a script.
 */
export const generateSceneFromScript = async (
    script: string,
    availableVoices: SpeechSynthesisVoice[],
    onProgress: (message: string, current: number, total: number) => void
): Promise<GeneratedShot[]> => {
    try {
        onProgress("Analyzing script...", 0, 100);
        const scene = await parseScriptToScene(script);
        
        if (!scene || !scene.shots || scene.shots.length === 0) {
            throw new Error("The script could not be parsed into shots.");
        }

        // --- Voice Assignment Logic ---
        // Assign a unique, consistent voice to each character.
        const maleVoices = availableVoices.filter(v => v.name.toLowerCase().includes('male'));
        const femaleVoices = availableVoices.filter(v => v.name.toLowerCase().includes('female'));
        let maleVoiceIndex = 0;
        let femaleVoiceIndex = 0;

        const characterMap = new Map<string, SceneCharacter>();
        scene.characters.forEach(char => {
            // A simple heuristic to assign gender-appropriate voices if possible
            const isLikelyMale = char.description.toLowerCase().includes(' man') || char.description.toLowerCase().includes(' male');
            if (isLikelyMale && maleVoices.length > 0) {
                char.voiceURI = maleVoices[maleVoiceIndex % maleVoices.length].voiceURI;
                maleVoiceIndex++;
            } else if (femaleVoices.length > 0) {
                char.voiceURI = femaleVoices[femaleVoiceIndex % femaleVoices.length].voiceURI;
                femaleVoiceIndex++;
            } else if (availableVoices.length > 0) {
                 // Fallback to any available voice
                char.voiceURI = availableVoices[(maleVoiceIndex + femaleVoiceIndex) % availableVoices.length].voiceURI;
            }
            characterMap.set(char.name, char);
        });
        
        // --- Shot Generation Loop ---
        const totalShots = scene.shots.length;
        const generatedShots: GeneratedShot[] = [];

        for (let i = 0; i < totalShots; i++) {
            const shot = scene.shots[i];
            onProgress(`Generating shot ${i + 1} of ${totalShots}...`, i + 1, totalShots);

            // Enhance prompt with character descriptions for consistency
            let finalPrompt = shot.description;
            scene.characters.forEach(char => {
                // If a character is mentioned by name, inject their detailed description.
                if (finalPrompt.toLowerCase().includes(char.name.toLowerCase())) {
                    finalPrompt = finalPrompt.replace(new RegExp(char.name, 'gi'), `${char.name} (${char.description})`);
                }
            });
            
            // Estimate duration based on dialogue length, with a baseline.
            const dialogueLength = shot.dialogue?.line.length || 0;
            const durationSecs = Math.max(3, Math.min(60, Math.round(dialogueLength / 15)));

            const videoUrl = await generateVideo(finalPrompt, null, null, durationSecs);

            generatedShots.push({
                ...shot,
                videoUrl,
                character: shot.dialogue ? characterMap.get(shot.dialogue.character) : undefined,
            });
        }
        
        onProgress("Scene complete!", totalShots, totalShots);
        return generatedShots;

    } catch (error) {
         throw handleApiError(error, "Scene generation");
    }
};



/**
 * Generates a descriptive caption for a given image.
 */
export const generateImageCaption = async (
  base64Image: string,
  mimeType: string
): Promise<string> => {
  try {
    const systemInstruction = `You are an expert at analyzing images. Your task is to describe the provided image in a concise but detailed and evocative way. 
    This description will be used as a starting point for an AI image generation prompt. 
    Focus on the subject, setting, style, lighting, and mood. 
    Respond ONLY with the description. Do not add any conversational text or explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ inlineData: { data: base64Image, mimeType: mimeType } }],
      },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const caption = response.text.trim();
    if (!caption) {
        throw new Error("The model failed to generate a caption for the image.");
    }
    return caption;
  } catch (error) {
    throw handleApiError(error, "Image captioning");
  }
};


/**
 * Creates a detailed prompt by analyzing an image and a user's request.
 * This is used for the hybrid generation flow.
 */
export const describeImageForGeneration = async (
  prompt: string,
  base64Image: string,
  mimeType: string
): Promise<string> => {
  try {
    const systemInstruction = `You are an expert art director. Your task is to create a new, detailed prompt for an AI image generator.
First, meticulously describe the provided image, capturing its subject, style, lighting, composition, colors, and overall mood.
Then, seamlessly integrate the user's request to modify or build upon this description.
The final output should be a single, cohesive prompt that is ready to be used for generating a new image.
Respond ONLY with the final, combined prompt. Do not add any conversational text or explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: `User's request: "${prompt}"` },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const newPrompt = response.text.trim();
    if (!newPrompt) {
        throw new Error("The model failed to generate a descriptive prompt.");
    }
    return newPrompt;
  } catch (error) {
    throw handleApiError(error, "Prompt description");
  }
};


/**
 * Generates a new image from a text prompt or edits an existing one.
 */
export const generateImage = async (
  prompt: string,
  base64Image: string | null,
  mimeType: string | null,
  withWatermark: boolean,
  aspectRatio: AspectRatio
): Promise<string> => {
  try {
    let imageUrl = '';
    if (base64Image && mimeType) {
      // Image editing task
      // To prevent the model from entering a conversational mode, we provide a
      // direct, imperative instruction prefix. This ensures the model understands
      // its role is strictly to edit the image according to the user's text.
      const fullPrompt = `Edit the image based on this instruction: "${prompt}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: mimeType } },
            { text: fullPrompt },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
      });
      
      const parts = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find(p => p.inlineData);

      if (imagePart?.inlineData) {
        const base64Data = imagePart.inlineData.data;
        imageUrl = `data:${imagePart.inlineData.mimeType};base64,${base64Data}`;
      } else {
        // The model did not return an image, which is an error.
        // We will report this, including any text response from the model for context.
        const textPart = parts?.find(p => p.text);
        if (textPart?.text) {
          throw new Error(`The model failed to return an image, but provided this message: "${textPart.text}"`);
        }
        throw new Error("The model did not return an edited image and provided no explanation. The request may have been blocked.");
      }
    } else {
      // Image generation from text task
      // FIX: Use the correct model for image generation ('imagen-4.0-generate-001').
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64Data = response.generatedImages[0].image.imageBytes;
        imageUrl = `data:image/png;base64,${base64Data}`;
      } else {
        throw new Error("The model did not generate any images.");
      }
    }

    if (withWatermark) {
        return await addImageWatermark(imageUrl);
    }
    return imageUrl;

  } catch (error) {
    // Check if it's one of the specific logical errors thrown from within the try block
    if (error instanceof Error && (
        error.message.includes("The model failed to return an image") ||
        error.message.includes("The model did not return an edited image") ||
        error.message.includes("The model did not generate any images")
    )) {
        // Re-throw these specific, logical errors so the UI can display them directly.
        throw error;
    }
    // For all other errors (like API failures), use the centralized handler.
    throw handleApiError(error, "Image generation");
  }
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


/**
 * Generates a video from a text prompt, optionally with a starting image.
 */
export const generateVideo = async (
  prompt: string,
  base64Image: string | null,
  mimeType: string | null,
  durationSecs: number
): Promise<string> => {
  try {
    const videoParams: any = {
      // FIX: Use the correct model for video generation ('veo-2.0-generate-001').
      model: 'veo-2.0-generate-001',
      prompt,
      config: {
        numberOfVideos: 1,
        durationSecs: durationSecs,
      },
    };

    if (base64Image && mimeType) {
      videoParams.image = {
        imageBytes: base64Image,
        mimeType: mimeType,
      };
    }

    // FIX: Use `generateVideos` and handle the long-running operation by polling.
    let operation = await ai.models.generateVideos(videoParams);

    while (!operation.done) {
      // Poll every 10 seconds as recommended for video operations.
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("Video generation process completed, but no downloadable video was found.");
    }

    // FIX: Append the API key to the download URI to fetch the video file.
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download the generated video: ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();
    
    // Convert blob to a persistent base64 data URL for storage and display.
    return await blobToDataUrl(videoBlob);

  } catch (error) {
    throw handleApiError(error, "Video generation");
  }
};

/**
 * Generates prompt suggestions based on user input.
 */
export const enhancePrompt = async (prompt: string): Promise<string[]> => {
  try {
    if (!prompt.trim()) {
      return [];
    }
    // FIX: Corrected the system instruction to be more concise and focused.
    const systemInstruction = `You are a creative assistant for an AI image and video generator. Suggest 5-7 diverse and inspiring keywords or styles to enhance the user's prompt. Focus on visual concepts like lighting, composition, art style, or mood. Return a JSON object with a "suggestions" key, which is an array of strings. Do not include the original prompt. Example for 'a cat': {"suggestions": ["cinematic lighting", "hyperrealistic", "fantasy art", "oil painting", "vibrant colors"]}.`;

    const response = await ai.models.generateContent({
      // FIX: Use the 'gemini-2.5-flash' model for this text-based task.
      model: 'gemini-2.5-flash',
      // FIX: Pass the system instruction in the config, not concatenated with contents.
      contents: `User's prompt: "${prompt}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: 'An array of 5-7 prompt enhancement suggestions.'
            }
          },
          // FIX: Ensure 'suggestions' is the required property as per the schema.
          required: ['suggestions'],
        },
      },
    });

    // FIX: Access the response text directly using the .text property.
    const jsonText = response.text;
    const result = JSON.parse(jsonText);
    
    if (result && Array.isArray(result.suggestions)) {
      return result.suggestions;
    }
    
    return [];

  } catch (error) {
    throw handleApiError(error, "Prompt suggestions");
  }
};

/**
 * Magically enhances a user's prompt to be more descriptive and evocative.
 */
export const generateMagicPrompt = async (prompt: string): Promise<string> => {
  try {
    const systemInstruction = `You are an expert art director specializing in AI-generated visuals. Your task is to take a user's prompt and expand it into a rich, detailed, and evocative new prompt. 
    Focus on adding cinematic details: camera angles, lighting (e.g., golden hour, neon glow), mood (e.g., mysterious, epic), art style (e.g., photorealistic, oil painting, anime), and composition. 
    Do not simply add keywords. Weave the new details into the original prompt to create a cohesive, single paragraph.
    Respond ONLY with the final, enhanced prompt. Do not add any conversational text, introductions, or explanations like "Here is the enhanced prompt:".`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
      }
    });

    const newPrompt = response.text.trim();
    if (!newPrompt) {
        throw new Error("The model failed to generate an enhanced prompt.");
    }
    return newPrompt;
  } catch (error) {
    throw handleApiError(error, "Magic Prompt generation");
  }
};
