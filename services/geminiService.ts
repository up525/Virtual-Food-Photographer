
import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const base64ToBlob = async (base64: string, mimeType: string): Promise<Blob> => {
  const res = await fetch(`data:${mimeType};base64,${base64}`);
  return await res.blob();
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


export const parseMenu = async (menuText: string): Promise<{ name: string; description: string }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse the following restaurant menu text and extract a list of dishes with their names and descriptions. Ignore prices, categories, and any other text.

Menu:
---
${menuText}
---`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: 'The name of the dish.',
              },
              description: {
                type: Type.STRING,
                description: 'A brief description of the dish.',
              },
            },
            required: ["name", "description"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error parsing menu:", error);
    throw new Error("Could not understand the menu. Please check the format and try again.");
  }
};

export const generateFoodImage = async (dishName: string, dishDescription: string, stylePrompt: string): Promise<string> => {
  try {
    const fullPrompt = `High-end, professional food photography of "${dishName}". 
Description: "${dishDescription}". 
${stylePrompt}
The dish must be perfectly plated and look incredibly delicious. 
Shot with a DSLR camera, sharp focus, beautiful lighting, photorealistic.`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '4:3',
      },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      throw new Error("Image generation failed to return an image.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error(`Failed to generate an image for ${dishName}.`);
  }
};

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
    try {
        const blob = await base64ToBlob(base64Image, 'image/png');
        const compressedBlob = await compressImage(blob);
        const compressedBase64 = await blobToBase64(compressedBlob);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: compressedBase64,
                            mimeType: 'image/jpeg',
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image was returned from the edit operation.");

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to apply the edit. Please try again.");
    }
};

// Helper to compress image before sending to edit model to stay within size limits
const compressImage = (blob: Blob, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (resultBlob) => {
                    if (resultBlob) {
                        resolve(resultBlob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                },
                'image/jpeg',
                quality
            );
            URL.revokeObjectURL(img.src);
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(img.src);
            reject(err);
        };
    });
};
