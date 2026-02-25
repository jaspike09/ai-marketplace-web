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

  // Fetch the item data
  useEffect(() => {
    async function fetchItem() {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (data) {
        setItem(data);
        // If someone else already bought it, lock the screen
        if (data.is_sold) setPurchaseComplete(true);
      }
      if (error) console.error(error);
    }
    fetchItem();
  }, [itemId]);

  // THE AI TRIGGER: Process the purchase
  const handleBuyNow = async () => {
    setIsProcessing(true);
    
    // Flip the switch in the database to alert the AI Engine
    const { error } = await supabase
      .from('inventory')
      .update({ is_sold: true, logistics_status: 'ai_routing' })
      .eq('id', itemId);

    if (!error) {
      setTimeout(() => {
        setIsProcessing(false);
        setPurchaseComplete(true);
      }, 1500); // Fake a short processing delay for effect
    } else {
      alert("Transaction failed. Please try again.");
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
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white px-4 py-4 sticky top-0 z-40 shadow-sm flex items-center gap-4">
        <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-900 font-bold">
          ← Back to Grid
        </button>
        <span className="font-black text-xl tracking-tight text-slate-900">marketplace</span>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 mt-4">
        
        {/* Left: Huge Image */}
        <div className="w-full md:w-1/2 bg-slate-200 rounded-3xl overflow-hidden shadow-lg h-[400px] md:h-[600px] relative">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          {purchaseComplete && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-rose-500 text-white font-black text-3xl px-8 py-4 rounded-2xl rotate-[-12deg] shadow-2xl">
                SOLD
              </span>
            </div>
          )}
        </div>

        {/* Right: Details & Action */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">{item.title}</h1>
          <p className="text-5xl font-black text-rose-500">{item.price}</p>
          
          {/* DYNAMIC UI: Changes based on purchase state */}
          {!purchaseComplete ? (
            <>
              <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-500 uppercase tracking-wider text-sm mb-2">Logistics Capability</h3>
                <p className="text-slate-700 font-medium">Eligible for AI autonomous routing. We will coordinate local couriers based on distance and weight.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleBuyNow}
                  disabled={isProcessing}
                  className="flex-1 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl hover:shadow-2xl disabled:opacity-50"
                >
                  {isProcessing ? "Securing..." : "Buy Now"}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-emerald-50 border-2 border-emerald-500 p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
              <h3 className="font-black text-emerald-600 text-xl mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                AI Agent Activated
              </h3>
              <p className="text-emerald-800 font-medium mb-4">
                Your purchase is secured. Our logistics engine is currently calculating the optimal delivery route and negotiating with local couriers. 
              </p>
              <div className="bg-white/60 p-3 rounded-xl border border-emerald-200 text-sm font-bold text-emerald-700 flex justify-between">
                <span>Status:</span>
                <span className="animate-pulse">Matching Carrier...</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}