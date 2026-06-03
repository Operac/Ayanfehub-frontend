import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Users, Clock, ChevronRight, ShoppingBag, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useCountdown } from '../hooks/useCountdown';

export interface GroupBuyEvent {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  totalSlots: number;
  slotsRemaining: number;
  slotsFilled: number;
  pricePerSlotNgn: number;
  maxSlotsPerCustomer: number;
  paymentDeadlineHours: number;
  reservationDeadline: string;
  status: 'OPEN' | 'FULL' | 'PAYING' | 'CONFIRMED' | 'CANCELLED' | 'FULFILLED';
  mySlot: {
    id: string;
    slotsCount: number;
    status: string;
    paymentDeadline: string | null;
    paidAt: string | null;
    totalAmountNgn: number;
  } | null;
  myWaitlistEntry: { id: string; slotsWanted: number; status: string } | null;
}

async function fetchEvents(): Promise<GroupBuyEvent[]> {
  const { data } = await axios.get('/group-buy');
  return data;
}

const STATUS_CONFIG = {
  OPEN:      { label: 'Open',        color: 'text-primary bg-primary/10' },
  FULL:      { label: 'Full',        color: 'text-muted bg-muted/10'     },
  PAYING:    { label: 'Pay Now',     color: 'text-accent bg-accent/15'   },
  CONFIRMED: { label: 'Confirmed',   color: 'text-primary bg-primary/10'       },
  CANCELLED: { label: 'Cancelled',   color: 'text-red-700 bg-red-50'         },
  FULFILLED: { label: 'Fulfilled',   color: 'text-primary-dark bg-surface'      },
};

const stagger: { container: Variants; item: Variants } = {
  container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } },
  item:      { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } },
};

function CountdownChip({ deadline }: { deadline: string }) {
  const { label, urgent } = useCountdown(deadline);
  return (
    <span className={cn('flex items-center gap-1 text-xs font-bold', urgent ? 'text-red-600' : 'text-muted')}>
      <Clock size={11} /> {label}
    </span>
  );
}

function SlotBar({ filled, total }: { filled: number; total: number }) {
  const pct = Math.min(100, (filled / total) * 100);
  const almostFull = pct >= 80;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted mb-1.5">
        <span className={cn('font-bold', almostFull ? 'text-accent' : 'text-ink')}>
          {filled}/{total} slots filled
        </span>
        <span>{total - filled} left</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', almostFull ? 'bg-accent' : 'bg-primary')}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function EventCard({ event }: { event: GroupBuyEvent }) {
  const cfg = STATUS_CONFIG[event.status] ?? { label: event.status, color: 'text-gray-600 bg-gray-50' };
  const hasMySlot = !!event.mySlot;
  const isPayingAndUnpaid = event.status === 'PAYING' && event.mySlot?.status === 'RESERVED';

  let cta = 'View Details';
  if (event.status === 'OPEN' && !hasMySlot)                   cta = 'Join Group Buy';
  else if (isPayingAndUnpaid)                                   cta = 'Pay Now ⚡';
  else if (['FULL', 'PAYING'].includes(event.status) && !hasMySlot && !event.myWaitlistEntry) cta = 'Join Waitlist';
  else if (event.myWaitlistEntry)                               cta = 'On Waitlist';

  return (
    <motion.div variants={stagger.item}>
      <Link to={`/group-buy/${event.id}`} className="block group">
        <div className={cn(
          'bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5',
          isPayingAndUnpaid ? 'border-accent/30 ring-1 ring-accent/40' : 'border-gray-100'
        )}>
          {/* Image */}
          <div className="relative h-44 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={48} className="text-primary/30" />
              </div>
            )}
            {/* Status badge */}
            <span className={cn('absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm', cfg.color)}>
              {cfg.label}
            </span>
            {/* My slot badge */}
            {hasMySlot && (
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-sm">
                ✓ Reserved
              </span>
            )}
          </div>

          <div className="p-5">
            <h3 className="font-black text-ink text-lg leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-sm text-muted line-clamp-2 mb-3">{event.description}</p>
            )}

            {/* Price */}
            <p className="text-2xl font-black text-primary mb-1">
              {formatCurrency(event.pricePerSlotNgn)}
              <span className="text-sm font-semibold text-muted ml-1">/ slot</span>
            </p>

            {/* Slot bar */}
            <SlotBar filled={event.slotsFilled} total={event.totalSlots} />

            {/* Footer row */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-muted font-medium">
                  <Users size={11} /> Max {event.maxSlotsPerCustomer}/person
                </span>
                {event.status === 'OPEN' && (
                  <CountdownChip deadline={event.reservationDeadline} />
                )}
                {isPayingAndUnpaid && event.mySlot?.paymentDeadline && (
                  <CountdownChip deadline={event.mySlot.paymentDeadline} />
                )}
              </div>
              <span className={cn(
                'flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors',
                isPayingAndUnpaid
                  ? 'bg-accent text-primary-dark hover:bg-accent/90'
                  : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
              )}>
                {cta} <ChevronRight size={12} />
              </span>
            </div>

            {/* Urgent payment warning */}
            {isPayingAndUnpaid && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted bg-accent/10 rounded-xl px-3 py-2">
                <AlertCircle size={13} className="shrink-0" />
                Pay before your slot is released
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function GroupBuyList() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['group-buy'],
    queryFn: fetchEvents,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
          <Users size={14} /> Group Buy
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-ink tracking-tight mb-3">
          Buy Together,<br className="hidden md:block" /> Save Together
        </h1>
        <p className="text-muted max-w-xl">
          Pool your orders with other customers to unlock bulk pricing on premium goods.
          Reserve your slot — pay only when the group is complete.
        </p>
      </motion.div>

      {isLoading && <GridSkeleton count={6} />}

      {!isLoading && events.length === 0 && (
        <EmptyState
          icon={<Users size={40} className="text-primary/40" />}
          title="No active group buys"
          description="Check back soon — new group buys are announced regularly."
        />
      )}

      {!isLoading && events.length > 0 && (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </motion.div>
      )}
    </div>
  );
}
