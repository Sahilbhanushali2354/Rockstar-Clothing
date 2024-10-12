"use client";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/firebase.config";
import "react-toastify/dist/ReactToastify.css";
import { Spin } from "antd";
import Image from "next/image";

export default function Home() {
  const navigation = useRouter();
  const [loader, setLoader] = useState(false)

  useEffect(() => {
    const x = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigation.push("/auth/login");
      }
    });

    return () => x();
  }, [navigation]);


  return (
    <Spin spinning={loader} className="w-full min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-800 via-gray-900 to-black py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 animate-fade-in-down">
            Discover the Rockstar Collection
          </h1>
          <p className="text-xl lg:text-2xl mb-10 font-light">
            Elevate your style with our exclusive range of mens clothing.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-5 max-w-[1280px] mx-auto">
        <h2 className="text-4xl font-bold text-center mb-10 animate-fade-in-up">
          Our Featured Collection
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
          {/* Jeans */}
          <Link href="/category/jeans" onClick={() => setLoader(true)}>
            <div className="group bg-gray-800 p-6 rounded-xl hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
              <Image
                src="/images/jeans/1.jpg"
                alt="Jeans"
                className="rounded-lg mb-4 group-hover:opacity-90 transition-opacity duration-300 w-full h-auto"
              />
              <h3 className="text-xl font-semibold mb-2">Stylish Jeans</h3>
              {/* <p className="text-gray-400">$49.99</p> */}
            </div>
          </Link>

          {/* T-shirts */}
          <Link href="/category/t_shirts">
            <div className="group bg-gray-800 p-6 rounded-xl hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
              <Image
                src="/images/sport-tshirt/1.jpg"
                alt="T-shirts"
                className="rounded-lg mb-4 group-hover:opacity-90 transition-opacity duration-300 w-full h-auto"
              />
              <h3 className="text-xl font-semibold mb-2">Sport T-shirt</h3>
              {/* <p className="text-gray-400">$35.99</p> */}
            </div>
          </Link>

          {/* Trousers */}
          <Link href="/category/track-pants">
            <div className="group bg-gray-800 p-6 rounded-xl hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
              <Image
                src="/images/sport-trouser/1.jpg"
                alt="Trousers"
                className="rounded-lg mb-4 group-hover:opacity-90 transition-opacity duration-300 w-full h-auto"
              />
              <h3 className="text-xl font-semibold mb-2">Sport Trousers</h3>
              {/* <p className="text-gray-400">$45.99</p> */}
            </div>
          </Link>
          <Link href="/category/socks">
            <div className="group bg-gray-800 p-6 rounded-xl hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
              <Image
                src="/images/formal-socks/1.jpg"
                alt="Trousers"
                className="rounded-lg mb-4 group-hover:opacity-90 transition-opacity duration-300 w-full h-auto"
              />
              <h3 className="text-xl font-semibold mb-2">Socks</h3>
              {/* <p className="text-gray-400">$45.99</p> */}
            </div>
          </Link>

          <Link href="/category/perfumes">
            <div className="group bg-gray-800 p-6 rounded-xl hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
              <Image
                src="/images/perfumes/1.jpg"
                alt="Trousers"
                className="rounded-lg mb-4 group-hover:opacity-90 transition-opacity duration-300 w-full h-auto"
              />
              <h3 className="text-xl font-semibold mb-2">Perfumes</h3>
              {/* <p className="text-gray-400">$45.99</p> */}
            </div>
          </Link>

          {/* Shorts */}
          <Link href="/category/shorts">
            <div className="group bg-gray-800 p-6 rounded-xl hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
              <Image
                src="/images/sport-shorts/1.jpg"
                alt="Shorts"
                className="rounded-lg mb-4 group-hover:opacity-90 transition-opacity duration-300 w-full h-auto"
              />
              <h3 className="text-xl font-semibold mb-2">Sport Shorts</h3>
              {/* <p className="text-gray-400">$29.99</p> */}
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </Spin>
  );
}
