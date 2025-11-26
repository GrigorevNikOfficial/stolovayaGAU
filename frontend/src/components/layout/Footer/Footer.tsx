// components/layout/Footer/Footer.tsx
import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-footer text-white">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Основной контент футера */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Лого и описание */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold mb-4">СтоловаяГАУ</h3>
              <p className="text-gray-300 text-sm leading-relaxed max-w-md">
                Современная столовая с вкусной и здоровой пищей. Мы заботимся о
                качестве наших блюд и вашем комфорте.
              </p>
            </div>

            {/* Контакты */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Контакты</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <span className="text-gray-400 mt-0.5">📞</span>
                  <div>
                    <p className="text-gray-300">+7 (939) 782-06-57</p>
                    <p className="text-gray-400 text-xs">
                      Ежедневно 8:00-20:00
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-gray-400 mt-0.5">📧</span>
                  <div>
                    <p className="text-gray-300">4bsolutefleur@gmail.com</p>
                    <p className="text-gray-400 text-xs">
                      Разработчик ответит в течении дня
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Адрес */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Адрес</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <span className="text-gray-400 mt-0.5">📍</span>
                  <div>
                    <p className="text-gray-300">ул. Студенческая, 15</p>
                    <p className="text-gray-400 text-xs">
                      Главный корпус, 1 этаж
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-gray-400 mt-0.5">⏰</span>
                  <div>
                    <p className="text-gray-300">Пн-Пт: 8:00-18:00</p>
                    <p className="text-gray-400 text-xs">Сб-Вс: 9:00-16:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Нижняя часть с копирайтом */}
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-gray-400 text-sm">
                © {currentYear} СтоловаяГАУ. Все права защищены.
              </p>
              <div className="flex space-x-6 text-sm">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Политика конфиденциальности
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Условия использования
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
