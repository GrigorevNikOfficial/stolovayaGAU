import React from 'react';
import LogoSAU from '../../../images/logo.jpg';

type ServiceHeaderProps = {
  subtitle?: string;
  onLogoClick: () => void;
  centerSlot?: React.ReactNode;
  mobileDockSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  isFixed?: boolean;
};

export const ServiceHeader: React.FC<ServiceHeaderProps> = ({
  subtitle,
  onLogoClick,
  centerSlot,
  mobileDockSlot,
  rightSlot,
  isFixed = false,
}) => {
  const positionClass = isFixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0';
  const hasSubtitle = Boolean(subtitle && subtitle.trim().length > 0);

  return (
    <>
      <header
        className={`${positionClass} z-40 border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur`}
      >
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex w-full items-center gap-2 sm:gap-3 lg:gap-4 py-2.5 sm:py-4 min-h-[60px] sm:min-h-[72px]">
            <button
              type="button"
              onClick={onLogoClick}
              className="group flex min-w-0 items-center gap-2 sm:gap-3 shrink-0 rounded-2xl border border-transparent px-1 py-1 text-left transition-all duration-200 hover:border-brand-indigo/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30"
              aria-label="Вернуться на главную"
            >
              <img
                src={LogoSAU}
                alt="Логотип сервиса"
                className="hidden h-12 w-12 rounded-3xl border border-transparent transition-transform duration-200 group-hover:scale-105 sm:block sm:h-14 sm:w-14"
              />
              <div className="min-w-0 leading-tight">
                <h1 className="flex items-center text-xl font-black uppercase tracking-tight text-text-primary sm:text-[1.85rem] lg:text-[2.1rem]">
                  <span className="tracking-[-0.04em]">STUD</span>
                  <span className="ml-1 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm tracking-[-0.04em]">
                    MI
                  </span>
                </h1>
                {hasSubtitle ? (
                  <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.35em] text-text-muted sm:mt-1 sm:text-xs">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </button>

            {centerSlot ? (
              <div className="hidden lg:flex flex-1 justify-center px-4">
                <div className="w-full max-w-4xl">{centerSlot}</div>
              </div>
            ) : null}

            <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2 lg:gap-3">
              {rightSlot}
            </div>
          </div>
        </div>
      </header>
      {mobileDockSlot ? (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto w-full max-w-4xl px-3 py-2 sm:px-4">
            {mobileDockSlot}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ServiceHeader;
