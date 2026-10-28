import Link from 'next/link';
import { Zap, Droplet, PlusCircle, Banknote, MapPin } from 'lucide-react';

export default function HomePage() {
  const divisions = [
    {
      id: 'electricity',
      name: 'الكهرباء (Electricity M212)',
      description: 'إدارة التقارير، الاستهلاك اليومي، والذكاء الاصطناعي',
      icon: Zap,
      bgClass: 'bg-gradient-to-br from-white via-[#F0F7FC] to-[#E0EEF8] hover:to-[#D4E8F7] dark:bg-none dark:bg-[#1b497f]/10 dark:hover:bg-[#1b497f]/15',
      borderClass: 'border-2 border-[#9BB8D3] hover:border-[#173B63] dark:border dark:border-[#1b497f]/25',
      iconBg: 'bg-[#173B63] border border-[#173B63]/20 dark:bg-[#1b497f]/15 dark:border-[#1b497f]/30',
      iconColor: 'text-[#2DD4BF] dark:text-[#00a99d]',
    },
    {
      id: 'electricity-ecs1100',
      name: 'الكهرباء (Electricity ECS1100)',
      description: 'متابعة عدادات الكهرباء ECS1100 والإنتاجية',
      icon: Zap,
      bgClass: 'bg-gradient-to-br from-white via-[#F0FBF9] to-[#DCF5F0] hover:to-[#CCFBF1] dark:bg-none dark:bg-[#00a99d]/10 dark:hover:bg-[#00a99d]/15',
      borderClass: 'border-2 border-[#8ED8CD] hover:border-[#0F766E] dark:border dark:border-[#00a99d]/25',
      iconBg: 'bg-[#0F766E] border border-[#0F766E]/20 dark:bg-[#00a99d]/15 dark:border-[#00a99d]/30',
      iconColor: 'text-white dark:text-[#00a99d]',
    },
    {
      id: 'water',
      name: 'المياه (Water Siconia)',
      description: 'إدارة التقارير، الاستهلاك اليومي، والذكاء الاصطناعي',
      icon: Droplet,
      bgClass: 'bg-gradient-to-br from-white via-[#F0FBF9] to-[#DCF5F0] hover:to-[#CCFBF1] dark:bg-none dark:bg-[#00a99d]/10 dark:hover:bg-[#00a99d]/15',
      borderClass: 'border-2 border-[#8ED8CD] hover:border-[#14B8A6] dark:border dark:border-[#00a99d]/25',
      iconBg: 'bg-[#14B8A6] border border-[#14B8A6]/20 dark:bg-[#00a99d]/15 dark:border-[#00a99d]/30',
      iconColor: 'text-white dark:text-[#00a99d]',
    },
    {
      id: 'petty-cash',
      name: 'إدارة النقديات (Petty Cash)',
      description: 'إدارة النثريات، المصاريف، وتصفية العهد',
      icon: Banknote,
      bgClass: 'bg-gradient-to-br from-white via-[#F0F7FC] to-[#E0EEF8] hover:to-[#D4E8F7] dark:bg-none dark:bg-[#1b497f]/10 dark:hover:bg-[#1b497f]/15',
      borderClass: 'border-2 border-[#9BB8D3] hover:border-[#173B63] dark:border dark:border-[#1b497f]/25',
      iconBg: 'bg-gradient-to-br from-[#173B63] to-[#0F766E] border border-[#14B8A6]/30 dark:bg-none dark:bg-[#1b497f]/15 dark:border-[#1b497f]/30',
      iconColor: 'text-white dark:text-[#00a99d]',
    },
    {
      id: 'visitor',
      name: 'إدارة الزوار (Visitor Management)',
      description: 'تسجيل الزوار ذاتياً وعبر الاستقبال، وتتبع إحصائيات الزيارات والوفود',
      icon: MapPin,
      href: '/visitor/dashboard',
      bgClass: 'bg-gradient-to-br from-white via-[#F0FBF9] to-[#DCF5F0] hover:to-[#CCFBF1] dark:bg-none dark:bg-[#00a99d]/10 dark:hover:bg-[#00a99d]/15',
      borderClass: 'border-2 border-[#8ED8CD] hover:border-[#14B8A6] dark:border dark:border-[#00a99d]/25',
      iconBg: 'bg-gradient-to-br from-[#0F766E] to-[#14B8A6] border border-[#14B8A6]/30 dark:bg-none dark:bg-[#00a99d]/15 dark:border-[#00a99d]/30',
      iconColor: 'text-white dark:text-[#00a99d]',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="mb-12 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[#173B63] dark:text-white mb-2">مرحباً بك في النظام الرئيسي</h1>
          <p className="text-[#475569] dark:text-zinc-400">الرجاء اختيار القسم الذي ترغب في إدارته</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {divisions.map((div) => {
          const Icon = div.icon;
          return (
            <Link 
              key={div.id} 
              href={div.href || (div.id === 'electricity-ecs1100' ? '/coming-soon' : `/${div.id}/dashboard`)}
              className={`group flex flex-col items-center justify-center p-10 rounded-3xl border ${div.borderClass} ${div.bgClass} transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md dark:shadow-xl glass`}
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${div.iconBg} shadow-inner transition-all`}>
                <Icon className={`w-10 h-10 ${div.iconColor}`} />
              </div>
              <h2 className="text-2xl font-bold text-[#173B63] dark:text-white mb-2 text-center">{div.name}</h2>
              <p className="text-[#475569] dark:text-zinc-400 text-sm text-center">
                {div.description}
              </p>
            </Link>
          );
        })}

        {/* Add New Section Card (Placeholder for UI) */}
        <button className="group flex flex-col items-center justify-center p-10 rounded-3xl border-2 border-dashed border-[#CCFBF1]/50 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/30 hover:bg-[#F0FDFA] dark:hover:bg-zinc-800/50 transition-all duration-300">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-[#E3EEF6] dark:bg-zinc-800 group-hover:bg-[#CCFBF1] dark:group-hover:bg-zinc-700 transition-all">
            <PlusCircle className="w-10 h-10 text-[#173B63] dark:text-zinc-400 group-hover:text-[#0F766E] dark:group-hover:text-[#00a99d] transition-colors" />
          </div>
          <h2 className="text-xl font-bold text-[#173B63] dark:text-zinc-400 group-hover:text-[#0F766E] dark:group-hover:text-[#00a99d] mb-2 transition-colors">إضافة قسم جديد</h2>
          <p className="text-[#475569] dark:text-zinc-500 text-sm text-center">
            إضافة قسم جديد للمنظومة (قريباً)
          </p>
        </button>
      </div>
    </div>
  );
}
