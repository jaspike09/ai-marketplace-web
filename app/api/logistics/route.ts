import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI (Using a secure environment variable!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabaseUrl = "https://vqufamwvuimjitoxwedu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWZhbXd2dWltaml0b3h3ZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTI4MDQsImV4cCI6MjA4NzM4ODgwNH0.R4XNi1woiAfUgp03L6hPko6wkHtHdhefRme6TvD6VLw"; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const { itemId, method, title } = await req.json();

    // IF SHIPPING: Trigger the AI to calculate weight, dimensions, and cost
    if (method === 'shipping') {
      const prompt = `
        You are an expert logistics AI for a peer-to-peer marketplace. 
        A user just bought an item titled: "${title}".
        Estimate the shipping weight (in lbs) and dimensions (L x W x H in inches) based on what this item typically is.
        Calculate a rough shipping cost using this formula: $5 base rate + $0.50 per pound.
        
        Return ONLY a JSON object in this exact format:
        {
          "weight": "estimated weight in lbs",
          "dimensions": "L x W x H",
          "estimatedCost": "calculated cost as a number",
          "aiMessage": "A short, friendly message explaining the estimated size and shipping cost to the buyer."
        }
      `;

      // Call OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Super fast, extremely cheap
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const aiData = JSON.parse(response.choices[0].message.content || '{}');

      // Update the database with the AI's calculated status
      await supabase
        .from('inventory')
        .update({ logistics_status: `AI Shipping Calc: $${aiData.estimatedCost}` })
        .eq('id', itemId);

      // Send the AI data back to the frontend
      return NextResponse.json({ success: true, aiData });
    }

    // If Pickup or Delivery: Just update the database normally
    await supabase
      .from('inventory')
      .update({ logistics_status: `pending_${method}` })
      .eq('id', itemId);

    return NextResponse.json({ 
      success: true, 
      message: `AI Agent handling ${method} coordination with seller.` 
    });

  } catch (error: any) {
    console.error("AI Logistics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}