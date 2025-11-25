// components/Points/PointSelector.tsx
import React from 'react';
import { useUnit } from 'effector-react';
import { $points, loadPoints } from '../../models/points.ts';
import { $currentUser } from '../../models/users.ts';
import {
  $selectedPoint,
  setSelectedPoint,
} from '../../models/selectedPoint.ts';
import type { Point } from '../../types/points.ts';

interface PointSelectorProps {
  onPointSelect?: (pointId: string) => void;
  showAdminInfo?: boolean;
  className?: string;
  showTitle?: boolean;
}

export const PointSelector: React.FC<PointSelectorProps> = ({
  onPointSelect,
  showAdminInfo = true,
  className = '',
  showTitle = false,
}) => {
  const [points, currentUser, selectedPoint] = useUnit([
    $points,
    $currentUser,
    $selectedPoint,
  ]);

  const [handleLoadPoints, handleSetSelectedPoint] = useUnit([
    loadPoints,
    setSelectedPoint,
  ]);

  const adminPoint = currentUser?.point_id;
  const isPointAdmin = Boolean(adminPoint);

  const activePoints = points.filter(point => point.isActive);

  React.useEffect(() => {
    handleLoadPoints();
  }, [handleLoadPoints]);

  // Автоматически выбираем точку администратора при загрузке
  React.useEffect(() => {
    if (
      isPointAdmin &&
      adminPoint &&
      activePoints.length > 0 &&
      !selectedPoint
    ) {
      const pointExists = activePoints.find(p => p._id === adminPoint);
      if (pointExists) {
        console.log('Auto-selecting admin point:', adminPoint);
        handleSetSelectedPoint(adminPoint);
        onPointSelect?.(adminPoint);
      }
    }
  }, [
    isPointAdmin,
    adminPoint,
    activePoints,
    selectedPoint,
    handleSetSelectedPoint,
    onPointSelect,
  ]);

  const handlePointSelect = (pointId: string) => {
    handleSetSelectedPoint(pointId);
    onPointSelect?.(pointId);
  };

  const selectedPointInfo = activePoints.find(p => p._id === selectedPoint);
  const adminPointInfo = activePoints.find(p => p._id === adminPoint);

  // Если администратор и точка загружена, показываем упрощенную информацию
  if (isPointAdmin && adminPointInfo && showAdminInfo) {
    return (
      <div
        className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <span className="text-xl">
              {adminPointInfo.type === 'canteen' ? '🍽️' : '🛍️'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">
              {adminPointInfo.name}
            </h3>
            <p className="text-sm text-green-700">
              {adminPointInfo.type === 'canteen' ? 'Столовая' : 'Буфет'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <h3 className="font-semibold text-gray-900 text-lg">Выберите точку</h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activePoints.map(point => (
          <button
            key={point._id}
            onClick={() => handlePointSelect(point._id)}
            className={`p-3 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-md ${
              selectedPoint === point._id
                ? 'border-green-500 bg-green-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-green-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  point.type === 'canteen' ? 'bg-blue-100' : 'bg-green-100'
                }`}
              >
                <span className="text-sm">
                  {point.type === 'canteen' ? '🍽️' : '🛍️'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm">
                  {point.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {point.type === 'canteen' ? 'Столовая' : 'Буфет'}
                </p>
              </div>
              {selectedPoint === point._id && (
                <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs">
                  ✓
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {activePoints.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Нет доступных точек</p>
        </div>
      )}
    </div>
  );
};

export default PointSelector;
