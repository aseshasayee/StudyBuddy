import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY.startsWith('AI')) {
  throw new Error("Invalid GEMINI_API_KEY format");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const startChat = async () => {
  try {
    const chat = await model.startChat({
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
    });
    
    // Test the chat connection with a simple message
    await chat.sendMessage("test");
    return chat;
  } catch (error) {
    console.error('Failed to initialize chat:', error);
    throw new Error('Failed to initialize chat. Please check your API key and try again.');
  }
};