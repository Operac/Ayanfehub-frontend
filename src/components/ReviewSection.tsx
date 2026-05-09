import { useEffect, useState } from 'react';
import axios from 'axios';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; fullName: string | null; avatarUrl: string | null };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface Props {
  vendorId?: string;
  artisanId?: string;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default function ReviewSection({ vendorId, artisanId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const params = vendorId ? { vendorId } : { artisanId };
        const endpoint = vendorId ? '/reviews/vendor' : '/reviews/artisan';
        const { data } = await axios.get(endpoint, { params });
        setReviews(data.reviews);
        setStats(data.stats);
      } catch {
        // silent — reviews are non-critical
      } finally {
        setLoading(false);
      }
    };

    if (vendorId || artisanId) fetchReviews();
  }, [vendorId, artisanId]);

  if (loading) return (
    <div className="space-y-3">
      {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div>
      {/* Stats header */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <div className="text-center">
            <p className="text-3xl font-black text-gray-900">{stats.averageRating.toFixed(1)}</p>
            <StarRating rating={stats.averageRating} size={14} />
          </div>
          <div className="text-sm text-gray-500">
            <p className="font-semibold text-gray-800">{stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</p>
            <p>from verified customers</p>
          </div>
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Star size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {review.user.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{review.user.fullName || 'Customer'}</p>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <StarRating rating={review.rating} size={13} />
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
