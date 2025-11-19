// components/ItemModal/ItemModal.tsx
import React from 'react';
import { useUnit } from 'effector-react';
import {
  addToCart,
  $cart,
  updateCartItemQuantity,
  removeFromCart,
} from '../../models/cart';
import { $currentUser } from '../../models/users';
import Button from '../layout/Button/Button.tsx';

interface ItemModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  isInCart?: boolean;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  item,
  isOpen,
  onClose,
  isInCart = false,
}) => {
  const [
    currentUser,
    cart,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
  ] = useUnit([
    $currentUser,
    $cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
  ]);

  if (!isOpen || !item) return null;

  // Получение количества товара в корзине
  const getItemQuantity = () => {
    const cartItem = cart.find(cartItem => cartItem.item._id === item._id);
    return cartItem ? cartItem.quantity : 0;
  };

  const quantity = getItemQuantity();

  const handleAddToCartClick = () => {
    handleAddToCart({
      _id: item._id,
      uniq_nom: item.uniq_nom || item._id,
      name: item.name,
      price: item.price,
      description: item.description,
      category_slug: item.category_slug,
      calories: item.calories,
      number_pribors: item.number_pribors,
      image_url: item.image_url,
      preparation_time: item.preparation_time,
    });
  };

  const handleIncreaseQuantity = () => {
    handleUpdateQuantity({
      id: item._id,
      quantity: quantity + 1,
    });
  };

  const handleDecreaseQuantity = () => {
    if (quantity === 1) {
      handleRemoveFromCart(item._id);
    } else {
      handleUpdateQuantity({
        id: item._id,
        quantity: quantity - 1,
      });
    }
  };

  const canAddToCart =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.role === 'user');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Затемнение фона */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Модальное окно */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 backdrop-blur-sm transition-all duration-300 hover:scale-110"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Контент */}
          <div className="flex flex-col lg:flex-row">
            {/* Изображение */}
            <div className="lg:w-1/2">
              {item.image_url || item.image?.url ? (
                <img
                  src={item.image_url || item.image?.url}
                  alt={item.name}
                  className="w-full h-64 lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 lg:h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <span className="text-6xl text-gray-300">🍽️</span>
                </div>
              )}
            </div>

            {/* Информация */}
            <div className="lg:w-1/2 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {item.name}
              </h2>

              {item.description && (
                <p className="text-gray-600 text-base leading-relaxed mb-6">
                  {item.description}
                </p>
              )}

              {/* Детали */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-green-dark">
                    {item.price} ₽
                  </span>
                  {item.category_slug && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-light text-green-darker border border-green-lighter">
                      {item.category_slug}
                    </span>
                  )}
                </div>

                {/* Характеристики */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  {item.calories && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">🔥</span>
                      <span>{item.calories} ккал</span>
                    </div>
                  )}
                  {item.preparation_time && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">⏱️</span>
                      <span>{item.preparation_time} мин</span>
                    </div>
                  )}
                  {item.number_pribors && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">🍴</span>
                      <span>{item.number_pribors} приборов</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Кнопка добавления в корзину */}
              {canAddToCart && (
                <div className="flex items-center justify-center gap-4">
                  {quantity === 0 ? (
                    <Button
                      onClick={handleAddToCartClick}
                      variant="primary"
                      size="lg"
                      className="flex-1"
                    >
                      🛒 Добавить в корзину
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleDecreaseQuantity}
                        variant="outline"
                        size="lg"
                        className="w-12 h-12 !p-0"
                      >
                        -
                      </Button>
                      <span className="text-2xl font-bold text-green-dark min-w-[40px] text-center">
                        {quantity}
                      </span>
                      <Button
                        onClick={handleIncreaseQuantity}
                        variant="outline"
                        size="lg"
                        className="w-12 h-12 !p-0"
                      >
                        +
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
