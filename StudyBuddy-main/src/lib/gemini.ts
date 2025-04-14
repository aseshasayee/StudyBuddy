import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Keep the model name as requested
export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateContent(prompt: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const result = await response.json();
    console.log('Raw API Response:', result); // Debug log
    
    if (result.error) {
      throw new Error(result.error.message || 'API Error');
    }
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Failed to generate content:', error);
    throw new Error('Failed to generate content. Please try again.');
  }
}

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
    const result = await chat.sendMessage("test");
    await result.response;
    return chat;
  } catch (error) {
    console.error('Failed to initialize chat:', error);
    throw new Error('Failed to initialize chat. Please check your API key and try again.');
  }
};
