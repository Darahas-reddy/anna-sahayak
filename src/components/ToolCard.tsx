import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Tool = {
  id: string;
  name: string;
  category: string;
  image_url?: string | null;
  daily_rate: number;
  location?: string | null;
  available: boolean;
};

export function ToolCard({ tool, onBook }: { tool: Tool; onBook: (toolId: string) => void }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">{tool.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tool.image_url && (
            <img src={tool.image_url} alt={tool.name} className="w-full h-40 object-cover rounded" />
          )}
          <div className="text-sm text-muted-foreground">{tool.category}</div>
          <div className="text-sm">{tool.location}</div>
          <div className="font-semibold">₹{tool.daily_rate}/day</div>
          <Button className="w-full" disabled={!tool.available} onClick={() => onBook(tool.id)}>
            {tool.available ? 'Book Now' : 'Unavailable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



