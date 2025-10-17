import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToolCard } from '@/components/ToolCard';
import { BookingForm } from '@/components/BookingForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTools } from '@/hooks/useTools';
import { useCreateBooking } from '@/hooks/useBookings';

export default function ToolsPage() {
  const [category, setCategory] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const { data: tools = [], isLoading } = useTools({ available: true, category: category || undefined, location: location || undefined });
  const createBooking = useCreateBooking();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Find Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <Select value={category || 'ALL'} onValueChange={(v) => setCategory(v === 'ALL' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="Tractor">Tractor</SelectItem>
                  <SelectItem value="Harvester">Harvester</SelectItem>
                  <SelectItem value="Sprayer">Sprayer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Location</label>
              <Input placeholder="Search by location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tools found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((t) => (
            <ToolCard key={t.id} tool={t as any} onBook={(id) => setActiveToolId(id)} />
          ))}
        </div>
      )}

      <Dialog open={!!activeToolId} onOpenChange={(o) => !o && setActiveToolId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Tool</DialogTitle>
          </DialogHeader>
          {(() => {
            const tool = tools.find((t) => t.id === activeToolId);
            if (!tool) return <p className="text-sm text-muted-foreground">Tool not found</p>;
            return (
              <BookingForm
                dailyRate={Number((tool as any).daily_rate)}
                loading={createBooking.isPending}
                onSubmit={(start, end) =>
                  createBooking.mutate(
                    { tool_id: tool.id, start_date: start, end_date: end },
                    { onSuccess: () => setActiveToolId(null) }
                  )
                }
              />
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}



