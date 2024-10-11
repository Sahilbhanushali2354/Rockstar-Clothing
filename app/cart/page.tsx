'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useState } from 'react';
import { Spin } from 'antd';

const Cart = () => {
  const [loader, setLoader] = useState(false)
  const cartItems = [
    { id: 1, name: 'Slim Fit Jeans', price: 49.99, quantity: 1 },
    { id: 2, name: 'Polo T-Shirt', price: 29.99, quantity: 2 },
  ];

  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <Spin spinning={loader} className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Your Cart</h1>
        <div className="space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 p-4 rounded-md shadow-md transition-transform duration-300 hover:scale-105">
              <div>
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-gray-400">${item.price.toFixed(2)} x {item.quantity}</p>
              </div>
              <p className="text-xl font-bold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-right">
          <p className="text-xl font-bold">Total: ${totalAmount.toFixed(2)}</p>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg mt-4 transition-transform duration-300 hover:scale-105">
            Proceed to Checkout
          </button>
        </div>
      </main>
      <Footer />
    </Spin>
  );
};

export default Cart;
