"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCart"; // A component to show individual products

const Shop = () => {
  const products = [
    { id: 1, name: "Slim Fit Jeans", price: 49.99, image: "/images/jeans.jpg" },
    { id: 2, name: "Polo T-Shirt", price: 29.99, image: "/images/tshirt.jpg" },
    {
      id: 3,
      name: "Sport T-Shirt",
      price: 35.99,
      image: "/images/sport-tshirt.jpg",
    },
    {
      id: 4,
      name: "Regular Shorts",
      price: 24.99,
      image: "/images/regular-shorts.jpg",
    },
    {
      id: 5,
      name: "Sport Socks",
      price: 9.99,
      image: "/images/sport-socks.jpg",
    },
    {
      id: 6,
      name: "Daily Life Trouser",
      price: 39.99,
      image: "/images/daily-trousers.jpg",
    },
    // Add more product details here
  ];

  return (
    <div className="bg-gray-900 text-white">
      <Navbar />
      <main className="px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Shop Men’s Clothing
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
