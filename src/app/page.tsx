import Link from 'next/link';
import { Droplets, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Welcome to <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">ECTRON</span> Smart Factory
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Select a division below to view real-time production metrics, analyze performance, and generate comprehensive reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link 
          href="/water/dashboard"
          className="group relative overflow-hidden rounded-2xl glass p-8 transition-all hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] border border-blue-500/20"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Droplets className="w-32 h-32 text-blue-500" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
              <Droplets className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Smart Water Meters</h2>
            <p className="text-zinc-400">View production data, efficiency, and analytics for the water division.</p>
          </div>
        </Link>

        <Link 
          href="/electricity/dashboard"
          className="group relative overflow-hidden rounded-2xl glass p-8 transition-all hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] border border-yellow-500/20"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-32 h-32 text-yellow-500" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6 border border-yellow-500/30">
              <Zap className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Smart Electricity Meters</h2>
            <p className="text-zinc-400">Track assembly, calibration, and output metrics for the electricity division.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
