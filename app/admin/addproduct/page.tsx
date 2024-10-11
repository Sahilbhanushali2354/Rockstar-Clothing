'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';
import { auth, FStore } from '@/firebase/firebase.config';
import { signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import Loader from '../../components/Loader';
import { Spin } from 'antd';

interface TFile {
    name: string;
    type: string;
}

interface TCategoryoption {
    jeans: string[];
    shirts: string[];
    t_shirts: string[];
    hoodies: string[];
    track_pants: string[];
    shorts: string[];
    perfumes: string[];
    undergarments: string[];
    socks: string[];
}

interface TFormData {
    file?: null,
    category: string,
    subcategory: string,
    title: string,
    description: string,
    price: string,
}

const AddProduct = () => {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [formData, setFormData] = useState<TFormData>({
        file: null,
        category: 'jeans',
        subcategory: '',
        title: '',
        description: '',
        price: '',
    });
    const [newFile, setNewFile] = useState<TFile>({} as TFile);
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const navigation = useRouter();
    const authData = JSON.parse(localStorage.getItem('auth') ?? '');

    // Define subcategories for each category
    const categoryOptions: TCategoryoption = {
        jeans: ['straight_fit', 'slim_fit', 'bootcut'],
        shirts: ['casual', 'formal'],
        t_shirts: ['round_neck', 'v_neck', 'polo'],
        hoodies: ['zipped', 'pullover'],
        track_pants: ['joggers', 'sweatpants'],
        shorts: ['sport_shorts', 'casual_shorts'],
        perfumes: ['floral', 'woody', 'citrus'],  // Added perfume subcategories
        undergarments: ['briefs', 'boxers', 'thermal'],  // Added undergarments subcategories
        socks: ['ankle', 'crew', 'knee_high'],  // Added socks subcategories
    };

    useEffect(() => {
        const checkAdminRole = async () => {
            const user = authData;
            if (user) {
                const userDoc = await getDoc(doc(FStore, 'users', user.id));
                const userData = userDoc.data();

                if (userData?.role === 'admin') {
                    setIsAdmin(true);
                    setSubcategories(categoryOptions['jeans']);
                } else {
                    navigation.push('/'); // Redirect non-admins to the homepage
                }
            } else {
                navigation.push('/auth/login'); // Redirect to login if not authenticated
            }
            setLoading(false);
        };

        checkAdminRole();
    }, [navigation]);

    const handleLogout = () => {
        signOut(auth)
            .then(() => {
                localStorage.removeItem('auth');
                navigation.push('/auth/login');
            })
            .catch((error) => {
                console.error('Error during logout:', error);
            });
    };

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Update subcategory options when category changes
        if (name === 'category') {
            const categoryValue = value as keyof TCategoryoption;  // Explicitly define 'value' as a key of TCategoryoption

            setSubcategories(categoryOptions[categoryValue] || []);
            setFormData({ ...formData, category: value, subcategory: '' });
        }
    };

    const handleFileChange = (e: any) => {
        const files = e.target.files[0];
        setNewFile(files);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let fileURL = '';
            const storage = getStorage();
            const storageRef = ref(storage, `uploads/${formData.category}/${newFile.name}`);
            const metaData = { contentType: newFile.type as any };
            await uploadBytes(storageRef, newFile as any, metaData);
            fileURL = await getDownloadURL(storageRef);

            const productData = {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                file: { url: fileURL, name: newFile.name, type: newFile.type },
                subcategory: formData.subcategory,
                createdAt: new Date(),
            };

            const categoryCollectionRef = collection(FStore, formData.category);
            await addDoc(categoryCollectionRef, productData);

            alert('Product added successfully to the ' + formData.category + ' collection!');
            setLoading(false)

            setFormData({
                file: null,
                category: 'jeans',
                subcategory: '',
                title: '',
                description: '',
                price: '',
            });
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <Spin className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-10 text-white' spinning={loading}>
            <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8">
                <h2 className="text-4xl font-bold text-center mb-10">Add Products</h2>
                <form onSubmit={handleSubmit}>
                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="text-white block text-lg font-semibold mb-2">Upload File</label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="block w-full p-2 bg-gray-900 rounded-lg border border-gray-700 focus:outline-none"
                            required
                            name="file"
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="mb-6">
                        <label className="text-white block text-lg font-semibold mb-2">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full p-2 bg-gray-900 rounded-lg border border-gray-700 focus:outline-none"
                            required
                        >
                            <option value="jeans">Jeans</option>
                            <option value="shirts">Shirts</option>
                            <option value="t_shirts">T-shirts</option>
                            <option value="hoodies">Hoodies</option>
                            <option value="track_pants">Track Pants</option>
                            <option value="shorts">Shorts</option>
                            <option value="perfumes">Perfumes</option> {/* Added Perfume category */}
                            <option value="undergarments">Undergarments</option> {/* Added Undergarments category */}
                            <option value="socks">Socks</option> {/* Added Socks category */}
                        </select>
                    </div>

                    {/* Subcategory Selection */}
                    <div className="mb-6">
                        <label className="text-white block text-lg font-semibold mb-2">Subcategory</label>
                        <select
                            name="subcategory"
                            value={formData.subcategory}
                            onChange={handleInputChange}
                            className="w-full p-2 bg-gray-900 rounded-lg border border-gray-700 focus:outline-none"
                            required
                        >
                            {subcategories.map((subcategory, index) => (
                                <option key={index} value={subcategory}>
                                    {subcategory}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div className="mb-6">
                        <label className="text-white block text-lg font-semibold mb-2">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="block w-full p-2 bg-gray-900 rounded-lg border border-gray-700 focus:outline-none"
                            placeholder="Enter the title"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label className="text-white block text-lg font-semibold mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="block w-full p-2 bg-gray-900 rounded-lg border border-gray-700 focus:outline-none"
                            placeholder="Enter the description"
                            required
                        />
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                        <label className="text-white block text-lg font-semibold mb-2">Price</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="block w-full p-2 bg-gray-900 rounded-lg border border-gray-700 focus:outline-none"
                            placeholder="Enter the price"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-semibold hover:scale-105 transform transition duration-300"
                    >
                        Add Product
                    </button>
                </form>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full mt-6 p-3 bg-red-600 rounded-lg text-white font-semibold hover:bg-red-700 transform hover:scale-105 transition duration-300"
                >
                    Logout
                </button>
            </div>
        </Spin>
    );
};

export default AddProduct;
