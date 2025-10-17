import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calculateTotalPrice, isValidDateRange } from '@/lib/utils';

export function BookingForm({ dailyRate, onSubmit, loading }: { dailyRate: number; onSubmit: (start: string, end: string) => void; loading?: boolean }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const total = calculateTotalPrice(dailyRate, start, end);
  const valid = isValidDateRange(start, end);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Start Date</label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">End Date</label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="text-sm">Total: <span className="font-medium">₹{total}</span></div>
      <Button className="w-full" disabled={!valid || loading} onClick={() => onSubmit(start, end)}>
        {loading ? 'Booking...' : 'Confirm Booking'}
      </Button>
    </div>
  );
}



