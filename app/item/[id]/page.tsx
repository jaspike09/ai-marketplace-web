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

  // ACTION 1: BUY THE ITEM
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
          title: item.title 
        })
      });

      const result = await response.json();

      if (result.success) {
        if (method === 'shipping') {
          console.log("🤖 AI Logistics Report:", result.aiData);
          alert(`AI Shipping Estimate: $${result.aiData.estimatedCost}\n\n${result.aiData.aiMessage}`);
        }
        
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

  // ACTION 2: CANCEL THE ORDER (BUYER)
  const handleCancelOrder = async () => {
    setIsProcessing(true);
    // Flip the switches back to available
    await supabase.from('inventory').update({ is_sold: false, logistics_status: 'pending' }).eq('id', itemId);
    
    setIsProcessing(false);
    setPurchaseComplete(false); // Resets the UI instantly
  };

  // ACTION 3: COMPLETE THE TRANSACTION (SELLER)
  const handleCompleteTransaction = async () => {
    setIsProcessing(true);
    // Mark as fully completed so the "Ghost Filter" hides it from the homepage
    await supabase.from('inventory').update({ logistics_status: 'completed' }).eq('id', itemId);
    
    alert("Transaction Finalized! Removing from grid.");
    router.push('/'); // Kick them back to the homepage
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
        <div className="w-full md:w-1/2 bg-slate-200 rounded-3xl overflow-hidden shadow-lg h-[400px] md:h-[600px] relative">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          {purchaseComplete && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-amber-500 text-white font-black text-3xl px-8 py-4 rounded-2xl rotate-[-12deg] shadow-2xl tracking-widest border-2 border-white/20">
                PENDING
              </span>
            </div>
          )}
        </div>

        {/* Right: Details & Action */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">{item.title}</h1>
          <p className="text-5xl font-black text-rose-500">{item.price}</p>
          
          {!purchaseComplete ? (
            <div className="space-y-6">
              
              {/* THE FULFILLMENT SELECTOR */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-black text-slate-900 text-lg mb-4">How do you want to get this?</h3>
                
                <div className="space-y-3">
                  <label className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === 'pickup' ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <input type="radio" name="method" value="pickup" checked={method === 'pickup'} onChange={() => setMethod('pickup')} className="hidden" />
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">Local Pickup</div>
                      <div className="text-sm text-slate-500">AI will text the seller to coordinate a time.</div>
                    </div>
                    {method === 'pickup' && <div className="w-4 h-4 bg-rose-500 rounded-full shadow-sm" />}
                  </label>

                  <label className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === 'delivery' ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <input type="radio" name="method" value="delivery" checked={method === 'delivery'} onChange={() => setMethod('delivery')} className="hidden" />
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">Local Delivery</div>
                      <div className="text-sm text-slate-500">Seller will deliver this directly to you.</div>
                    </div>
                    {method === 'delivery' && <div className="w-4 h-4 bg-rose-500 rounded-full shadow-sm" />}
                  </label>

                  <label className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === 'shipping' ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <input type="radio" name="method" value="shipping" checked={method === 'shipping'} onChange={() => setMethod('shipping')} className="hidden" />
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">Ship it to me</div>
                      <div className="text-sm text-slate-500">AI will calculate dimensions and lowest cost.</div>
                    </div>
                    {method === 'shipping' && <div className="w-4 h-4 bg-rose-500 rounded-full shadow-sm" />}
                  </label>
                </div>
              </div>

              <button 
                onClick={handleBuyNow}
                disabled={isProcessing}
                className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl hover:shadow-2xl disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Secure Item"}
              </button>
            </div>
          ) : (
            
            <div className="space-y-6">
              {/* SUCCESS UI */}
              <div className="bg-emerald-50 border-2 border-emerald-500 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                <h3 className="font-black text-emerald-600 text-xl mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  AI Agent Activated
                </h3>
                
                <div className="text-emerald-800 font-medium mb-4 space-y-2">
                  {method === 'pickup' && <p>Your purchase is secured! AI is currently messaging the seller to approve a pickup time. We will text you the address shortly.</p>}
                  {method === 'delivery' && <p>Your purchase is secured! AI is verifying the seller's local delivery schedule. You will receive a text with the delivery window soon.</p>}
                  {method === 'shipping' && <p>Your purchase is secured! AI is currently scanning the web for the dimensions of this item to generate the lowest possible shipping label.</p>}
                </div>
                
                <div className="bg-white/60 p-3 rounded-xl border border-emerald-200 text-sm font-bold text-emerald-700 flex justify-between items-center">
                  <span>Status:</span>
                  <span className="animate-pulse bg-emerald-100 px-3 py-1 rounded-full">
                    {method === 'pickup' ? 'Texting Seller...' : method === 'delivery' ? 'Coordinating Schedule...' : 'Calculating Specs...'}
                  </span>
                </div>
              </div>

              {/* BUYER CANCEL BUTTON */}
              <button 
                onClick={handleCancelOrder}
                disabled={isProcessing}
                className="w-full bg-white text-rose-500 border-2 border-rose-100 hover:border-rose-500 hover:bg-rose-50 font-bold py-4 rounded-2xl transition-all"
              >
                {isProcessing ? "Cancelling..." : "I changed my mind (Cancel Request)"}
              </button>

              {/* SELLER COMPLETE BUTTON (For testing purposes) */}
              <div className="border-t-2 border-slate-100 pt-6 mt-6">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">Seller Controls (Testing)</p>
                <button 
                  onClick={handleCompleteTransaction}
                  disabled={isProcessing}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-md"
                >
                  Finalize & Remove from Grid
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}