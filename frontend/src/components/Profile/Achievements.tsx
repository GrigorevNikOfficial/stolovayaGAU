import React from 'react';
import type { ProfileStats } from './profileStats';
import { getAchievementProgress, countUnlockedAchievements } from './achievementsData';
import type { AchievementDefinition } from './achievementsData';

export type Achievement = AchievementDefinition & { progress: number };

type AchievementsProps = {
  stats: ProfileStats;
};


const AchievementCard: React.FC<{
  achievement: Achievement;
  onOpen: () => void;
}> = ({ achievement, onOpen }) => {
  const progressPercent = Math.min(100, Math.round((achievement.progress / achievement.threshold) * 100));
  const achieved = achievement.progress >= achievement.threshold;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-left rounded-3xl border px-5 py-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/40 ${
        achieved ? 'border-emerald-300 bg-white shadow-[0_18px_35px_rgba(16,185,129,0.18)]' : 'border-border-soft bg-surface-muted'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${
            achieved ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-brand-indigo'
          }`}
          aria-hidden="true"
        >
          {achievement.icon}
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-text-primary">{achievement.title}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted mt-1">
            {achieved ? 'получено' : 'в процессе'}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-text-muted">
          <span>прогресс</span>
          <span>
            {Math.min(achievement.progress, achievement.threshold)} / {achievement.threshold}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-border-subtle">
          <div
            className={`h-full rounded-full transition-all ${achieved ? 'bg-emerald-500' : 'bg-brand-indigo'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
};

const AchievementModal: React.FC<{ achievement: Achievement; onClose: () => void }> = ({ achievement, onClose }) => {
  const progressPercent = Math.min(100, Math.round((achievement.progress / achievement.threshold) * 100));
  const achieved = achievement.progress >= achievement.threshold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[32px] border border-border-soft bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${
              achieved ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-seashell text-brand-indigo'
            }`}
            aria-hidden="true"
          >
            {achievement.icon}
          </div>
          <div>
            <p className="text-xl font-semibold text-text-primary">{achievement.title}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted mt-1">
              {achieved ? 'получено' : 'нужно ещё немного'}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-text-secondary">{achievement.description}</p>
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-text-muted">
            <span>прогресс</span>
            <span>
              {Math.min(achievement.progress, achievement.threshold)} / {achievement.threshold}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-border-subtle">
            <div
              className={`h-full rounded-full ${achieved ? 'bg-emerald-500' : 'bg-brand-indigo'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <Button variant="primary" size="md" className="mt-6 w-full" onClick={onClose}>
          Готово
        </Button>
      </div>
    </div>
  );
};

export const Achievements: React.FC<AchievementsProps> = ({ stats }) => {
  const achievements: Achievement[] = getAchievementProgress(stats);
  const unlockedCount = countUnlockedAchievements(stats);
  const [selectedAchievement, setSelectedAchievement] = React.useState<Achievement | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border-soft bg-white px-5 py-6 shadow-brand-card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-3xl font-semibold text-brand-indigo">{unlockedCount} / {achievements.length}</p>
        <p className="text-sm text-text-secondary">Прогресс обновляется автоматически после действий в маркетплейсе.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onOpen={() => setSelectedAchievement(achievement)}
          />
        ))}
      </div>

      {selectedAchievement && (
        <AchievementModal achievement={selectedAchievement} onClose={() => setSelectedAchievement(null)} />
      )}
    </div>
  );
};

export default Achievements;
