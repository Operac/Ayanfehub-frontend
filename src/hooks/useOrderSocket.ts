import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const STATUS_LABELS: Record<string, string> = {
  PENDING:           'Pending',
  PENDING_PAYMENT:   'Awaiting Payment',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  SOURCING:          'Sourcing Items',
  AT_HUB:            'At Hub',
  OUT_FOR_DELIVERY:  'Out for Delivery',
  DELIVERED:         'Delivered',
  CANCELLED:         'Cancelled',
};

export function useOrderSocket(orderId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:order', orderId);
    });

    socket.on('order:status', (payload: { orderId: string; status: string }) => {
      if (payload.orderId === orderId) {
        setLiveStatus(payload.status);
        setStatusLabel(STATUS_LABELS[payload.status] ?? payload.status);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId]);

  return { liveStatus, statusLabel };
}
