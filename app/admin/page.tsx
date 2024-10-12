"use client";
import React from "react";
import Link from "next/link";

const AdminDashboard = () => {

    return (
        <div className="w-full min-h-screen bg-gray-900 text-white p-10">
            <h1 className="text-4xl font-bold text-center mb-10">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {/* Add Products Box */}
                <Link href="/admin/addproduct">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-all">
                        <h2 className="text-2xl font-bold">Add Products</h2>
                        <p className="mt-2 text-gray-400">Insert new items into collections</p>
                    </div>
                </Link>

                {/* Category Boxes */}
                <Link href="/admin/category/jeans">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-all">
                        <h2 className="text-2xl font-bold">Jeans</h2>
                        <p className="mt-2 text-gray-400">Manage Jeans Collection</p>
                    </div>
                </Link>

                <Link href="/admin/category/shirts">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-all">
                        <h2 className="text-2xl font-bold">Shirts</h2>
                        <p className="mt-2 text-gray-400">Manage Shirts Collection</p>
                    </div>
                </Link>

                <Link href="/admin/category/t_shirts">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-all">
                        <h2 className="text-2xl font-bold">T-Shirts</h2>
                        <p className="mt-2 text-gray-400">Manage T-Shirts Collection</p>
                    </div>
                </Link>
                <Link href="/admin/category/track-pants">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-all">
                        <h2 className="text-2xl font-bold">Track-Pants</h2>
                        <p className="mt-2 text-gray-400">Manage Track-Pants Collection</p>
                    </div>
                </Link><Link href="/admin/category/perfumes">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-all">
                        <h2 className="text-2xl font-bold">Perfumes</h2>
                        <p className="mt-2 text-gray-400">Manage Perfumes Collection</p>
                    </div>
                </Link><Link href="/admin/category/undergarments">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700 transition-all">
                        <h2 className="text-2xl font-bold">Undergarments</h2>
                        <p className="mt-2 text-gray-400">Manage Undergarments Collection</p>
                    </div>
                </Link>


            </div>
        </div>
    );
};

export default AdminDashboard;
