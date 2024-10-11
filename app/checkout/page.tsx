'use-client'

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Checkout = () => {
  // const [loader,setLoader] = useState(false)
  return (
    <div>
      <Navbar />
      <main className="px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        {/* Add payment integration later here */}
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
