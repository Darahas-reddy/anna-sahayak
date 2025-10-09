import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, TrendingUp, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

const YieldPrediction = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [formData, setFormData] = useState({
    cropName: '',
    fieldSize: '',
    soilType: '',
    lastYield: '',
    plantingDate: '',
    location: ''
  });

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('predict-yield', {
        body: formData
      });

      if (error) throw error;

      setPrediction(data);
      toast({
        title: 'Prediction Generated',
        description: 'AI has analyzed your data and created a yield forecast',
      });
    } catch (error: any) {
      console.error('Prediction error:', error);
      toast({
        title: 'Prediction Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Yield Prediction</h1>
              <p className="text-sm text-muted-foreground">AI-powered harvest forecasting</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Enter Crop Details
                </CardTitle>
                <CardDescription>Provide information for accurate prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePredict} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Crop Name</Label>
                    <Input
                      required
                      value={formData.cropName}
                      onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                      placeholder="e.g., Wheat, Rice, Cotton"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Field Size (acres)</Label>
                    <Input
                      required
                      type="number"
                      value={formData.fieldSize}
                      onChange={(e) => setFormData({ ...formData, fieldSize: e.target.value })}
                      placeholder="e.g., 5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Soil Type</Label>
                    <Select
                      value={formData.soilType}
                      onValueChange={(value) => setFormData({ ...formData, soilType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select soil type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loamy">Loamy</SelectItem>
                        <SelectItem value="clay">Clay</SelectItem>
                        <SelectItem value="sandy">Sandy</SelectItem>
                        <SelectItem value="silt">Silt</SelectItem>
                        <SelectItem value="peaty">Peaty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Yield (quintals)</Label>
                    <Input
                      required
                      type="number"
                      value={formData.lastYield}
                      onChange={(e) => setFormData({ ...formData, lastYield: e.target.value })}
                      placeholder="e.g., 50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Planting Date</Label>
                    <Input
                      required
                      type="date"
                      value={formData.plantingDate}
                      onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Punjab, Maharashtra"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Generate Prediction'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {prediction && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader>
                  <CardTitle>Prediction Results</CardTitle>
                  <CardDescription>AI-generated forecast for your crop</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">Expected Yield</p>
                    <p className="text-4xl font-bold text-primary">
                      {prediction.predicted_yield} quintals
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Confidence Level</span>
                      <span className="font-medium">{prediction.confidence_level}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${prediction.confidence_level}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Key Factors</h4>
                    <div className="space-y-2">
                      {prediction.factors?.map((factor: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 rounded-lg bg-card"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                          <p className="text-sm">{factor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default YieldPrediction;
