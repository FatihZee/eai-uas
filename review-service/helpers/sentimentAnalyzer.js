const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function analyzeSentiment(comment) {
  console.log("analyzeSentiment called with comment:", comment);
  
  // Input validation
  if (!comment || typeof comment !== 'string' || comment.trim() === '') {
    console.warn("Invalid or empty comment provided");
    return "neutral"; // lowercase untuk konsistensi database
  }
  
  try {
    const prompt = `Analyze the sentiment of this Indonesian/English food review comment and respond ONLY with one of the following words: Positive, Negative, or Neutral.

Comment: "${comment}"`;
    
    console.log("Prompt sent to model:", prompt);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    console.log("Raw response object:", response);
    
    if (!response || !response.text || typeof response.text !== "string") {
      throw new Error("Invalid response structure from Gemini API");
    }
    
    const text = response.text.trim();
    console.log("Raw response text:", text);
    
    if (text === "") {
      throw new Error("Empty response text");
    }
    
    const validSentiments = ['Positive', 'Negative', 'Neutral'];
    const cleanSentiment = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    
    if (validSentiments.includes(cleanSentiment)) {
      // Return lowercase untuk konsistensi dengan database schema
      return cleanSentiment.toLowerCase();
    } else {
      console.warn("Unexpected sentiment response:", text);
      const lowerText = text.toLowerCase();
      if (lowerText.includes('positive')) return 'positive';
      if (lowerText.includes('negative')) return 'negative';
      return 'neutral';
    }
    
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    });
    
    // Return lowercase 'neutral' sesuai ekspektasi ReviewService
    return "neutral";
  }
}

module.exports = { analyzeSentiment };