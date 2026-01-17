
import { GoogleGenAI, Type } from "@google/genai";
import { InspectionFormData, AISafetyResponse } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSafetyStatus = async (formData: InspectionFormData): Promise<AISafetyResponse> => {
  const parts: any[] = [];
  
  const textPrompt = `
    Analyze this vehicle inspection report for a vehicle in Trinidad and Tobago.
    Based on the Road Traffic Act (Cap. 48:50) and public safety principles, provide a brief summary of risks and recommendations.
    
    Vehicle Details: ${formData.vehicleYear} ${formData.vehicleMake} ${formData.vehicleModel} (${formData.vehicleClass})
    Defects Found: ${formData.checklist.filter(i => !i.value).map(i => i.label).join(", ")}
    Additional Notes: ${formData.checklist.filter(i => i.notes).map(i => `${i.label}: ${i.notes}`).join("; ")}
    
    Attached are images of the identified defects for your review. 
    Focus on roadworthiness, crash prevention, and regulatory compliance.
  `;

  parts.push({ text: textPrompt });

  // Add images of defects if they exist
  formData.checklist.forEach(item => {
    if (item.image && !item.value) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: item.image.split(',')[1] // Remove the prefix "data:image/jpeg;base64,"
        }
      });
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A high-level summary of the safety analysis." },
            riskLevel: { type: Type.STRING, description: "Risk level: LOW, MEDIUM, or HIGH" },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable steps to resolve defects."
            }
          },
          required: ["summary", "riskLevel", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text.trim()) as AISafetyResponse;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      summary: "AI safety analysis is temporarily unavailable.",
      riskLevel: "MEDIUM",
      recommendations: ["Manually review all failed items against the Road Traffic Act."]
    };
  }
};
