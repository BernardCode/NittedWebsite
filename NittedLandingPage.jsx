import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

// --- 3D Shirt Model Component ---
function ShirtModel({ autoRotate, onRotationEnd }) {
  const group = useRef();
  const { scene } = useGLTF("/shirt.glb");
  const [rotation, setRotation] = useState(0);

  // Force all materials to be opaque and non-transparent
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => {
            mat.transparent = false;
            mat.opacity = 1;
            if (mat.alphaTest !== undefined) mat.alphaTest = 0;
            if (mat.depthWrite !== undefined) mat.depthWrite = true;
          });
        } else {
          obj.material.transparent = false;
          obj.material.opacity = 1;
          if (obj.material.alphaTest !== undefined) obj.material.alphaTest = 0;
          if (obj.material.depthWrite !== undefined)
            obj.material.depthWrite = true;
        }
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    if (autoRotate && rotation < Math.PI * 2) {
      const increment = (Math.PI * 2) / 6 / 60; // 360deg in 6s at 60fps
      const next = Math.min(rotation + increment, Math.PI * 2);
      group.current.rotation.y = next;
      setRotation(next);
      if (next >= Math.PI * 2 && onRotationEnd) onRotationEnd();
    }
  });
  return <primitive ref={group} object={scene} position={[0, -0.7, 0]} />;
}

// --- Countdown Timer ---
function Countdown() {
  const [remaining, setRemaining] = useState(
    dayjs.duration(dayjs("2025-08-02").diff(dayjs()))
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(dayjs.duration(dayjs("2025-08-02").diff(dayjs())));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const days = String(remaining.days()).padStart(2, "0");
  const hours = String(remaining.hours()).padStart(2, "0");
  const minutes = String(remaining.minutes()).padStart(2, "0");
  const seconds = String(remaining.seconds()).padStart(2, "0");
  return (
    <div className="flex justify-center gap-4 bg-white/80 rounded-xl px-6 py-3 shadow-md text-2xl font-mono tracking-widest">
      <span>
        <span className="font-bold">{days}</span>{" "}
        <span className="text-xs">DAYS</span>
      </span>
      <span>:</span>
      <span>
        <span className="font-bold">{hours}</span>{" "}
        <span className="text-xs">HRS</span>
      </span>
      <span>:</span>
      <span>
        <span className="font-bold">{minutes}</span>{" "}
        <span className="text-xs">MIN</span>
      </span>
      <span>:</span>
      <span>
        <span className="font-bold">{seconds}</span>{" "}
        <span className="text-xs">SEC</span>
      </span>
    </div>
  );
}

// --- Product Grid ---
function ProductGrid() {
  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
      {/* Left blurred */}
      <div className="h-64 flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80"
          alt="Blurred Shirt"
          className="w-full h-full object-cover rounded-xl blur-md scale-105 brightness-110"
        />
      </div>
      {/* Center sharp */}
      <div className="h-64 flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80"
          alt="Shirt"
          className="w-full h-full object-cover rounded-xl shadow-lg"
        />
      </div>
      {/* Right blurred */}
      <div className="h-64 flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80"
          alt="Blurred Shirt"
          className="w-full h-full object-cover rounded-xl blur-md scale-105 brightness-110"
        />
      </div>
    </div>
  );
}

// --- Drop Section ---
function DropSection() {
  const controls = useAnimation();
  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    });
  }, [controls]);
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={controls}
      className="min-h-screen flex flex-col justify-center items-center bg-[#FAF5EF] px-4 pt-24 pb-12"
      id="drop"
    >
      <motion.h1
        className="text-4xl sm:text-5xl font-extrabold mb-6 text-center font-sans tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Dropping August 1st
      </motion.h1>
      <Countdown />
      <motion.h2
        className="mt-8 text-2xl font-semibold text-center font-sans"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        The Coziest Drop Is Coming ☁️
      </motion.h2>
      <motion.p
        className="mt-4 text-lg text-center max-w-xl text-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Minimal essentials for comfort, calm, and everyday softness.
      </motion.p>
      <form className="w-full max-w-lg mt-8 flex flex-col items-center gap-3">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full rounded-lg px-5 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-lg bg-white shadow-sm font-sans"
        />
        <button
          type="submit"
          className="w-full bg-black text-white rounded-lg py-3 text-lg font-semibold mt-2 transition hover:bg-gray-900 shadow-md"
        >
          Join the Waitlist →
        </button>
        <span className="text-xs text-gray-500 mt-1 text-center">
          You'll get first access & a secret discount 👀
        </span>
      </form>
      <ProductGrid />
    </motion.section>
  );
}

// --- Main Landing Page ---
export default function NittedLandingPage() {
  const [autoRotate, setAutoRotate] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [bg, setBg] = useState("#EFE9E1");
  const canvasRef = useRef();

  // Snap scroll to drop section
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > window.innerHeight / 2) {
        setBg("#FAF5EF");
      } else {
        setBg("#EFE9E1");
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Snap scroll logic
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight / 2 && y > 10) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (y >= window.innerHeight / 2) {
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // After 360deg spin, enable controls
  const handleRotationEnd = () => {
    setAutoRotate(false);
    setShowControls(true);
  };

  return (
    <div
      className="font-sans min-h-screen w-full"
      style={{
        background: bg,
        transition: "background 0.7s cubic-bezier(.4,0,.2,1)",
      }}
    >
      {/* 3D Split Hero Section */}
      <section className="relative h-screen w-full flex flex-col md:flex-row items-stretch justify-stretch overflow-hidden">
        {/* Left: Text Content */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 z-20 bg-transparent">
          <motion.h1
            className="mt-10 md:mt-0 text-3xl sm:text-5xl font-extrabold tracking-tight text-black/80 select-none drop-shadow-lg text-center md:text-left"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            nitted
          </motion.h1>
          <div className="w-full max-w-lg mx-auto mt-8">
            <motion.h2
              className="text-4xl sm:text-5xl font-extrabold mb-6 text-center md:text-left font-sans tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Dropping August 2nd
            </motion.h2>
            <Countdown />
            <motion.h3
              className="mt-8 text-2xl font-semibold text-center md:text-left font-sans"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              The Coziest Drop Is Coming ☁️
            </motion.h3>
            <motion.p
              className="mt-4 text-lg text-center md:text-left max-w-xl text-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Minimal essentials for comfort, calm, and everyday softness.
            </motion.p>
            <form className="w-full mt-8 flex flex-col items-center gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg px-5 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-lg bg-white shadow-sm font-sans"
              />
              <button
                type="submit"
                className="w-full bg-black text-white rounded-lg py-3 text-lg font-semibold mt-2 transition hover:bg-gray-900 shadow-md"
              >
                Join the Waitlist →
              </button>
              <span className="text-xs text-gray-500 mt-1 text-center">
                You'll get first access & a secret discount 👀
              </span>
            </form>
          </div>
        </div>
        {/* Right: 3D Model */}
        <div className="w-full md:w-1/2 h-96 md:h-full relative flex items-center justify-center bg-transparent">
          <AnimatePresence>
            <motion.div
              key="canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full"
            >
              <Canvas
                ref={canvasRef}
                camera={{ position: [0, 0.7, 2.2], fov: 32 }}
                style={{
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                }}
                shadows
              >
                {/* Improved lighting setup */}
                <ambientLight intensity={0.9} />
                <directionalLight
                  position={[2, 4, 2]}
                  intensity={1.1}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                />
                <directionalLight
                  position={[-2, 2, -2]}
                  intensity={0.5}
                  color="#fffbe6"
                />
                <pointLight position={[0, 2, 2]} intensity={0.3} />
                <Suspense fallback={<Html center>Loading…</Html>}>
                  <ShirtModel
                    autoRotate={autoRotate}
                    onRotationEnd={handleRotationEnd}
                  />
                </Suspense>
                {showControls && (
                  <OrbitControls enablePan enableZoom enableRotate />
                )}
              </Canvas>
            </motion.div>
          </AnimatePresence>
          {/* Scroll Down Indicator (mobile only) */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center md:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <span className="text-sm font-medium text-black/60 mb-1">
              Scroll
            </span>
            <span className="animate-bounce text-2xl">↓</span>
          </motion.div>
        </div>
      </section>
      {/* Drop Section */}
      <DropSection />
    </div>
  );
}

// --- GLTF Loader Preload ---
// @react-three/drei recommends preloading models
useGLTF.preload("/shirt.glb");
