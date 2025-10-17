import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingForm } from '@/components/BookingForm';
import { useTools } from '@/hooks/useTools';
import { useCreateBooking } from '@/hooks/useBookings';

export default function ToolDetailsPage() {
  const params = useParams();
  const { data: tools = [] } = useTools();
  const tool = tools.find((t) => t.id === params.id);
  const createBooking = useCreateBooking();

  if (!tool) return <div className="container mx-auto px-4 py-8">Tool not found</div>;
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{tool.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">Category: {tool.category}</div>
          <div className="text-sm">Location: {(tool as any).location}</div>
          <div className="text-sm">Rate: ₹{(tool as any).daily_rate}/day</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book this Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingForm
            dailyRate={Number((tool as any).daily_rate)}
            loading={createBooking.isPending}
            onSubmit={(start, end) => createBooking.mutate({ tool_id: tool.id, start_date: start, end_date: end })}
          />
        </CardContent>
      </Card>
    </div>
  );
}



