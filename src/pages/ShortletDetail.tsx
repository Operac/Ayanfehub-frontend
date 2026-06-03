import { useState, type ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MapPin, Wifi, Monitor, Coffee, Check, Info, Star } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Apartment } from '../types/api';

const AMENITY_ICONS: Record<string, ReactElement> = {
  wifi:    <Wifi size={16} />,
  tv:      <Monitor size={16} />,
  kitchen: <Coffee size={16} />,
  power:   <Check size={16} />,
};

function amenityIcon(label: string) {
  const key = Object.keys(AMENITY_ICONS).find(k => label.toLowerCase().includes(k));
  return key ? AMENITY_ICONS[key] : <Check size={16} />;
}

async function fetchApartment(id: string): Promise<Apartment> {
  const { data } = await axios.get(`/shortlets/${id}`);
  return data;
}

export default function ShortletDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const { data: apartment, isLoading } = useQuery({
    queryKey: ['shortlet', id],
    queryFn: () => fetchApartment(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });

  const nights = startDate && endDate
    ? Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;

  const handleRequest = async () => {
    if (!user) return navigate('/login');
    if (!startDate) return showToast('Please select a check-in date', 'warning');
    if (!endDate) return showToast('Please select a check-out date', 'warning');
    if (nights <= 0) return showToast('Check-out must be after check-in', 'warning');

    setIsRequesting(true);
    try {
      await axios.post('/shortlets/request', {
        apartmentId: id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      showToast("Booking request sent! We'll confirm availability shortly.", 'success');
      navigate('/orders');
    } catch {
      showToast('Request failed. Please try again.', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-12 animate-pulse">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-96 bg-gray-200 rounded-3xl" />
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="h-72 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Apartment not found</h2>
        <button onClick={() => navigate('/shortlets')} className="text-primary hover:underline">
          Back to listings
        </button>
      </div>
    );
  }

  const defaultAmenities = ['Fast WiFi', 'Smart TV', 'Kitchen', '24/7 Power'];
  const amenities = apartment.amenities?.length ? apartment.amenities : defaultAmenities;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-12">
      {/* Left: Images & Info */}
      <div className="lg:col-span-2 space-y-8">
        {/* Image Gallery */}
        <div className="grid grid-cols-2 gap-2 h-96 rounded-3xl overflow-hidden">
          {apartment.images?.[0] ? (
            <img
              src={apartment.images[0]}
              alt={apartment.name}
              className="w-full h-full object-cover col-span-2 md:col-span-1"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 col-span-2 md:col-span-1">
              No Image
            </div>
          )}
          <div className="hidden md:grid grid-rows-2 gap-2">
            {apartment.images?.[1] ? (
              <img src={apartment.images[1]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
            {apartment.images?.[2] ? (
              <img src={apartment.images[2]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{apartment.name}</h1>
            {!apartment.isAvailable && (
              <span className="shrink-0 px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                Unavailable
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-gray-500 mb-2 text-sm flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={16} />{apartment.location}</span>
            <span className="flex items-center gap-1"><Star size={14} className="text-orange-500 fill-orange-500" />4.8 · Superhost</span>
          </div>

          {apartment.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{apartment.description}</p>
          )}

          <div className="border-t border-b border-gray-100 py-6">
            <h3 className="font-bold text-gray-900 mb-4">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {amenities.map(a => (
                <div key={a} className="flex items-center gap-2 text-sm text-gray-600">
                  {amenityIcon(a)}
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Booking Card */}
      <div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(apartment.ratePerNight)}</span>
              <span className="text-gray-500 text-sm"> / night</span>
            </div>
            {nights > 0 && (
              <p className="text-sm text-gray-500">{nights} night{nights !== 1 ? 's' : ''}</p>
            )}
          </div>

          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Check-in</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Check-out</label>
                <input
                  type="date"
                  min={startDate || new Date().toISOString().split('T')[0]}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
                />
              </div>
            </div>

            {nights > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>{formatCurrency(apartment.ratePerNight)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                  <span>{formatCurrency(apartment.ratePerNight * nights)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(apartment.ratePerNight * nights)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-700 mb-6">
            <Info className="shrink-0 mt-0.5" size={16} />
            <p>This is a booking request. You won't be charged until the admin confirms availability.</p>
          </div>

          <button
            onClick={handleRequest}
            disabled={isRequesting || !apartment.isAvailable}
            className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? 'Sending request…' : apartment.isAvailable ? 'Request to Book' : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}
