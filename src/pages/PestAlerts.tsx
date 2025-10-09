import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, AlertTriangle, MapPin, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuthGuard from '@/components/AuthGuard';

const PestAlerts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    pest_name: '',
    severity: '',
    description: '',
    location: '',
    state: '',
    district: '',
    crop_affected: ''
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const { data } = await supabase
      .from('pest_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setAlerts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('pest_alerts').insert({
      ...formData,
      user_id: user.id
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Alert Posted', description: 'Your pest alert has been shared with the community' });
      setShowDialog(false);
      setFormData({
        pest_name: '',
        severity: '',
        description: '',
        location: '',
        state: '',
        district: '',
        crop_affected: ''
      });
      loadAlerts();
    }
  };

  const handleConfirm = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('pest_alert_confirmations').insert({
      alert_id: alertId,
      user_id: user.id
    });

    if (error) {
      toast({ title: 'Already confirmed', description: 'You have already confirmed this alert', variant: 'destructive' });
    } else {
      toast({ title: 'Confirmed', description: 'Thank you for confirming this pest sighting' });
      loadAlerts();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
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
            <div className="flex-1">
              <h1 className="text-xl font-bold">Pest Alert Network</h1>
              <p className="text-sm text-muted-foreground">Community pest outbreak warnings</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Report Pest
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Report Pest Outbreak</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pest Name</Label>
                    <Input
                      required
                      value={formData.pest_name}
                      onChange={(e) => setFormData({ ...formData, pest_name: e.target.value })}
                      placeholder="e.g., Aphids, Bollworm, Locust"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => setFormData({ ...formData, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Crop Affected</Label>
                    <Input
                      required
                      value={formData.crop_affected}
                      onChange={(e) => setFormData({ ...formData, crop_affected: e.target.value })}
                      placeholder="e.g., Cotton, Wheat"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the pest outbreak and its impact"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>District</Label>
                      <Input
                        required
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Specific Location</Label>
                    <Input
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Village or area name"
                    />
                  </div>

                  <Button type="submit" className="w-full">Post Alert</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <CardTitle className="text-lg">{alert.pest_name}</CardTitle>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {alert.location}, {alert.district}, {alert.state}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfirm(alert.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm ({alert.confirmed_count || 0})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Crop Affected:</p>
                      <p className="text-sm text-muted-foreground">{alert.crop_affected}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Description:</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reported {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default PestAlerts;
