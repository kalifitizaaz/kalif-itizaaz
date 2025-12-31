
import { GoogleGenAI, Type } from "@google/genai";
import { DayLog } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateDailyInsight(log: DayLog) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Compare these morning intentions with evening realities. 
      Morning: ${JSON.stringify(log.morning.intentions)}. Success Factor: ${log.morning.successFactor}.
      Evening: ${JSON.stringify(log.evening.actuals)}. Reflection: ${log.evening.deepReflection}.
      Provide a single sentence of non-judgmental, gentle observation about the pattern between intent and reality.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 150,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Insight error:", error);
    return undefined;
  }
}

export async function generateAnnualReport(logs: DayLog[]) {
  if (logs.length === 0) {
    return "The mirror is currently blank. It needs your daily reflections to begin showing you who you are becoming.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are MIRROR, a compassionate self-reflection companion. 
      Analyze the following user history carefully. This history contains daily morning intentions and evening reflections.
      
      USER DATA: ${JSON.stringify(logs)}

      TASK:
      Write a long-form, human narrative annual reflection. Analyze specific recurring themes (work, health, worries, joy).
      Compare morning intentions vs evening realities.
      
      CRITICAL INSTRUCTIONS:
      - Use ONLY plain text with clear paragraph breaks. No Markdown symbols (#, *).
      - Include these sections exactly:
      
      1. THIS YEAR'S NARRATIVE: A summary of the dance between intent and reality.
      2. HOW YOU TREATED YOURSELF: Observations on self-talk and pressure vs compassion.
      3. MENTAL & EMOTIONAL PATTERNS: Energy and focus cycles observed.
      4. HABITS THAT HELPED: Specific actions correlating with positive outcomes.
      5. THE CONFIDENCE STORY: How their realism and certainty evolved.
      6. GENTLE GUIDANCE: 3 personalized principles for the next year.
      7. A PERSONAL MESSAGE: A final human closing.

      Maintain a gentle, forensic, yet observational tone.`,
      config: {
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Report error:", error);
    return "The stars are quiet today. Please try again soon.";
  }
}
