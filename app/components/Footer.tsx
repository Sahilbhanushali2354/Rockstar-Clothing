import React from "react";

type FooterProps = {};

const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="w-[100%] bg-gray-900 text-white py-10">
      <div className="px-4 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              About Rockstar Clothing
            </h3>
            <p className="text-gray-400">
              Rockstar Clothing brings you the latest in men’s fashion. We focus
              on quality, style, and comfort. Whether you’re looking for casual
              wear or something for special occasions, we’ve got you covered.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <a href="/shop" className="text-gray-400 hover:text-white">
                  Jeans
                </a>
              </li>
              <li>
                <a href="/shop" className="text-gray-400 hover:text-white">
                  Shirts
                </a>
              </li>
              <li>
                <a href="/shop" className="text-gray-400 hover:text-white">
                  T-shirts
                </a>
              </li>
              <li>
                <a href="/shop" className="text-gray-400 hover:text-white">
                  Undergarments
                </a>
              </li>
              <li>
                <a href="/shop" className="text-gray-400 hover:text-white">
                  Perfumes
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">
                Email: support@rockstarclothing.com
              </li>
              <li className="text-gray-400">Phone: +91 8140108220</li>
              <li className="text-gray-400">
                Address: 123 Fashion Street, New York, NY
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-4 text-center">
          <p className="text-gray-500">
            © {new Date().getFullYear()} Rockstar Clothing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
