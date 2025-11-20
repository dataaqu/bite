import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the schema for the response
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    isFood: {
      type: Type.BOOLEAN,
      description: "Whether the image contains food or drink items.",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "A score from 0 to 1 indicating confidence that this is food.",
    },
    summary: {
      type: Type.STRING,
      description: "A brief, friendly summary of the meal in Georgian language (e.g., 'ჯანსაღი სალათი ქათმით და ავოკადოთი').",
    },
    foodItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the food item in Georgian" },
          portion: { type: Type.STRING, description: "Estimated portion size in Georgian (e.g., '1 ჭიქა', '150გ')" },
          macros: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER, description: "Estimated calories" },
              protein: { type: Type.NUMBER, description: "Protein in grams" },
              carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
              fat: { type: Type.NUMBER, description: "Fat in grams" },
            },
            required: ["calories", "protein", "carbs", "fat"],
          },
        },
        required: ["name", "portion", "macros"],
      },
    },
    totalMacros: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
      },
      required: ["calories", "protein", "carbs", "fat"],
    },
  },
  required: ["isFood", "foodItems", "totalMacros", "summary"],
};

export const analyzeImage = async (base64Image: string, userProvidedWeight?: number | null): Promise<AnalysisResult> => {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");

    let promptText = "Analyze this image for nutritional information. Identify all food items, estimate portions, and calculate macros. If it is not food, set isFood to false. IMPORTANT: Provide the summary, food names, and portions in Georgian language.";
    
    if (userProvidedWeight && userProvidedWeight > 0) {
      promptText += ` IMPORTANT: The user has provided the exact weight of this food as ${userProvidedWeight} grams. Use this exact weight for your calculations instead of estimating portion sizes. Calculate the nutritional values based on this precise weight.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1, // Extremely low temperature for maximum consistency
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    return result;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};