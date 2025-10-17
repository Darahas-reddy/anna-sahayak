import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Booking = {
  id: string;
  tool_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

export function useMyBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('bookings', { method: 'GET' });
      if (error) throw error;
      return (data?.data || []) as Booking[];
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { tool_id: string; start_date: string; end_date: string }) => {
      const { data, error } = await supabase.functions.invoke('bookings', { method: 'POST', body: payload });
      if (error) throw error;
      return data?.data as Booking;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Booking['status'] }) => {
      const { data, error } = await supabase.functions.invoke('bookings', {
        method: 'PUT',
        url: `?id=${id}`,
        body: { status },
      } as any);
      if (error) throw error;
      return data?.data as Booking;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}



