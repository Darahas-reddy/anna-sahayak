import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Camera, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AuthGuard from '@/components/AuthGuard';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResults(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('crop-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('crop-images')
        .getPublicUrl(fileName);

      // Call AI detection edge function
      const { data, error } = await supabase.functions.invoke('detect-disease', {
        body: { imageUrl: publicUrl },
      });

      if (error) throw error;

      // Save detection to database
      const { error: dbError } = await supabase
        .from('disease_detections')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          disease_name: data.disease,
          confidence: data.confidence,
          remedies: data.remedies,
        });

      if (dbError) throw dbError;

      setResults(data);
      toast({
        title: 'Analysis Complete',
        description: 'Your crop has been analyzed successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to analyze image',
      });
    } finally {
      setIsAnalyzing(false);
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
              <h1 className="text-xl font-bold">Disease Detection</h1>
              <p className="text-xs text-muted-foreground">AI-powered crop health analysis</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Crop Photo</CardTitle>
              <CardDescription>
                Take a clear photo of affected plant leaves or stems for accurate diagnosis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                {preview ? (
                  <div className="relative w-full max-w-md">
                    <img
                      src={preview}
                      alt="Crop preview"
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPreview('');
                        setSelectedFile(null);
                        setResults(null);
                      }}
                    >
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <label className="w-full max-w-md h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/5 transition-colors">
                    <Camera className="w-12 h-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload or take photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}

                {selectedFile && !isAnalyzing && !results && (
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={handleAnalyze}
                    className="w-full max-w-md"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Analyze Crop Health
                  </Button>
                )}

                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing your crop...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Detected Issue:</h3>
                  <p className="text-foreground">{results.disease || 'No disease detected'}</p>
                  {results.confidence && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Confidence: {Math.round(results.confidence)}%
                    </p>
                  )}
                </div>

                {results.remedies && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Recommended Actions:</h3>
                    <div className="space-y-2">
                      {Array.isArray(results.remedies) ? (
                        results.remedies.map((remedy: string, index: number) => (
                          <Alert key={index}>
                            <AlertDescription>{remedy}</AlertDescription>
                          </Alert>
                        ))
                      ) : (
                        <Alert>
                          <AlertDescription>{results.remedies}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/products')}
                >
                  View Recommended Products
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </AuthGuard>
  );
};

export default DiseaseDetection;
