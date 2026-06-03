import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, CheckCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ReviewSection from '../components/ReviewSection';

interface Artisan {
  id: string;
  name: string;
  category: string;
  portfolioImages: string[];
  startingPrice: number;
  isAvailable: boolean;
}

interface Service {
  id: string;
  serviceName: string;
  priceNgn: number;
}

export default function ArtisanProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingTab, setBookingTab] = useState<'services' | 'custom'>('services');
  const [showReviews, setShowReviews] = useState(false);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [address, setAddress] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const [requestDesc, setRequestDesc] = useState('');
  const [requestBudget, setRequestBudget] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`/artisans/${id}`);
        setArtisan(data.artisan);
        setServices(data.services);
      } catch {
        showToast('Failed to load artisan profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBook = async () => {
    if (!user) return navigate('/login');
    if (!selectedService) return showToast('Please select a service', 'warning');
    if (!bookingDate) return showToast('Please select a date', 'warning');
    if (!address) return showToast('Please enter a service address', 'warning');

    setIsBooking(true);
    try {
      await axios.post('/artisans/book', {
        artisanId: id,
        serviceName: selectedService.serviceName,
        price: selectedService.priceNgn,
        date: new Date(bookingDate).toISOString(),
        address,
      });
      showToast('Booking confirmed! Artisan has been notified.', 'success');
      navigate('/orders');
    } catch {
      showToast('Booking failed. Please try again.', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCustomRequest = async () => {
    if (!user) return navigate('/login');
    if (!requestDesc) return showToast('Please describe what you need', 'warning');
    if (!bookingDate) return showToast('Please select a preferred date', 'warning');
    if (!address) return showToast('Please enter a location', 'warning');

    setIsRequesting(true);
    try {
      await axios.post('/artisans/request', {
        artisanId: id,
        category: artisan?.category,
        description: requestDesc,
        location: address,
        date: new Date(bookingDate).toISOString(),
        budget: requestBudget,
      });
      showToast('Request submitted! Waiting for quotation.', 'success');
      navigate('/orders');
    } catch {
      showToast('Request failed. Please try again.', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="h-64 bg-gray-100 rounded-3xl animate-pulse mb-8" />
    </div>
  );

  if (!artisan) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-3">
      <p className="text-xl font-bold text-gray-900 mb-2">Artisan not found</p>
      <a href="/artisans" className="text-primary hover:underline font-semibold text-sm">Browse artisans →</a>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-5 gap-12">
      {/* Left: Profile Info */}
      <div className="lg:col-span-3 space-y-8">
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
          <div className="h-64 bg-gray-200">
            {artisan.portfolioImages[0] && (
              <img src={artisan.portfolioImages[0]} className="w-full h-full object-cover" alt={artisan.name} />
            )}
          </div>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900">{artisan.name}</h1>
            <p className="text-orange-600 font-medium mb-4">{artisan.category}</p>
            <div className="flex gap-6 text-sm text-gray-500 flex-wrap">
              <div className="flex items-center gap-2">
                <MapPin size={16} /> Lagos, Nigeria
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className={artisan.isAvailable ? 'text-green-500' : 'text-gray-300'} />
                {artisan.isAvailable ? 'Available' : 'Unavailable'}
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Grid */}
        {artisan.portfolioImages.length > 1 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Portfolio</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {artisan.portfolioImages.map((img, idx) => (
                <img key={idx} src={img} className="rounded-xl h-40 w-full object-cover" alt="" />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Toggle */}
        <div>
          <button
            onClick={() => setShowReviews(v => !v)}
            className="text-sm font-bold text-primary hover:underline mb-4 block"
          >
            {showReviews ? 'Hide Reviews' : 'Show Reviews'}
          </button>
          {showReviews && <ReviewSection artisanId={id} />}
        </div>
      </div>

      {/* Right: Booking Form */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
          <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setBookingTab('services')}
              className={cn('flex-1 py-2.5 text-sm font-medium rounded-lg transition-all', bookingTab === 'services' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900')}
            >
              Fixed Services
            </button>
            <button
              onClick={() => setBookingTab('custom')}
              className={cn('flex-1 py-2.5 text-sm font-medium rounded-lg transition-all', bookingTab === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900')}
            >
              Custom Request
            </button>
          </div>

          {bookingTab === 'services' ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Select Service</label>
              {services.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No services listed yet.</p>
              ) : (
                <div className="space-y-2">
                  {services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={cn(
                        'p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all',
                        selectedService?.id === service.id
                          ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                          : 'border-gray-200 hover:border-orange-200'
                      )}
                    >
                      <span className="font-medium text-gray-900">{service.serviceName}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(service.priceNgn)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
                  onChange={e => setBookingDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Service Address</label>
                <input
                  type="text"
                  placeholder="Enter full address"
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <button
                onClick={handleBook}
                disabled={isBooking}
                className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold hover:bg-orange-700 transition mt-4 disabled:opacity-50"
              >
                {isBooking ? 'Booking…' : `Book & Pay${selectedService ? ' ' + formatCurrency(selectedService.priceNgn) : ''}`}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-xl">
                Describe your unique request. The artisan will review and send a custom quote.
              </div>

              <textarea
                placeholder="Describe what you need done..."
                className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm min-h-[120px]"
                onChange={e => setRequestDesc(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Preferred Date</label>
                  <input
                    type="datetime-local"
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
                    onChange={e => setBookingDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Budget (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g 50000"
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
                    onChange={e => setRequestBudget(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="Enter address"
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <button
                onClick={handleCustomRequest}
                disabled={isRequesting}
                className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition mt-4 disabled:opacity-50"
              >
                {isRequesting ? 'Submitting…' : 'Request Quote'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
