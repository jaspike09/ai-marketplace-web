"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Initialize Supabase Database Connection
const supabaseUrl = "https://vqufamwvuimjitoxwedu.supabase.co";
// PASTE YOUR KEY HERE (Keep the quotation marks!)
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWZhbXd2dWltaml0b3h3ZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTI4MDQsImV4cCI6MjA4NzM4ODgwNH0.R4XNi1woiAfUgp03L6hPko6wkHtHdhefRme6TvD6VLw"; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ItemDetails() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id;
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    async function fetchItem() {
      // Go to Supabase, find the row where the ID matches our URL
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (data) setItem(data);
      if (error) console.error(error);
    }
    fetchItem();
  }, [itemId]);

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-rose-500 font-black text-2xl animate-pulse">
        Loading Details...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white px-4 py-4 sticky top-0 z-40 shadow-sm flex items-center gap-4">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 font-bold">
          ← Back
        </button>
        <span className="font-black text-xl tracking-tight text-slate-900">marketplace</span>
      </nav>

      {/* Product Layout */}
      <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 mt-4">
        
        {/* Left: Huge Image */}
        <div className="w-full md:w-1/2 bg-slate-200 rounded-3xl overflow-hidden shadow-lg h-[400px] md:h-[600px]">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        </div>

        {/* Right: Details & Action */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">{item.title}</h1>
          <p className="text-5xl font-black text-rose-500">{item.price}</p>
          
          <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider text-sm mb-2">AI Logistics Status</h3>
            <p className="text-slate-700 font-medium">Ready for immediate fulfillment. Once purchased, AI will coordinate shipping details with the seller.</p>
          </div>

          <div className="flex gap-4 pt-4">
            <button className="flex-1 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
              Buy Now
            </button>
            <button className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-sm">
              Message Seller
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}