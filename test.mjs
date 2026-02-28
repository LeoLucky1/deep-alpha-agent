import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const chat = ai.chats.create({
    model: "gemini-1.5-flash",
    tools: [{
        functionDeclarations: [{
            name: "get_price",
            description: "get btc price",
            parameters: { type: "object", properties: {}, required: [] }
        }]
    }]
});

async function run() {
    console.log("sending message...");
    let res = await chat.sendMessage("what is the btc price?");
    console.log(res.functionCalls);
    if (res.functionCalls) {
        let call = res.functionCalls[0];
        console.log("Calling tool: ", call.name);
        try {
            let nextRes = await chat.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: { price: 100000 }
                }
            }]);
            console.log(nextRes.text);
        } catch (e) {
            console.error("1st try failed:", e.message);
            try {
                let nextRes = await chat.sendMessage({
                    role: "user",
                    parts: [{
                        functionResponse: {
                            name: call.name,
                            response: { price: 100000 }
                        }
                    }]
                });
                console.log("2nd try success:", nextRes.text);
            } catch (e2) {
                console.error("2nd try failed:", e2.message);
                try {
                    let nextRes = await chat.sendMessage({
                        role: "function",
                        parts: [{
                            functionResponse: {
                                name: call.name,
                                response: { price: 100000 }
                            }
                        }]
                    });
                    console.log("3rd try success:", nextRes.text);
                } catch (e3) {
                    console.error("3rd try failed:", e3.stack);
                }
            }
        }
    }
}
run().catch(console.error);
