"use client";

import { auth, FStore } from "@/firebase/firebase.config";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const navigation = useRouter();

  useEffect(() => {
    const x = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("rejected");
        navigation.push("/");
      }
    });

    return () => x();
  }, [navigation]);
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; password?: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (Object.keys(newErrors).length === 0) {
      signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          const user = userCredential.user;

          // Check if window is available (only on client-side)
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "auth",
              JSON.stringify({ email: user.email, id: user.uid })
            );
          }

          const userDoc = await getDoc(doc(FStore, "users", user.uid));
          console.log("---------------id", user.uid);

          if (userDoc.exists()) {
            const userData = userDoc.data();

            if (userData.role == "admin") {
              navigation.push("/admin");
            } else {
              navigation.push("/");
            }
          }
        })
        .catch((error) => {
          const errorMessage = error.message;
          setErrors({ email: errorMessage }); // Display the error message
        });
    } else {
      setErrors(newErrors);
    }
  };



  return (
    <div
      className="w-[100%] min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800"
    >
      <div className="w-full max-w-lg mx-auto bg-gray-800 p-10 rounded-3xl shadow-2xl transition-transform transform hover:scale-105 duration-500">
        <h2 className="text-4xl font-extrabold text-center text-white mb-10 tracking-wide">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-8">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-400 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 ${errors.email ? "border-red-500" : "border-gray-700"
                } bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200`}
              placeholder="Enter Your Email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-8">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-400 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 ${errors.password ? "border-red-500" : "border-gray-700"
                } bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-2">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r  text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl hover:bg-gradient-to-l from-indigo-600 to-blue-600 transform hover:scale-110 transition-all duration-300"
          >
            Login
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-gray-400 mt-6">
          Do not have an account?
          <Link href="/auth/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
