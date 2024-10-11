// app/pages/profile.tsx
"use client";

import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase.config";

const Profile = () => {
  const router = useRouter();

  const [user] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
  });

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(
    0
  )}`.toUpperCase();

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  const handleLogout = () => {
signOut(auth).then(() => {
router.push('/auth/login')
}).catch((error) => {
  console.log(error)
});
    router.push("/login");
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md mx-4">
          <div className="bg-blue-600 rounded-full w-24 h-24 flex items-center justify-center text-4xl mx-auto mb-6">
            {initials}
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">{`${user.firstName} ${user.lastName}`}</h2>
          <p className="text-gray-300 text-center mb-4">{user.email}</p>
          <hr className="my-4 border-gray-700" />
          <div className="flex flex-col space-y-4 mt-4">
            <button
              onClick={handleEditProfile}
              className="bg-green-600 hover:bg-green-700 transition duration-200 py-2 px-4 rounded-full w-full text-center"
            >
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 transition duration-200 py-2 px-4 rounded-full w-full text-center"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
