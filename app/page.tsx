import { Button } from '@/components/ui/button';
import React from 'react';
import Link from 'next/link';
const DraBlissLanding = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center px-4 py-5 md:px-10 bg-white shadow-sm">
        <div className="text-2xl font-bold mb-4 md:mb-0">
          DRA <span className="text-red-500">BLISS</span>
        </div>
        <nav>
          <ul className="flex flex-wrap justify-center gap-4 md:gap-8">
            <li><a href="#" className="text-gray-700 hover:text-red-500 font-medium">Home</a></li>
            <li><a href="#" className="text-gray-700 hover:text-red-500 font-medium">New Shoes</a></li>
            <li><a href="#" className="text-gray-700 hover:text-red-500 font-medium">Discounts</a></li>
            <li><a href="#" className="text-gray-700 hover:text-red-500 font-medium">Store</a></li>
            <li>
              <Button className="bg-red-500 text-white px-4 py-2 rounded-md font-bold hover:bg-red-600 transition">
                <Link href="/sign-in">
                  Login
                </Link>

              </Button>
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
};

export default DraBlissLanding;