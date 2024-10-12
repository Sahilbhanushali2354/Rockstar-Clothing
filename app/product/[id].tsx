"use-client"
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
const ProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;

  // Fetch product data based on the ID (for now, let"s use a placeholder)
  const product = {
    id,
    name: "Slim Fit Jeans",
    description: "Stylish and comfortable slim fit jeans.",
    price: 49.99,
    sizes: ["S", "M", "L", "XL"],
    image: "/images/jeans.jpg",
  };

  return (
    <div>
      <Navbar />
      <main className="px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <img src={product.image} alt={product.name} className="w-full h-auto rounded-md" />
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-gray-700 mt-4">${product.price}</p>
            <p className="mt-6">{product.description}</p>
            <div className="mt-6">
              <label htmlFor="size" className="block text-sm font-semibold">Size</label>
              <select id="size" className="mt-2 p-2 border rounded">
                {product.sizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <button className="bg-black text-white py-2 px-4 rounded mt-6">Add to Cart</button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
