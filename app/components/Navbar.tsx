"use client";
import React, { useState } from "react";
import Link from "next/link";
import { CiShoppingCart } from "react-icons/ci";
import { BsChevronCompactUp } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
import SearchBar from "./SearchBar";
import Image from 'next/image'

const Navbar = () => {
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showNav, setShowNav] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);



  return (
    <div className="relative z-50">
      <div className="flex items-center justify-between py-4 relative">
        <div className="flex items-center md:space-x-10 lg:space-x-20">
          <div className="font-semibold text-2xl text-white">
            <Link href="/">Rockstar</Link>
          </div>
          <nav className="max-md:hidden">
            <ul className="flex items-center lg:space-x-10 space-x-7 opacity-70 text-[15px] text-gray-400">
              <li>
                <Link href="/" className="py-3 inline-block w-full">
                  Shop
                </Link>
              </li>
              {/* Dropdown for Our Products */}
              <li className="relative">
                <div
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="cursor-pointer py-3 inline-block w-full hover:text-white"
                >
                  Our Products
                </div>
                {showDropdown && (
                  <div
                    className="absolute top-full mt-2 bg-gray-800 text-white rounded-lg shadow-lg py-2 w-48 z-50 border border-gray-700"
                    onMouseLeave={() => setShowDropdown(false)}
                  >
                    <ul className="flex flex-col">
                      <li className="hover:bg-gray-700 p-2">
                        <Link href="/category/jeans">Jeans</Link>
                      </li>
                      <li className="hover:bg-gray-700 p-2">
                        <Link href="/category/shirts">Shirts</Link>
                      </li>
                      <li className="hover:bg-gray-700 p-2">
                        <Link href="/category/t-shirts">T-Shirts</Link>
                      </li>
                      <li className="hover:bg-gray-700 p-2">
                        <Link href="/category/track-pants">Track Pants</Link>
                      </li>
                      <li className="hover:bg-gray-700 p-2">
                        <Link href="/category/shorts">Shorts</Link>
                      </li>
                      <li className="hover:bg-gray-700 p-2">
                        <Link href="/category/socks">Socks</Link>
                      </li>
                      <li className="hover:bg-gray-700 p-2">
                        <Link href="/category/undergarments">Undergarments</Link>
                      </li>
                    </ul>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <SearchBar />
          <Link href="/profile">
            <div
              onClick={() => setShowProfile(!showProfile)}
              className="relative cursor-pointer"
            >
              <Image
                src="/images/user.png"
                className="w-[35px] h-[35px] rounded-full object-cover"
                alt="Profile"
              />
              <div
                className={`absolute bg-white z-50 rounded-lg shadow-lg ${showProfile ? "" : "hidden"
                  }`}
              ></div>
            </div>
          </Link>
          <Link href="/cart">
            <div className="p-2 bg-gray-100 rounded-full">
              <CiShoppingCart color="black" size={20} />
            </div>
          </Link>
          <span
            onClick={() => setShowNav(!showNav)}
            className="p-[9px] bg-gray-100 rounded-full md:hidden"
          >
            <BsChevronCompactUp
              color="black"
              className={`transition ease-in duration-150 ${showNav ? "rotate-180" : "0"
                }`}
            />
          </span>
        </div>
      </div>
      <div
        className={`md:hidden ${showNav ? "pb-4 px-5" : "h-0 invisible opacity-0"
          }`}
      >
        <ul className="flex flex-col text-[15px] opacity-75 px-2 text-gray-400">
          <li>
            <a href="/shop" className="py-3 inline-block w-full">
              Shop
            </a>
          </li>
          <li>
            <a href="/filters" className="py-3 inline-block w-full">
              Filters
            </a>
          </li>
          <li>
            <a href="/myproducts" className="py-3 inline-block w-full">
              My Product
            </a>
          </li>
        </ul>
        <div className="flex items-center bg-gray-100 p-2 rounded-lg my-4 py-3">
          <input
            type="text"
            className="outline-none w-full bg-transparent ml-2 caret-blue-500 placeholder:font-light placeholder:text-gray-600 text-[15px]"
            placeholder="Search"
            autoComplete="false"
          />
          <button>
            <BiSearch size={20} className="opacity-50" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
