import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, TrendingUp, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo } from 'react';

const MarketPrices = () => {
  const [prices, setPrices] = useState<any[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [liveLoading, setLiveLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadMarketPrices();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = prices.filter(
        (price) =>
          price.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          price.market_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          price.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPrices(filtered);
    } else {
      setFilteredPrices(prices);
    }
  }, [searchTerm, prices]);

  const crops = useMemo(() => {
    const set = new Set<string>();
    filteredPrices.forEach(p => {
      const raw = typeof p.crop_name === 'string' ? p.crop_name : '';
      const val = raw.trim();
      if (val.length > 0) set.add(val);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filteredPrices]);

  const states = useMemo(() => {
    const set = new Set<string>();
    filteredPrices.forEach(p => {
      const raw = typeof p.state === 'string' ? p.state : '';
      const val = raw.trim();
      if (val.length > 0) set.add(val);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filteredPrices]);

  const regionalRows = useMemo(() => {
    const data = filteredPrices
      .filter(p => (selectedCrop ? p.crop_name === selectedCrop : true))
      .filter(p => (selectedState ? p.state === selectedState : true));

    // Keep only the latest entry per market (market_name + district + state)
    const latestByMarket = new Map<string, any>();
    data.forEach(p => {
      const key = `${p.market_name}|${p.district}|${p.state}`;
      const existing = latestByMarket.get(key);
      if (!existing || new Date(p.date).getTime() > new Date(existing.date).getTime()) {
        latestByMarket.set(key, p);
      }
    });
    const rows = Array.from(latestByMarket.values());
    rows.sort((a, b) => a.state.localeCompare(b.state) || a.district.localeCompare(b.district) || a.market_name.localeCompare(b.market_name));
    return rows;
  }, [filteredPrices, selectedCrop, selectedState]);

  const stateSummaryRows = useMemo(() => {
    if (!selectedCrop) return [] as any[];
    const data = filteredPrices.filter(p => p.crop_name === selectedCrop);
    // Keep latest record per state
    const latestByState = new Map<string, any>();
    data.forEach(p => {
      const key = p.state;
      const existing = latestByState.get(key);
      if (!existing || new Date(p.date).getTime() > new Date(existing.date).getTime()) {
        latestByState.set(key, p);
      }
    });
    const rows = Array.from(latestByState.values());
    rows.sort((a, b) => a.state.localeCompare(b.state));
    return rows;
  }, [filteredPrices, selectedCrop]);

  const districtSummaryRows = useMemo(() => {
    if (!selectedCrop || !selectedState) return [] as any[];
    const data = filteredPrices.filter(p => p.crop_name === selectedCrop && p.state === selectedState);
    // Keep latest record per district
    const latestByDistrict = new Map<string, any>();
    data.forEach(p => {
      const key = p.district;
      const existing = latestByDistrict.get(key);
      if (!existing || new Date(p.date).getTime() > new Date(existing.date).getTime()) {
        latestByDistrict.set(key, p);
      }
    });
    const rows = Array.from(latestByDistrict.values());
    rows.sort((a, b) => a.district.localeCompare(b.district));
    return rows;
  }, [filteredPrices, selectedCrop, selectedState]);

  const loadMarketPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setPrices(data || []);
      setFilteredPrices(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading market prices',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLive = async () => {
    setLiveLoading(true);
    try {
      const body: any = {};
      if (selectedCrop) body.crop = selectedCrop;
      if (selectedState) body.state = selectedState;
      const { data, error } = await supabase.functions.invoke('market-prices', { body });
      if (error) throw error;
      if (data?.data) {
        setPrices(data.data);
        setFilteredPrices(data.data);
      }
    } catch (e: any) {
      toast({ title: 'Failed to fetch live prices', description: e.message, variant: 'destructive' });
    } finally {
      setLiveLoading(false);
    }
  };

  const formatDate = (value: any) => {
    try {
      const d = new Date(value);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Market Prices</h1>
                  <p className="text-xs text-muted-foreground">Real-time mandi prices</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by crop, market, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Regional Prices</CardTitle>
              <CardDescription>View latest prices across markets in India</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs text-muted-foreground">Crop</label>
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
                <div>
                  <label className="text-xs text-muted-foreground">State</label>
                  <Select
                    value={selectedState || 'ALL'}
                    onValueChange={(value) => setSelectedState(value === 'ALL' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {states.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setSelectedCrop(''); setSelectedState(''); }}
                    className="w-full"
                  >
                    Clear filters
                  </Button>
                  <Button onClick={fetchLive} disabled={liveLoading} className="w-full">
                    {liveLoading ? 'Loading...' : 'Fetch live'}
                  </Button>
                </div>
              </div>

              {regionalRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No regional price data found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="py-2 pr-4">Crop</th>
                        <th className="py-2 pr-4">State</th>
                        <th className="py-2 pr-4">District</th>
                        <th className="py-2 pr-4">Market</th>
                        <th className="py-2 pr-4">Price/Qtl</th>
                        <th className="py-2 pr-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalRows.map((r) => (
                        <tr key={`${r.id}`} className="border-b last:border-0">
                          <td className="py-2 pr-4">{r.crop_name}</td>
                          <td className="py-2 pr-4">{r.state}</td>
                          <td className="py-2 pr-4">{r.district}</td>
                          <td className="py-2 pr-4">{r.market_name}</td>
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

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">State-wise prices {selectedCrop ? `for ${selectedCrop}` : ''}</CardTitle>
              <CardDescription>
                Latest available price per state {selectedCrop ? '' : '(select a crop to view)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCrop ? (
                <p className="text-sm text-muted-foreground">Select a crop to see state-wise prices.</p>
              ) : stateSummaryRows.length === 0 ? (
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
                      {stateSummaryRows.map((r) => (
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

          {selectedCrop && selectedState && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">District-wise prices for {selectedCrop} in {selectedState}</CardTitle>
                <CardDescription>Latest available price per district</CardDescription>
              </CardHeader>
              <CardContent>
                {districtSummaryRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b">
                          <th className="py-2 pr-4">District</th>
                          <th className="py-2 pr-4">Latest Price/Qtl</th>
                          <th className="py-2 pr-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {districtSummaryRows.map((r) => (
                          <tr key={`district-${r.district}`} className="border-b last:border-0">
                            <td className="py-2 pr-4">{r.district}</td>
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
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading market prices...</p>
            </div>
          ) : filteredPrices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No market prices found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrices.map((price) => (
                <Card key={price.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{price.crop_name}</CardTitle>
                    <CardDescription>
                      {price.variety && `${price.variety} • `}
                      {price.market_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Price per Quintal</span>
                        <span className="text-xl font-bold text-primary">
                          ₹{price.price_per_quintal}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Location</span>
                <span className="font-medium">
                          {price.district}, {price.state}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{formatDate(price.date)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
};

export default MarketPrices;
