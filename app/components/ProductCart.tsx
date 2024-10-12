"use client"
import Image from "next/image";
type ProductProps = {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
};

const ProductCard = ({ product }: ProductProps) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-105">
      <Image
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">{product.name}</h2>
        <p className="text-gray-400 mb-2">${product.price.toFixed(2)}</p>
        <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg transition-transform duration-300 hover:scale-105">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
