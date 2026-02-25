"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Initialize Supabase (PASTE YOUR ANON KEY HERE)
const supabaseUrl = "https://vqufamwvuimjitoxwedu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWZhbXd2dWltaml0b3h3ZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTI4MDQsImV4cCI6MjA4NzM4ODgwNH0.R4XNi1woiAfUgp03L6hPko6wkHtHdhefRme6TvD6VLw"; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PostItem() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Send data to Supabase
    const { error } = await supabase.from('inventory').insert([
      { title, price: `$${price}`, image_url: imageUrl }
    ]);

    if (error) {
      alert("Error posting item: " + error.message);
      setIsSubmitting(false);
    } else {
      // Success! Instantly bounce them back to the homepage
      router.push("/"); 
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-500/20 rounded-full blur-[120px] -z-10"></div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-semibold">
            <span>← Cancel</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight">Post an Item</h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>

        {/* The Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-xl p-8 rounded-[30px] border border-slate-700 shadow-2xl space-y-6">
          
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Item Title</label>
            <input 
              required
              type="text"
              placeholder="e.g. Whirlpool Front Load Washer"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Price ($)</label>
            <input 
              required
              type="number"
              placeholder="e.g. 250"
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Image URL</label>
            <input 
              required
              type="url"
              placeholder="Paste any image link here..."
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <p className="text-[10px] text-slate-500 mt-2 italic">For now, just paste a link from Google Images.</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-rose-500 hover:bg-rose-400 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Publishing..." : "Publish Item"}
          </button>

        </form>
      </div>
    </main>
  );
}