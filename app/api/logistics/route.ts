import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini securely using Vercel's environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Supabase
const supabaseUrl = "https://vqufamwvuimjitoxwedu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWZhbXd2dWltaml0b3h3ZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTI4MDQsImV4cCI6MjA4NzM4ODgwNH0.R4XNi1woiAfUgp03L6hPko6wkHtHdhefRme6TvD6VLw"; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const { itemId, method, title } = await req.json();

    // IF SHIPPING: Trigger Gemini to calculate specs and cost
    if (method === 'shipping') {
      const prompt = `
        You are an expert logistics AI for a peer-to-peer marketplace. 
        A user wants to ship an item titled: "${title}".
        
        1. Estimate the shipping weight in pounds (lbs).
        2. Determine if it can be shipped via standard mail (FedEx/UPS/USPS). 
           RULE: Vehicles, live animals, and items over 150 lbs CANNOT be shipped standard mail.
        3. If it CAN be shipped, calculate estimatedCost: $5 + ($0.50 * weight).
        4. If it CANNOT be shipped, set estimatedCost to 0.

        Return EXACTLY this JSON format and nothing else:
        {
          "weight": <number>,
          "isShippable": <boolean>,
          "estimatedCost": <number>,
          "aiMessage": "<If shippable, explain the estimated size/cost. If NOT shippable, politely explain why it is too large/unshippable and suggest they cancel and choose Local Pickup or Delivery instead.>"
        }
      `;

      // Ping Gemini's ultra-fast Flash model and force it to output clean JSON
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const result = await model.generateContent(prompt);
      const aiData = JSON.parse(result.response.text());

      // THE OVERSIZED CHECK: Block cars, dogs, and heavy items!
      if (!aiData.isShippable) {
        return NextResponse.json({ 
          success: false, 
          error: aiData.aiMessage 
        });
      }

      // If it IS shippable, update the database
      await supabase
        .from('inventory')
        .update({ logistics_status: `AI Shipping Calc: $${aiData.estimatedCost}` })
        .eq('id', itemId);

      return NextResponse.json({ success: true, aiData });
    }

    // IF PICKUP OR DELIVERY: Standard update without AI sizing
    await supabase
      .from('inventory')
      .update({ logistics_status: `pending_${method}` })
      .eq('id', itemId);

    return NextResponse.json({ 
      success: true, 
      message: `AI Agent handling ${method} coordination with seller.` 
    });

  } catch (error: any) {
    console.error("Gemini Logistics Error:", error);
    return NextResponse.json({ success: false, error: "Failed to reach AI Logistics engine." }, { status: 500 });
  }
}