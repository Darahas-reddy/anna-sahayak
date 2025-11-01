import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type MarketPriceRow = {
  id: string;
  crop_name: string;
  state: string;
  price_per_quintal: number;
  date: string;
};

const MarketPrices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allPrices, setAllPrices] = useState<MarketPriceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    load();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      load();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [toast]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_prices')
        .select('id,crop_name,state,price_per_quintal,date')
        .order('date', { ascending: false });
      if (error) throw error;
      setAllPrices((data as MarketPriceRow[]) || []);
      setLastUpdated(new Date());
    } catch (e: any) {
      toast({ title: 'Failed to load market prices', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLivePrices = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-prices', {
        body: { crop: selectedCrop, limit: 500 }
      });
      
      if (error) throw error;
      
      if (data?.data && data.data.length > 0) {
        // Insert new prices into database
        const { error: insertError } = await supabase
          .from('market_prices')
          .upsert(data.data, { onConflict: 'crop_name,state,date' });
        
        if (insertError) throw insertError;
        
        toast({ 
          title: 'Prices updated!', 
          description: `Fetched ${data.data.length} latest market prices` 
        });
        
        // Reload data
        await load();
      }
    } catch (e: any) {
      toast({ 
        title: 'Failed to fetch live prices', 
        description: e.message, 
        variant: 'destructive' 
      });
    } finally {
      setRefreshing(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">Real-Time Mandi Prices</h1>
            <p className="text-sm text-muted-foreground">Live market prices from government sources</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button 
            onClick={fetchLivePrices} 
            disabled={refreshing}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Fetching...' : 'Refresh Live Data'}
          </Button>
        </div>
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
