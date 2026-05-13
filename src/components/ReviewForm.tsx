import { useState } from 'react';
import axios from 'axios';
import { Star, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

interface ReviewFormProps {
  vendorId?: string;
  artisanId?: string;
  orderId?: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({
  vendorId,
  artisanId,
  orderId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast('Please select a rating', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/reviews', {
        vendorId: vendorId || null,
        artisanId: artisanId || null,
        orderId: orderId || null,
        rating,
        comment: comment.trim() || null,
      });

      showToast('Review submitted! Thank you.', 'success');
      setRating(0);
      setComment('');
      onReviewSubmitted?.();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white border border-gray-100 rounded-2xl p-6"
    >
      <h3 className="font-bold text-ink mb-4">Share Your Experience</h3>

      {/* Star Rating */}
      <div className="mb-5">
        <p className="text-sm text-muted mb-2">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-colors"
            >
              <Star
                size={24}
                className={
                  star <= (hoverRating || rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm text-muted mb-1.5">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share your thoughts about this vendor…"
          maxLength={500}
          rows={3}
          className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
        />
        <p className="text-xs text-muted mt-1">{comment.length}/500</p>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={submitting || rating === 0}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Send size={16} />
            Submit Review
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
