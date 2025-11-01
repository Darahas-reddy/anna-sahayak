import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, MessageCircle, CloudRain, Leaf, LogOut, TrendingUp, FileText, IndianRupee, Calendar, User, BarChart3, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AuthGuard from '@/components/AuthGuard';
import { ThemeToggle } from '@/components/ThemeToggle';

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
    loadRecentDetections();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(data);
    }
  };

  const loadRecentDetections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('disease_detections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentDetections(data || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Signed out successfully',
      description: 'Come back soon!',
    });
    navigate('/');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
            <div>
              <h1 className="text-xl font-bold">Kisaan Mithraa</h1>
              <p className="text-xs text-muted-foreground">Welcome, {profile?.full_name || 'Farmer'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-primary/10 to-primary/5"
              onClick={() => navigate('/disease-detection')}
            >
              <CardHeader>
                <Camera className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Disease Detection</CardTitle>
                <CardDescription>Upload crop photos for instant analysis</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-secondary/10 to-secondary/5"
              onClick={() => navigate('/chatbot')}
            >
              <CardHeader>
                <MessageCircle className="w-8 h-8 text-secondary mb-2" />
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <CardDescription>Chat with voice support in your language</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-accent/10 to-accent/5"
              onClick={() => navigate('/weather')}
            >
              <CardHeader>
                <CloudRain className="w-8 h-8 text-accent mb-2" />
                <CardTitle className="text-lg">Weather Alerts</CardTitle>
                <CardDescription>Real-time weather updates for your area</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-primary/10 to-accent/5"
              onClick={() => navigate('/products')}
            >
              <CardHeader>
                <Leaf className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Safe Products</CardTitle>
                <CardDescription>Government-approved recommendations</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-secondary/10 to-primary/5"
              onClick={() => navigate('/market-prices')}
            >
              <CardHeader>
                <IndianRupee className="w-8 h-8 text-secondary mb-2" />
                <CardTitle className="text-lg">Market Prices</CardTitle>
                <CardDescription>Real-time mandi prices for crops</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-accent/10 to-secondary/5"
              onClick={() => navigate('/government-schemes')}
            >
              <CardHeader>
                <FileText className="w-8 h-8 text-accent mb-2" />
                <CardTitle className="text-lg">Govt Schemes</CardTitle>
                <CardDescription>Subsidies, loans, and support</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-primary/10 to-secondary/5"
              onClick={() => navigate('/crop-calendar')}
            >
              <CardHeader>
                <Calendar className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Crop Calendar</CardTitle>
                <CardDescription>Manage planting and harvest schedule</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-accent/10 to-primary/5"
              onClick={() => navigate('/yield-prediction')}
            >
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-accent mb-2" />
                <CardTitle className="text-lg">Yield Prediction</CardTitle>
                <CardDescription>AI-powered harvest forecasting</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-secondary/10 to-accent/5"
              onClick={() => navigate('/farm-analytics')}
            >
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-secondary mb-2" />
                <CardTitle className="text-lg">Farm Analytics</CardTitle>
                <CardDescription>Track expenses, yields, and profits</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-secondary/10 to-primary/5"
              onClick={() => navigate('/equipment-rental')}
            >
              <CardHeader>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-secondary mb-2">
                  <path d="M7 21h10"></path>
                  <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                  <path d="M12 17v4"></path>
                  <path d="M8 8h8"></path>
                  <path d="M8 12h8"></path>
                </svg>
                <CardTitle className="text-lg">Equipment Rental</CardTitle>
                <CardDescription>Rent or share farming equipment</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-primary/10 to-accent/5"
              onClick={() => navigate('/loans-insurance')}
            >
              <CardHeader>
                <FileText className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Loans & Insurance</CardTitle>
                <CardDescription>Financial assistance and protection</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-accent/10 to-secondary/5"
              onClick={() => navigate('/pest-alerts')}
            >
              <CardHeader>
                <AlertTriangle className="w-8 h-8 text-accent mb-2" />
                <CardTitle className="text-lg">Pest Alerts</CardTitle>
                <CardDescription>Community pest warnings</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle>Recent Disease Detections</CardTitle>
              </div>
              <CardDescription>Your latest crop health checks</CardDescription>
            </CardHeader>
            <CardContent>
              {recentDetections.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No detections yet. Start by uploading a crop photo!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentDetections.map((detection) => (
                    <div
                      key={detection.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <img
                        src={detection.image_url}
                        alt="Crop"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{detection.disease_name || 'Analyzing...'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(detection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {detection.confidence && (
                        <span className="text-sm font-medium text-primary">
                          {Math.round(detection.confidence)}% confidence
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
