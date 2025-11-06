import React from 'react';
import { useUnit } from 'effector-react';
import { Header } from '../components/Header';
import { Cart } from '../components/Cart';
import { ItemsList } from '../components/ItemsList';
import { $isCartOpen, setCartOpen } from '../models/cart';

export const HomePage: React.FC = () => {
  const [isCartOpen, handleSetCartOpen] = useUnit([$isCartOpen, setCartOpen]);

  const handleCartClose = () => {
    handleSetCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <Header onCartClick={() => handleSetCartOpen(true)} />

      {/* Основной контент - меню товаров */}
      <main>
        <ItemsList />
      </main>

      {/* Корзина */}
      <Cart isOpen={isCartOpen} onClose={handleCartClose} />
    </div>
  );
};
