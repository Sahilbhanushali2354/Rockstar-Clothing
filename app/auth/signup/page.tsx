"use client";

import React, { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";

const Signup = () => {
  const router = useRouter();

  // State for form fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: "",
  });

  // State for errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" }); // Clear error on change
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const phoneRegex = /^[0-9]{10}$/; // Basic phone number validation (10 digits)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation

    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.lastName) newErrors.lastName = "Last name is required.";
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.phoneNumber || !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number.";
    }
    if (!formData.address) newErrors.address = "Address is required.";
    if (formData.password.length < 5) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    setLoading(true)
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length === 0) {
      // Implement Firebase signup logic here

      // After successful signup, redirect
      setLoading(false)
      router.push("/login"); // Redirect to login page
    } else {
      setLoading(false)
      setErrors(validationErrors);
    }
  };

  return (
    <Spin spinning={loading} className="bg-gray-900 text-white min-h-screen flex flex-col w-full">
      <main className="flex-grow flex items-center justify-center">
        <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-full max-w-md mx-4 transition-transform transform hover:scale-105 duration-500">
          <h2 className="text-3xl font-bold text-center mb-6">
            Create an Account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                required
                className={`bg-gray-700 text-white p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full ${
                  errors.firstName ? "border-red-500" : "border-gray-600"
                } transition duration-300`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs">{errors.firstName}</p>
              )}

              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                required
                className={`bg-gray-700 text-white p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full ${
                  errors.lastName ? "border-red-500" : "border-gray-600"
                } transition duration-300`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs">{errors.lastName}</p>
              )}
            </div>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className={`bg-gray-700 text-white p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full ${
                errors.email ? "border-red-500" : "border-gray-600"
              } transition duration-300`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}

            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Phone Number"
              required
              className={`bg-gray-700 text-white p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full ${
                errors.phoneNumber ? "border-red-500" : "border-gray-600"
              } transition duration-300`}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs">{errors.phoneNumber}</p>
            )}

            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              required
              className={`bg-gray-700 text-white p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full ${
                errors.address ? "border-red-500" : "border-gray-600"
              } transition duration-300`}
            />
            {errors.address && (
              <p className="text-red-500 text-xs">{errors.address}</p>
            )}

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className={`bg-gray-700 text-white p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full ${
                errors.password ? "border-red-500" : "border-gray-600"
              } transition duration-300`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 transition duration-200 py-2 rounded-full w-full shadow-lg transform hover:scale-105"
            >
              Sign Up
            </button>
          </form>

          {/* Back to Login Button */}
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-4 text-blue-400 hover:underline transition duration-300"
          >
            Back to Login
          </button>
        </div>
      </main>
    </Spin>
  );
};

export default Signup;
