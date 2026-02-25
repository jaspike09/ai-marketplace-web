"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";

// Initialize Supabase
const supabaseUrl = "https://vqufamwvuimjitoxwedu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWZhbXd2dWltaml0b3h3ZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTI4MDQsImV4cCI6MjA4NzM4ODgwNH0.R4XNi1woiAfUgp03L6hPko6wkHtHdhefRme6TvD6VLw"; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ItemDetails() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id;
  
  const [item, setItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  
  // Track what fulfillment method the buyer chooses
  const [method, setMethod] = useState<"pickup" | "delivery" | "shipping">("pickup");

  useEffect(() => {
    async function fetchItem() {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (data) {
        setItem(data);
        if (data.is_sold) setPurchaseComplete(true);
      }
      if (error) console.error(error);
    }
    fetchItem();
  }, [itemId]);

  // THE UPGRADED FUNCTION: Pinging the AI Brain
  const handleBuyNow = async () => {
    setIsProcessing(true);
    
    try {
      // Send the item data to our Next.js backend AI Agent
      const response = await fetch('/api/logistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          itemId: itemId, 
          method: method,
          title: item.title // We pass the title so the AI knows what to research!
        })
      });

      const result = await response.json();

      if (result.success) {
        // If shipping, show the buyer what the AI calculated!
        if (method === 'shipping') {
          console.log("🤖 AI Logistics Report:", result.aiData);
          alert(`AI Shipping Estimate: $${result.aiData.estimatedCost}\n\n${result.aiData.aiMessage}`);
        }
        
        // Mark as sold in the UI and show success screen
        await supabase.from('inventory').update({ is_sold: true }).eq('id', itemId);
        setTimeout(() => {
          setIsProcessing(false);
          setPurchaseComplete(true);
        }, 1000);
      } else {
        alert("AI Engine Error: " + result.error);
        setIsProcessing(false);
      }
    } catch (error) {
      alert("Failed to connect to AI Logistics.");
      setIsProcessing(false);
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-rose-500 font-black text-2xl animate-pulse">
        Initializing...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white px-4 py-4 sticky top-0 z-40 shadow-sm flex items-center gap-4">
        <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-900 font-bold">
          ← Back to Grid
        </button>
        <span className="font-black text-xl tracking-tight text-slate-900">marketplace</span>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 mt-4">
        
        {/* Left: Huge Image */}
        <div className="w-full md:w