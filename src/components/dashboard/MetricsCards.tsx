import { Target, CheckCircle2, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import clsx from 'clsx';

interface MetricsProps {
  target: number;
  achieved: number;
  remaining: number;
  achievement: number;
  efficiency: number;
}

export default function MetricsCards({ metrics }: { metrics: MetricsProps }) {
  const isWarning = metrics.efficiency < 90;
  const isExcellent = metrics.achieved >= metrics.target;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <MetricCard 
        title="Target" 
        value={metrics.target.toLocaleString()} 
        icon={Target} 
        color="text-blue-400" 
        bg="bg-blue-500/10" 
      />
      <MetricCard 
        title="Achieved" 
        value={metrics.achieved.toLocaleString()} 
        icon={CheckCircle2} 
        color="text-emerald-400" 
        bg="bg-emerald-500/10" 
      />
      <MetricCard 
        title="Achievement" 
        value={`${metrics.achievement}%`} 
        icon={TrendingUp} 
        color={isExcellent ? "text-emerald-400" : "text-blue-400"} 
        bg={isExcellent ? "bg-emerald-500/10" : "bg-blue-500/10"} 
      />
      <MetricCard 
        title="Remaining" 
        value={metrics.remaining.toLocaleString()} 
        icon={AlertCircle} 
        color="text-yellow-400" 
        bg="bg-yellow-500/10" 
      />
      <MetricCard 
        title="Efficiency" 
        value={`${metrics.efficiency}%`} 
        icon={Zap} 
        color={isWarning ? "text-danger" : "text-emerald-400"} 
        bg={isWarning ? "bg-danger/10" : "bg-emerald-500/10"}
        glow={isWarning ? "shadow-[0_0_15px_rgba(239,68,68,0.2)]" : ""} 
      />
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, bg, glow = "" }: any) {
  return (
    <div className={clsx("p-5 rounded-2xl glass border border-border flex items-center gap-4", glow)}>
      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center", bg)}>
        <Icon className={clsx("w-6 h-6", color)} />
      </div>
      <div>
        <p className="text-zinc-400 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
    </div>
  );
}
