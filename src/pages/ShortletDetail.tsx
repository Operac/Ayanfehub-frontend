import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Wifi, Monitor, Coffee, Check, Info } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface Apartment {
  id: string;
  name: string;
  location: string;
  rate_per_night: number;
  images: string[];
  is_available: boolean;
}

export default function ShortletDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await axios.get(`/shortlets/${id}`);
        setApartment(data);
      } catch (error) {
        console.error('Failed to fetch apartment', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  const handleRequest = async () => {
    if (!user) return navigate('/login');
    if (!startDate || !endDate) return alert('Please select dates');
    
    try {
        await axios.post('/shortlets/request', {
            apartmentId: id,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString()
        });
        alert('Booking request sent! Wait for admin confirmation.');
        navigate('/orders');
    } catch (e) {
        alert('Request failed.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!apartment) return <div>Apartment not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-12">
        {/* Left: Images & Info */}
        <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-2 h-96 rounded-3xl overflow-hidden">
                <img src={apartment.images[0]} className="w-full h-full object-cover col-span-2 md:col-span-1" />
                <div className="hidden md:grid grid-rows-2 gap-2">
                    <img src={apartment.images[1] || apartment.images[0]} className="w-full h-full object-cover" />
                    <img src={apartment.images[2] || apartment.images[0]} className="w-full h-full object-cover" />
                </div>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{apartment.name}</h1>
                <div className="flex items-center gap-2 text-gray-500 mb-6">
                    <MapPin size={18} /> {apartment.location}
                </div>

                <div className="prose max-w-none text-gray-600 mb-8">
                    <p>Experience comfort and luxury in this fully furnished apartment. Perfect for short stays, business trips, or weekend getaways.</p>
                </div>

                <div className="border-t border-b border-gray-100 py-6">
                    <h3 className="font-bold text-gray-900 mb-4">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600"><Wifi size={16} /> Fast WiFi</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600"><Monitor size={16} /> Smart TV</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600"><Coffee size={16} /> Kitchen</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600"><Check size={16} /> 24/7 Power</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right: Booking Card */}
        <div>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <span className="text-2xl font-bold text-gray-900">{formatCurrency(apartment.rate_per_night)}</span>
                        <span className="text-gray-500"> / night</span>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Check-in</label>
                            <input 
                                type="date" 
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Check-out</label>
                            <input 
                                type="date" 
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-700 mb-6">
                    <Info className="shrink-0" size={18} />
                    <p>This is a booking request. You won't be charged until the admin confirms availability.</p>
                </div>

                <button 
                    onClick={handleRequest}
                    className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold hover:bg-orange-700 transition"
                >
                    Request to Book
                </button>
            </div>
        </div>
    </div>
  );
}
