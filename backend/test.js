const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Check if .env is loading
console.log("=================================");
console.log("GEMINI API KEY CHECK");
console.log("=================================");

if (!process.env.GEMINI_API_KEY) {
  console.log("❌ GEMINI_API_KEY NOT FOUND IN .env");
  process.exit(1);
}

console.log(
  "✅ Key Loaded. Last 8 chars:",
  process.env.GEMINI_API_KEY.slice(-8)
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    console.log("\nTesting Gemini API...\n");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent("Say Hello");

    console.log("=================================");
    console.log("✅ GEMINI RESPONSE:");
    console.log("=================================");
    console.log(result.response.text());

  } catch (error) {
    console.log("=================================");
    console.log("❌ GEMINI ERROR:");
    console.log("=================================");

    console.error(error);

    if (error.status) {
      console.log("\nStatus Code:", error.status);
    }

    if (error.statusText) {
      console.log("Status Text:", error.statusText);
    }
  }
}

test();