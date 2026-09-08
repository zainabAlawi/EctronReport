import Link from 'next/link';
import { Zap, Droplet, PlusCircle, Building2 } from 'lucide-react';

export default function HomePage() {
  const divisions = [
    {
      id: 'electricity',
      name: 'الكهرباء (Electricity)',
      icon: Zap,
      color: 'from-amber-400 to-orange-500',
      bgClass: 'bg-orange-500/10',
      borderClass: 'border-orange-500/20',
      iconColor: 'text-orange-400',
    },
    {
      id: 'water',
      name: 'المياه (Water)',
      icon: Droplet,
      color: 'from-blue-400 to-cyan-500',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/20',
      iconColor: 'text-blue-400',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="mb-12 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">مرحباً بك في النظام الرئيسي</h1>
          <p className="text-zinc-400">الرجاء اختيار القسم الذي ترغب في إدارته</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {divisions.map((div) => {
          const Icon = div.icon;
          return (
            <Link 
              key={div.id} 
              href={`/${div.id}/dashboard`}
              className={`group flex flex-col items-center justify-center p-10 rounded-3xl border ${div.borderClass} ${div.bgClass} hover:bg-zinc-800/80 transition-all duration-300 hover:scale-105 shadow-xl glass`}
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-zinc-900 shadow-inner group-hover:shadow-${div.iconColor.split('-')[1]}-500/20 transition-all`}>
                <Icon className={`w-10 h-10 ${div.iconColor}`} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{div.name}</h2>
              <p className="text-zinc-400 text-sm text-center">
                إدارة التقارير، الاستهلاك اليومي، والذكاء الاصطناعي
              </p>
            </Link>
          );
        })}

        {/* Add New Section Card (Placeholder for UI) */}
        <button className="group flex flex-col items-center justify-center p-10 rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800/50 transition-all duration-300">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-zinc-800 group-hover:bg-zinc-700 transition-all">
            <PlusCircle className="w-10 h-10 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-xl font-bold text-zinc-400 group-hover:text-white mb-2 transition-colors">إضافة قسم جديد</h2>
          <p className="text-zinc-500 text-sm text-center">
            إضافة قسم جديد للمنظومة (قريباً)
          </p>
        </button>
      </div>
    </div>
  );
}
