"use client";
import { useState, useRef, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// Initialize Supabase Database Connection
const supabaseUrl = "https://vqufamwvuimjitoxwedu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdWZhbXd2dWltaml0b3h3ZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTI4MDQsImV4cCI6MjA4NzM4ODgwNH0.R4XNi1woiAfUgp03L6hPko6wkHtHdhefRme6TvD6VLw"; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// The Photorealistic 3D Model
function VirtualItem() {
  const meshRef = useRef<any>(null);
  const { scene } = useGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb");

  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <primitive object={scene} scale={2} />
    </mesh>
  );
}

export default function MarketplaceHome() {
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  
  // This state now starts empty, waiting for real database items
  const [items, setItems] = useState<any[]>([]);

  // THE NERVOUS SYSTEM: Fetch live data when the page loads
  useEffect(() => {
    async function fetchInventory() {
      const { data, error } = await supabase.from('inventory').select('*');
      
      if (error) {
        console.error("Error fetching inventory:", error);
      } else if (data) {
        setItems(data); // Injects the live database rows into the grid!
      }
    }
    
    fetchInventory();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col relative pb-32">
      
      {/* Top Navbar */}
      <nav className="bg-white px-4 py-4 sticky top-0 z-40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl leading-none">A</span>
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">marketplace</span>
        </div>
        
        {/* THE VIEW TOGGLE */}
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
          <button 
            onClick={() => setViewMode("2D")}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === "2D" ? "bg-white text-rose-500 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            2D Grid
          </button>
          <button 
            onClick={() => setViewMode("3D")}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${viewMode === "3D" ? "bg-white text-rose-500 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            3D Virtual
          </button>
        </div>
      </nav>

      {/* CONDITIONAL RENDER: Show 2D Grid OR 3D Canvas */}
      {viewMode === "2D" ? (
        <div className="p-4 max-w-7xl mx-auto w-full flex-grow">
          {items.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold">Loading live inventory...</div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {items.map((item) => (
                // This is the updated code: We wrapped the card in a <Link> so it acts as a button
                <Link href={`/item/${item.id}`} key={item.id} className="block relative group rounded-2xl overflow-hidden cursor-pointer break-inside-avoid shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="w-full h-64 bg-slate-200">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"></div>
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <div className="font-black text-2xl text-white mb-1 tracking-tight drop-shadow-md">{item.price}</div>
                    <div className="text-slate-200 text-sm font-medium line-clamp-1 drop-shadow-md">{item.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-grow w-full relative bg-slate-900 overflow-hidden" style={{ height: "calc(100vh - 72px)" }}>
          <Canvas camera={{ position: [0, 2, 6], fov: 45 }}>
            <color attach="background" args={['#0f172a']} />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            
            <Suspense fallback={null}>
              <VirtualItem />
            </Suspense>
            
            <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={10} blur={2} far={4} />
            <Environment preset="city" />
            <OrbitControls enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.1} />
          </Canvas>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h2 className="text-white text-3xl font-black drop-shadow-lg mb-2">Virtual Showroom</h2>
            <p className="text-slate-300 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md text-sm">Swipe to rotate • Pinch to zoom</p>
          </div>
        </div>
      )}

      {/* THE FLOATING "POST ITEM" BUTTON - WIRED UP AND READY */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <Link href="/post" className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-3 px-8 py-4 rounded-full shadow-[0_10px_30px_rgba(244,63,94,0.4)] transition-transform hover:scale-105 active:scale-95 cursor-pointer">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2