import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type MarketPriceRow = {
  id: string;
  crop_name: string;
  state: string;
  price_per_quintal: number;
  date: string;
};

const MarketPrices = () => {
  const { toast } = useToast();
  const [allPrices, setAllPrices] = useState<MarketPriceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCrop, setSelectedCrop] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('market_prices')
          .select('id,crop_name,state,price_per_quintal,date')
          .order('date', { ascending: false });
        if (error) throw error;
        setAllPrices((data as MarketPriceRow[]) || []);
      } catch (e: any) {
        toast({ title: 'Failed to load market prices', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const crops = useMemo(() => {
    const normalizedToOriginal = new Map<string, string>();
    for (const row of allPrices) {
      const raw = (row.crop_name || '').trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!normalizedToOriginal.has(key)) normalizedToOriginal.set(key, raw);
    }
    return Array.from(normalizedToOriginal.values()).sort((a, b) => a.localeCompare(b));
  }, [allPrices]);

  const stateLatestForCrop = useMemo(() => {
    if (!selectedCrop) return [] as MarketPriceRow[];
    const normalizedSelected = selectedCrop.trim().toLowerCase();
    const filtered = allPrices.filter(p => (p.crop_name || '').trim().toLowerCase() === normalizedSelected);
    const latestByState = new Map<string, MarketPriceRow>();
    for (const p of filtered) {
      const key = (p.state || '').trim();
      const existing = latestByState.get(key);
      if (!existing || new Date(p.date).getTime() > new Date(existing.date).getTime()) {
        latestByState.set(key, p);
      }
    }
    const rows = Array.from(latestByState.values());
    rows.sort((a, b) => a.state.localeCompare(b.state));
    return rows;
  }, [allPrices, selectedCrop]);

  const formatDate = (value: string) => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Market Prices</h1>
        <p className="text-sm text-muted-foreground">Select a crop to view latest state-wise prices</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Crop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Select
              value={selectedCrop || 'ALL'}
              onValueChange={(value) => setSelectedCrop(value === 'ALL' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All crops" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {crops.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selectedCrop ? `Latest prices by state for ${selectedCrop}` : 'Select a crop to view prices'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !selectedCrop ? (
            <p className="text-sm text-muted-foreground">Choose a crop from the list above.</p>
          ) : stateLatestForCrop.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4">State</th>
                    <th className="py-2 pr-4">Latest Price/Qtl</th>
                    <th className="py-2 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stateLatestForCrop.map(r => (
                    <tr key={`state-${r.state}`} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.state}</td>
                      <td className="py-2 pr-4 font-medium">₹{r.price_per_quintal}</td>
                      <td className="py-2 pr-4">{formatDate(r.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketPrices;
