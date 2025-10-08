import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const GovernmentSchemes = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadGovernmentSchemes();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = schemes.filter(
        (scheme) =>
          scheme.scheme_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scheme.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scheme.scheme_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSchemes(filtered);
    } else {
      setFilteredSchemes(schemes);
    }
  }, [searchTerm, schemes]);

  const loadGovernmentSchemes = async () => {
    try {
      const { data, error } = await supabase
        .from('government_schemes')
        .select('*')
        .eq('is_active', true)
        .order('scheme_name');

      if (error) throw error;
      setSchemes(data || []);
      setFilteredSchemes(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading government schemes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSchemeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      subsidy: 'bg-primary',
      loan: 'bg-secondary',
      insurance: 'bg-accent',
      training: 'bg-muted',
      other: 'bg-muted-foreground',
    };
    return colors[type] || 'bg-muted';
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
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Government Schemes</h1>
                  <p className="text-xs text-muted-foreground">Subsidies, loans, and support programs</p>
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
                placeholder="Search schemes by name, type, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading schemes...</p>
            </div>
          ) : filteredSchemes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No schemes found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchemes.map((scheme) => (
                <Card
                  key={scheme.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedScheme(scheme)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{scheme.scheme_name}</CardTitle>
                      <Badge className={`${getSchemeTypeColor(scheme.scheme_type)} text-white capitalize`}>
                        {scheme.scheme_type}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {scheme.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {scheme.state && (
                        <div>
                          <span className="text-muted-foreground">Location: </span>
                          <span className="font-medium">
                            {scheme.district ? `${scheme.district}, ` : ''}{scheme.state}
                          </span>
                        </div>
                      )}
                      {scheme.benefits && (
                        <div>
                          <span className="text-muted-foreground">Benefits: </span>
                          <span className="font-medium line-clamp-1">{scheme.benefits}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <Dialog open={!!selectedScheme} onOpenChange={() => setSelectedScheme(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-2">
                {selectedScheme?.scheme_name}
                <Badge className={`${getSchemeTypeColor(selectedScheme?.scheme_type)} text-white capitalize`}>
                  {selectedScheme?.scheme_type}
                </Badge>
              </DialogTitle>
              <DialogDescription>{selectedScheme?.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedScheme?.eligibility && (
                <div>
                  <h4 className="font-semibold mb-2">Eligibility</h4>
                  <p className="text-sm text-muted-foreground">{selectedScheme.eligibility}</p>
                </div>
              )}
              {selectedScheme?.benefits && (
                <div>
                  <h4 className="font-semibold mb-2">Benefits</h4>
                  <p className="text-sm text-muted-foreground">{selectedScheme.benefits}</p>
                </div>
              )}
              {selectedScheme?.application_process && (
                <div>
                  <h4 className="font-semibold mb-2">How to Apply</h4>
                  <p className="text-sm text-muted-foreground">{selectedScheme.application_process}</p>
                </div>
              )}
              {selectedScheme?.contact_info && (
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <p className="text-sm text-muted-foreground">{selectedScheme.contact_info}</p>
                </div>
              )}
              {(selectedScheme?.state || selectedScheme?.district) && (
                <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedScheme.district ? `${selectedScheme.district}, ` : ''}
                    {selectedScheme.state || 'All India'}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
};

export default GovernmentSchemes;
