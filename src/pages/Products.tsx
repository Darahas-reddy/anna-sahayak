import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('pesticide_recommendations')
      .select('*')
      .order('crop_type');
    setProducts(data || []);
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
              <h1 className="text-xl font-bold">Safe Products</h1>
              <p className="text-xs text-muted-foreground">Government-approved recommendations</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.type} • {product.crop_type}</CardDescription>
                    </div>
                    {product.is_government_approved && (
                      <Shield className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Target:</strong> {product.disease}</p>
                  <p><strong>Dosage:</strong> {product.dosage}</p>
                  <p><strong>Safety Period:</strong> {product.safety_period}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Products;
