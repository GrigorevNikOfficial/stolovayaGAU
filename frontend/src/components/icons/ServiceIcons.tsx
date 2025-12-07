import type { FC, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

const baseClass = 'w-5 h-5';

const withDefaults = (className?: string) => className ?? baseClass;

export const ForkKnifeIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M5 3v7a2 2 0 0 0 4 0V3" />
    <path d="M7 3v18" />
    <path d="M13 4h1a4 4 0 0 1 4 4v13" />
    <path d="M13 8h5" />
  </svg>
);

export const ChatBubblesIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M5.5 6h9a4.5 4.5 0 0 1 0 9H12l-3 3v-3H5.5a4.5 4.5 0 0 1 0-9Z" />
    <path d="M15 10.5h3a3.5 3.5 0 0 1 0 7h-1l-2 2v-2" />
  </svg>
);

export const BellIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M6 9a6 6 0 0 1 12 0v4.2a2 2 0 0 0 .6 1.4L20 16H4l1.4-1.4A2 2 0 0 0 6 13.2Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export const ToolkitIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
    <path d="M7 9V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2" />
    <path d="M9 13h6" />
  </svg>
);

export const CalendarIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <rect x={3} y={5} width={18} height={16} rx={3} />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3 11h18" />
  </svg>
);

export const DocumentIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h4" />
  </svg>
);

export const HammerIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="m3 13 6 6" />
    <path d="m11 21 4-4" />
    <path d="M14 3h5l2 2-4 4-3-3-5 5" />
  </svg>
);

export const GearIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <circle cx={12} cy={12} r={3} />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 3.6 7a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 7 3.6V3.5A1.5 1.5 0 0 0 8.5 2H9a2 2 0 0 1 2-2 2 2 0 0 1 2 2h.5A1.5 1.5 0 0 0 15 3.5v.1a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.63.14 1.09.7 1.09 1.37A1.65 1.65 0 0 0 21 12c0 .67-.46 1.23-1.1 1.4Z" />
  </svg>
);

export const BookIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M4 19.5V5a2 2 0 0 1 2-2h5v17.5a2 2 0 0 0-2-2H4Z" />
    <path d="M15 19.5V3h3a2 2 0 0 1 2 2v14.5a2 2 0 0 0-2-2h-3Z" />
  </svg>
);

export const LaptopIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <rect x={3} y={5} width={18} height={11} rx={2} />
    <path d="M2 19h20" />
  </svg>
);

export const PenIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M17 3l4 4L7 21H3v-4L17 3Z" />
    <path d="M15 5l4 4" />
  </svg>
);

export const TargetIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <circle cx={12} cy={12} r={8} />
    <circle cx={12} cy={12} r={4} />
    <path d="m19 5-3 3" />
    <path d="m21 3-2 2" />
  </svg>
);

export const SparklesIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <circle cx={12} cy={12} r={2} />
  </svg>
);

export const PieChartIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M12 3v9h9" />
    <path d="M21 12a9 9 0 1 1-9-9" />
  </svg>
);

export const LeafIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M5 21c3-10 11-15 14-16a2 2 0 0 1 2 2c-1 3-6 11-16 14Z" />
    <path d="M5 21c-1-5 4-10 9-11" />
  </svg>
);

export const EyeIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
    <circle cx={12} cy={12} r={3} />
  </svg>
);

export const CartIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <circle cx={9} cy={21} r={1.5} />
    <circle cx={19} cy={21} r={1.5} />
    <path d="M5 4h2l2 12h10l2-8H8" />
  </svg>
);

export const PackageIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="m21 16-9 5-9-5V8l9-5 9 5Z" />
    <path d="m3.3 7.3 8.7 4.7 8.7-4.7" />
    <path d="M12 12v9" />
  </svg>
);

export const TruckIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <rect x={1} y={3} width={15} height={13} rx={2} />
    <path d="M16 8h4l3 4v4h-3" />
    <circle cx={7} cy={18} r={2} />
    <circle cx={19} cy={18} r={2} />
  </svg>
);

export const LocationIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M12 21c-4.5-4-7-7-7-10a7 7 0 1 1 14 0c0 3-2.5 6-7 10Z" />
    <circle cx={12} cy={11} r={2.5} />
  </svg>
);

export const ClockIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <circle cx={12} cy={12} r={8} />
    <path d="M12 8v5l3 2" />
  </svg>
);

export const FlameIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M12 22c4-2 6-5 6-9a6 6 0 0 0-2.5-4.8L12 3 10 7 8 5s-3 3-3 8a7 7 0 0 0 7 7Z" />
  </svg>
);

export const PhoneIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2H7a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2L7.91 9.09a16 16 0 0 0 7 7l.56-.34a2 2 0 0 1 2 .08 13 13 0 0 0 2.77.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

export const MailIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <rect x={2} y={4} width={20} height={16} rx={2} />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

export const UserIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <circle cx={12} cy={7} r={4} />
    <path d="M5.5 21a8.5 8.5 0 0 1 13 0" />
  </svg>
);

export const CheckIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="m20 6-11 11-5-5" />
  </svg>
);

export const CloseIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const UsersIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx={9} cy={7} r={4} />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const WalletIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M20 7H5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3Z" />
    <path d="M7 7V5a3 3 0 0 1 3-3h9" />
    <path d="M15 12h2" />
  </svg>
);

export const CreditCardIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <rect x={2} y={5} width={20} height={14} rx={2} />
    <path d="M2 10h20" />
    <path d="M6 15h2" />
    <path d="M10 15h2" />
  </svg>
);

export const LockIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <rect x={4} y={11} width={16} height={11} rx={2} />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <path d="M12 17v2" />
  </svg>
);

export const SaveIcon: FC<IconProps> = ({ className, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={withDefaults(className)}
    {...props}
  >
    <path d="M7 3h10l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M7 3v6h8V3" />
    <path d="M7 21v-5h10v5" />
  </svg>
);
