import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Shield, FileText, Phone, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuthGuard from '@/components/AuthGuard';

const LoansInsurance = () => {
  const navigate = useNavigate();

  const loanSchemes = [
    {
      name: 'Kisan Credit Card (KCC)',
      bank: 'All Nationalized Banks',
      description: 'Short-term credit for agriculture and allied activities. Interest rate of 4% with prompt repayment.',
      amount: 'Up to ₹3 lakh',
      interest: '4% (with prompt repayment)',
      eligibility: 'Farmers owning/cultivating land',
      documents: 'Land records, Aadhaar, PAN',
      contactNumber: '1800-180-1551',
      website: 'https://pmkisan.gov.in'
    },
    {
      name: 'Agriculture Term Loan',
      bank: 'NABARD',
      description: 'Long-term loans for purchasing tractors, farm equipment, land development, and irrigation.',
      amount: 'Up to ₹25 lakh',
      interest: '7-9% per annum',
      eligibility: 'Farmers with valid land documents',
      documents: 'Land records, Income proof, Project report',
      contactNumber: '022-2653-9895',
      website: 'https://nabard.org'
    },
    {
      name: 'PM-KISAN Beneficiary Loan',
      bank: 'Various Banks',
      description: 'Special loan scheme for PM-KISAN beneficiaries with simplified documentation.',
      amount: 'Up to ₹1.6 lakh',
      interest: '2% subsidy available',
      eligibility: 'PM-KISAN registered farmers',
      documents: 'PM-KISAN registration, Aadhaar',
      contactNumber: '1800-180-1551',
      website: 'https://pmkisan.gov.in'
    },
    {
      name: 'Dairy Development Loan',
      bank: 'NABARD, Commercial Banks',
      description: 'Loans for purchasing milch animals, dairy equipment, and setting up dairy units.',
      amount: 'Up to ₹10 lakh',
      interest: '6-8% per annum',
      eligibility: 'Farmers and dairy entrepreneurs',
      documents: 'Project report, Land documents',
      contactNumber: '022-2653-9895',
      website: 'https://nabard.org'
    }
  ];

  const insuranceSchemes = [
    {
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      provider: 'Government of India',
      description: 'Comprehensive crop insurance covering all stages from sowing to post-harvest. Covers yield losses due to natural calamities, pests, and diseases.',
      coverage: 'Sum insured based on crop value',
      premium: '2% for Kharif, 1.5% for Rabi crops',
      benefits: [
        'Covers all non-preventable natural risks',
        'Post-harvest losses coverage',
        'Localized risks coverage',
        'Quick claim settlement'
      ],
      eligibility: 'All farmers growing notified crops',
      contactNumber: '1800-180-1551',
      website: 'https://pmfby.gov.in'
    },
    {
      name: 'Weather Based Crop Insurance',
      provider: 'Insurance Companies',
      description: 'Insurance based on weather parameters (rainfall, temperature, humidity). No need for crop cutting experiments.',
      coverage: 'Based on deviation from normal weather',
      premium: '3-5% of sum insured',
      benefits: [
        'Quick settlement (no crop loss assessment needed)',
        'Covers adverse weather conditions',
        'Affordable premiums',
        'Easy claim process'
      ],
      eligibility: 'All farmers in notified areas',
      contactNumber: '1800-266-0444',
      website: 'https://agricoop.nic.in'
    },
    {
      name: 'Livestock Insurance',
      provider: 'NABARD, LIC',
      description: 'Insurance for cattle, buffaloes, horses, camels, and other livestock against death due to disease, accident, or natural calamity.',
      coverage: 'Market value of animal',
      premium: '3-5% of animal value',
      benefits: [
        'Covers accidental death',
        'Disease coverage',
        'Surgery expenses',
        'Quick claim settlement'
      ],
      eligibility: 'Livestock owners',
      contactNumber: '022-2653-4000',
      website: 'https://nabard.org'
    },
    {
      name: 'Pradhan Mantri Jeevan Jyoti Bima Yojana',
      provider: 'Government of India',
      description: 'Life insurance scheme for farmers providing coverage in case of death due to any reason.',
      coverage: '₹2 lakh death benefit',
      premium: '₹436 per year',
      benefits: [
        'Low premium',
        'Death coverage',
        'Easy enrollment',
        'Auto-renewal'
      ],
      eligibility: 'Age 18-50 years, Aadhaar-linked bank account',
      contactNumber: '1800-180-1111',
      website: 'https://pmjjby.gov.in'
    }
  ];

  const applicationSteps = [
    {
      step: '1',
      title: 'Visit Nearest Branch/CSC',
      description: 'Go to your nearest bank branch or Common Service Centre with required documents.'
    },
    {
      step: '2',
      title: 'Fill Application Form',
      description: 'Complete the loan/insurance application form with accurate details.'
    },
    {
      step: '3',
      title: 'Submit Documents',
      description: 'Provide all required documents including land records, Aadhaar, and PAN.'
    },
    {
      step: '4',
      title: 'Verification',
      description: 'Bank/insurance company will verify your documents and eligibility.'
    },
    {
      step: '5',
      title: 'Approval & Disbursal',
      description: 'Upon approval, loan amount will be disbursed or policy will be issued.'
    }
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Agricultural Loans & Insurance</h1>
                <p className="text-xs text-muted-foreground">Financial support and risk protection for farmers</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Tabs defaultValue="loans" className="mb-8">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="loans">
                <Building2 className="w-4 h-4 mr-2" />
                Loans
              </TabsTrigger>
              <TabsTrigger value="insurance">
                <Shield className="w-4 h-4 mr-2" />
                Insurance
              </TabsTrigger>
              <TabsTrigger value="apply">
                <FileText className="w-4 h-4 mr-2" />
                How to Apply
              </TabsTrigger>
            </TabsList>

            <TabsContent value="loans">
              <div className="grid gap-6">
                {loanSchemes.map((loan, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{loan.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {loan.bank}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={loan.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Visit
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{loan.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Loan Amount</p>
                            <p className="font-medium">{loan.amount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Interest Rate</p>
                            <p className="font-medium text-primary">{loan.interest}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Eligibility</p>
                            <p className="text-sm">{loan.eligibility}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Required Documents</p>
                            <p className="text-sm">{loan.documents}</p>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a href={`tel:${loan.contactNumber}`} className="text-sm text-primary hover:underline">
                              {loan.contactNumber}
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insurance">
              <div className="grid gap-6">
                {insuranceSchemes.map((insurance, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{insurance.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            {insurance.provider}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={insurance.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Visit
                          </a>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{insurance.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Coverage</p>
                            <p className="font-medium">{insurance.coverage}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Premium</p>
                            <p className="font-medium text-primary">{insurance.premium}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Eligibility</p>
                            <p className="text-sm">{insurance.eligibility}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Key Benefits</p>
                            <ul className="text-sm space-y-1">
                              {insurance.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-primary">•</span>
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a href={`tel:${insurance.contactNumber}`} className="text-sm text-primary hover:underline">
                              {insurance.contactNumber}
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="apply">
              <Card>
                <CardHeader>
                  <CardTitle>Application Process</CardTitle>
                  <CardDescription>
                    Follow these steps to apply for agricultural loans or insurance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {applicationSteps.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                          {item.step}
                        </div>
                        <div className="flex-1 pt-1">
                          <h3 className="font-semibold mb-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Common Documents Required
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-primary">•</span>
                        Aadhaar Card
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">•</span>
                        PAN Card
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">•</span>
                        Land Records (7/12, 8A)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">•</span>
                        Bank Account Details
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">•</span>
                        Income Certificate
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">•</span>
                        Passport Size Photos
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm">
                      <strong>Note:</strong> Requirements may vary by scheme and state. Visit the official websites or contact the helpline numbers for detailed information and state-specific schemes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
};

export default LoansInsurance;
