// components/layout/Footer/Footer.tsx
import React from 'react';

const SERVICES = ['Главная', 'Маркетплейс', 'События', 'Заказ еды', 'Расписание', 'Контакты'];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0c1011] text-white border-t border-white/10">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">StudMi</p>
              <h3 className="text-2xl font-semibold text-white mt-2">Студенческая экосистема</h3>
              <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-md">
                Объединяем все необходимые сервисы для комфортной учёбы и жизни в университете:
                питание, расписание, события, маркетплейс и общие коммуникации.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Сервисы</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {SERVICES.map(item => (
                  <li key={item} className="hover:text-white transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <p className="font-semibold text-white mb-1">Контакты</p>
                <p>info@studmi.ru</p>
                <p>+7 (XXX) XXX-XX-XX</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Адрес</p>
                <p>г. Москва, Университетская ул., 1</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2025 StudMi. Все права защищены.</p>
            <p>Экосистема студенческих сервисов</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
