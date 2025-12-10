// components/layout/Footer/Footer.tsx
import React from 'react';

type FooterProps = {
  onNavigate?: (path: string) => void;
};

const FOOTER_SERVICE_LINKS = [
  { label: 'Еда', path: '/services/cafeteria' },
  { label: 'Услуги', path: '/services/marketplace' },
  { label: 'Работа', path: '/services/marketplace?tab=catalog_offer' },
  { label: 'Расписание', path: '/services/events' },
  { label: 'Контакты', path: '/services/chat' },
  { label: 'Личный кабинет', path: '/profile' },
];

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const navigateTo = React.useCallback(
    (path: string) => {
      if (!path) {
        return;
      }

      if (onNavigate) {
        onNavigate(path);
        return;
      }

      if (typeof window === 'undefined') {
        return;
      }

      const nextUrl = new URL(path, window.location.origin);
      window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    [onNavigate]
  );

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
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">для студентов и бизнеса</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                {FOOTER_SERVICE_LINKS.map(link => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => navigateTo(link.path)}
                      className="w-full rounded-xl px-2 py-1 text-left transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <p className="font-semibold text-white mb-1">Контакты</p>
                <p>4bsolutefleur@gmail.com</p>
                <p>+7 (939) 782-06-57</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Адрес</p>
                <p>г. Краснодар, 20 общежитие КУБГАУ, к. 206</p>
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
