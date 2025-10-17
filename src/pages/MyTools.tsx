import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTools, useCreateTool, useUpdateTool } from '@/hooks/useTools';

export default function MyToolsPage() {
  const { data: tools = [] } = useTools();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const [form, setForm] = useState({ name: '', category: '', daily_rate: 0, location: '' });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input type="number" placeholder="Daily Rate" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: Number(e.target.value) })} />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Button
            onClick={() => createTool.mutate({ name: form.name, category: form.category, daily_rate: Number(form.daily_rate), location: form.location })}
            disabled={createTool.isPending}
          >
            {createTool.isPending ? 'Saving...' : 'Create Tool'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="text-base">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">Category: {t.category}</div>
              <div className="text-sm">Rate: ₹{(t as any).daily_rate}/day</div>
              <div className="text-sm">Location: {(t as any).location}</div>
              <Button variant="outline" onClick={() => updateTool.mutate({ id: t.id, available: !(t as any).available })}>Toggle Availability</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}



