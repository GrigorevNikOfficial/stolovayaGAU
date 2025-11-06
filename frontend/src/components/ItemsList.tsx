import React from 'react';
import { useUnit } from 'effector-react';
import { $items, $isLoading, loadItems, loadItemsFx } from '../models/items';
import { addToCart } from '../models/cart';

export const ItemsList: React.FC = () => {
  const [items, isLoading, handleLoadItems, handleAddToCart] = useUnit([
    $items,
    $isLoading,
    loadItems,
    addToCart,
  ]);

  React.useEffect(() => {
    console.log('ItemsList: начата загрузка товаров');
    handleLoadItems();
  }, [handleLoadItems]);

  React.useEffect(() => {
    console.log('ItemsList: получены товары', items);
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Проверяем что items - массив перед использованием map
  const itemsArray = Array.isArray(items) ? items : [];

  console.log('ItemsList: отрисовываем товары', itemsArray);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Сетка товаров */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {itemsArray.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.name}
              </h3>

              {item.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-gray-900">
                  {item.price} ₽
                </span>
                {item.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                )}
              </div>

              {/* Дополнительная информация */}
              <div className="space-y-1 text-xs text-gray-500 mb-4">
                {item.cal && <div>Калории: {item.cal}</div>}
                {item.number_pribors && (
                  <div>Приборы: {item.number_pribors}</div>
                )}
              </div>

              <button
                onClick={() =>
                  handleAddToCart({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    description: item.description,
                    category: item.category,
                    cal: item.cal,
                    number_pribors: item.number_pribors,
                  })
                }
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors font-medium"
              >
                Добавить в корзину
              </button>
            </div>
          </div>
        ))}
      </div>

      {itemsArray.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Товары не найдены</p>
          <p className="text-sm text-gray-400 mt-2">
            Проверьте подключение к бэкенду или наличие товаров в базе
          </p>
          <button
            onClick={() => handleLoadItems()}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
};
