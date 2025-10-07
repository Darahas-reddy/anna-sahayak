import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sprout, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [language, setLanguage] = useState('en');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!phone) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your phone number',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!phone || !otp) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter OTP',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      // Update profile with language preference
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          user_id: user.id,
          full_name: fullName || 'Farmer',
          language,
          phone,
        });
      }

      toast({
        title: 'Welcome!',
        description: 'Successfully signed in.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            language,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Welcome to SmartAgriTech!',
        description: 'Your account has been created successfully.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">SmartAgriTech</CardTitle>
          <CardDescription>Your AI-Powered Agricultural Assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <div className="space-y-4">
                <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="phone">Phone</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="phone" className="space-y-4 mt-4">
                    {!otpSent ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                        <Button 
                          type="button" 
                          className="w-full" 
                          onClick={handleSendOTP}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending OTP...
                            </>
                          ) : (
                            'Send OTP'
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="otp">Enter OTP</Label>
                          <Input
                            id="otp"
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            required
                          />
                        </div>
                        <Button 
                          type="button" 
                          className="w-full" 
                          onClick={handleVerifyOTP}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify OTP'
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="w-full" 
                          onClick={() => setOtpSent(false)}
                        >
                          Change Number
                        </Button>
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="email" className="mt-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="farmer@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="Your Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                      <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                      <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                      <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                      <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                      <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                      <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                      <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                      <SelectItem value="pa">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="phone">Phone</TabsTrigger>
                  </TabsList>

                  <TabsContent value="email" className="mt-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-signup">Email</Label>
                        <Input
                          id="email-signup"
                          type="email"
                          placeholder="farmer@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signup">Password</Label>
                        <Input
                          id="password-signup"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="phone" className="space-y-4 mt-4">
                    {!otpSent ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="phone-signup">Phone Number</Label>
                          <Input
                            id="phone-signup"
                            type="tel"
                            placeholder="+91 9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="button" className="w-full" onClick={handleSendOTP} disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending OTP...
                            </>
                          ) : (
                            'Send OTP'
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="otp-signup">Enter OTP</Label>
                          <Input
                            id="otp-signup"
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            required
                          />
                        </div>
                        <Button type="button" className="w-full" onClick={handleVerifyOTP} disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify & Create Account'
                          )}
                        </Button>
                        <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpSent(false)}>
                          Change Number
                        </Button>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>Empowering farmers with AI-driven insights</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
