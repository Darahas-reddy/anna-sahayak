import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyBookings, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useState } from 'react';

export default function MyRentalsPage() {
  const { data: bookings = [] } = useMyBookings();
  const updateStatus = useUpdateBookingStatus();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  const filtered = bookings.filter((b: any) => (filter === 'all' ? true : b.status === filter));

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Rentals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((b: any) => (
            <Card key={b.id}>
              <CardHeader>
                <CardTitle className="text-base">Booking #{b.id.slice(0, 6)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">Tool: {b.tools?.name}</div>
                <div className="text-sm">Dates: {b.start_date} → {b.end_date}</div>
                <div className="text-sm">Total: ₹{b.total_price}</div>
                <div className="text-sm">Status: {b.status}</div>
                <div className="flex gap-2 pt-2">
                  <button className="px-3 py-1 text-xs rounded bg-green-600 text-white" onClick={() => updateStatus.mutate({ id: b.id, status: 'confirmed' })}>Confirm</button>
                  <button className="px-3 py-1 text-xs rounded bg-gray-600 text-white" onClick={() => updateStatus.mutate({ id: b.id, status: 'completed' })}>Complete</button>
                  <button className="px-3 py-1 text-xs rounded bg-red-600 text-white" onClick={() => updateStatus.mutate({ id: b.id, status: 'cancelled' })}>Cancel</button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



