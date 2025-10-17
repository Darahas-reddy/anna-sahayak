import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Tool = {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  description?: string | null;
  image_url?: string | null;
  daily_rate: number;
  available: boolean;
  location?: string | null;
};

export function useTools(filters?: { available?: boolean; category?: string; location?: string }) {
  const params = new URLSearchParams();
  if (filters?.available !== undefined) params.set('available', String(filters.available));
  if (filters?.category) params.set('category', filters.category);
  if (filters?.location) params.set('location', filters.location);

  return useQuery({
    queryKey: ['tools', filters],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('tools', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        url: params.toString() ? `?${params.toString()}` : undefined,
      } as any);
      if (error) throw error;
      return (data?.data || []) as Tool[];
    },
  });
}

export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Tool, 'id' | 'owner_id' | 'available'> & { available?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('tools', {
        method: 'POST',
        body: payload,
      });
      if (error) throw error;
      return data?.data as Tool;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tools'] }),
  });
}

export function useUpdateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<Tool>) => {
      const { data, error } = await supabase.functions.invoke('tools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        url: `?id=${id}`,
        body: payload,
      } as any);
      if (error) throw error;
      return data?.data as Tool;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tools'] }),
  });
}



