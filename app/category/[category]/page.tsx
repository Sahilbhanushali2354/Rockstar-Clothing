"use client";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { FStore } from "@/firebase/firebase.config";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useParams } from "next/navigation";
import { Spin } from "antd";

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    file: {
        url: string;
        name: string;
    };
}

const CategoryPage = () => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const router = useParams();
    const { category } = router as { category: string };

    // Fetch products from Firebase based on category
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                const productsCollection = collection(FStore, category as string);
                const productsSnapshot = await getDocs(productsCollection);
                const productsList = productsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Product[];
                setProducts(productsList);
                setLoading(false)
            } catch (error) {
                setLoading(false)
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [category]);

    return (
        <Spin spinning={loading} className="min-h-screen flex flex-col flex-grow bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
            <Navbar /> {/* Navbar included at the top */}

            {/* Category Collection Section */}
            <div className="flex-grow py-20 px-5">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-5xl font-extrabold text-center mb-16 animate-fade-in-down">
                        {category && category.charAt(0).toUpperCase() + category.slice(1)} Collection
                    </h1>
                    {products.length === 0 ? (
                        <h1 className="text-center text-2xl text-red-500">
                            Oops!! No Products Available Right Now
                        </h1>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-gray-800 p-6 rounded-xl hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
                                >
                                    <div className="relative">
                                        <img
                                            src={product.file.url}
                                            alt={product.title}
                                            className="w-full h-72 object-cover rounded-lg mb-4 transition-transform transform hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50 rounded-lg" />
                                    </div>
                                    <h3 className="text-2xl font-semibold mb-2">{product.title}</h3>
                                    <p className="text-gray-400 mb-4">{product.description}</p>
                                    <p className="text-lg font-bold text-blue-500">{product.price} Rs</p>
                                    <div className="mt-4">
                                        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:scale-105 transition-transform duration-300">
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Footer /> {/* Footer included at the bottom */}
        </Spin>
    );
};

export default CategoryPage;
