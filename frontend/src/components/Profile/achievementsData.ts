import type { ProfileStats } from './profileStats';

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  getProgress: (stats: ProfileStats) => number;
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first-request',
    title: 'Первый заказ',
    description: 'Создайте или выполните хотя бы одну заявку в маркетплейсе.',
    icon: '🥇',
    threshold: 1,
    getProgress: stats => stats.requestsAsCustomer + stats.requestsAsProvider,
  },
  {
    id: 'active-publisher',
    title: 'Каталог на ладони',
    description: 'Опубликуйте 3 услуги, доступные другим студентам.',
    icon: '📦',
    threshold: 3,
    getProgress: stats => stats.servicesPublished,
  },
  {
    id: 'reliable-partner',
    title: 'Надёжный партнёр',
    description: 'Завершите 5 сделок в роли заказчика или исполнителя.',
    icon: '🤝',
    threshold: 5,
    getProgress: stats => stats.completedRequests,
  },
];

export const getAchievementProgress = (stats: ProfileStats) =>
  ACHIEVEMENT_DEFINITIONS.map(def => ({
    id: def.id,
    title: def.title,
    description: def.description,
    icon: def.icon,
    threshold: def.threshold,
    progress: def.getProgress(stats),
  }));

export const countUnlockedAchievements = (stats: ProfileStats) =>
  getAchievementProgress(stats).filter(item => item.progress >= item.threshold).length;
