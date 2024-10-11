'use-client'

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Spin } from 'antd';
import { useState } from 'react';

const Checkout = () => {
  const [loader,setLoader] = useState(false)
  return (
    <Spin spinning={loader}>
      <Navbar />
      <main className="px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        {/* Add payment integration later here */}
      </main>
      <Footer />
    </Spin>
  );
};

export default Checkout;
