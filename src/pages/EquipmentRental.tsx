import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, MapPin, Search, Plus, Filter, Tractor, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';

type Equipment = {
  id: string;
  name: string;
  description?: string;
  daily_rate: number;
  location?: string;
  owner_id: string;
  category: string;
  available?: boolean;
  image_url?: string;
  created_at?: string;
};

const EquipmentRental = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [myListings, setMyListings] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    daily_rate: 0,
    location: '',
    category: '',
    image_url: 'https://placehold.co/600x400?text=Equipment+Image',
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all tools (equipment)
      const { data: allTools, error } = await supabase.functions.invoke('tools', {
        method: 'GET'
      });
      
      if (error) throw error;
      
      const tools = allTools?.data || [];
      setEquipmentList(tools);
      
      // Filter user's own listings
      if (user) {
        const userTools = tools.filter((tool: Equipment) => tool.owner_id === user.id);
        setMyListings(userTools);
      }
    } catch (error: any) {
      toast({
        title: 'Error fetching equipment',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to add equipment');

      const { data, error } = await supabase.functions.invoke('tools', {
        method: 'POST',
        body: {
          name: newEquipment.name,
          description: newEquipment.description,
          daily_rate: newEquipment.daily_rate,
          location: newEquipment.location,
          category: newEquipment.category,
          image_url: newEquipment.image_url,
          available: true
        }
      });

      if (error) throw error;

      toast({
        title: 'Equipment added successfully',
        description: 'Your equipment is now listed for rental',
      });

      setShowRentalForm(false);
      setNewEquipment({
        name: '',
        description: '',
        daily_rate: 0,
        location: '',
        category: '',
        image_url: 'https://placehold.co/600x400?text=Equipment+Image',
      });
      
      fetchEquipment();
    } catch (error: any) {
      toast({
        title: 'Error adding equipment',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRequestRental = async (equipment: Equipment) => {
    toast({
      title: 'Contact Owner',
      description: 'Please contact the owner directly to arrange the rental. Booking system coming soon!',
    });
  };

  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = equipmentType ? item.category === equipmentType : true;
    return matchesSearch && matchesType;
  });

  const equipmentTypes = [
    'Tractor',
    'Harvester',
    'Plough',
    'Seeder',
    'Sprayer',
    'Irrigation',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Equipment Rental Marketplace</h1>
              <p className="text-xs text-muted-foreground">Rent or share farming equipment</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search equipment..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={equipmentType} onValueChange={setEquipmentType}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {equipmentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowRentalForm(true)}>
              List Your Equipment
            </Button>
          </div>

          <Tabs defaultValue="browse">
            <TabsList className="mb-6">
              <TabsTrigger value="browse">Browse Equipment</TabsTrigger>
              <TabsTrigger value="my-listings">My Listings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading equipment listings...</p>
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="text-center py-12">
                  <Tractor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No equipment found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEquipment.map((equipment) => (
                    <Card key={equipment.id} className="overflow-hidden">
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={equipment.image_url || "https://placehold.co/600x400?text=No+Image"} 
                          alt={equipment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle>{equipment.name}</CardTitle>
                        <CardDescription>{equipment.category}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">{equipment.description || 'No description available'}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{equipment.location || 'Location not specified'}</span>
                        </div>
                        <p className="font-medium text-lg">₹{equipment.daily_rate}/day</p>
                        <div className="flex items-center gap-2">
                          {equipment.available ? (
                            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-full">Available</span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-red-500/10 text-red-600 rounded-full">Not Available</span>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => handleRequestRental(equipment)} className="w-full">
                          Contact Owner
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my-listings">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading your listings...</p>
                </div>
              ) : myListings.length === 0 ? (
                <div className="text-center py-12">
                  <Tractor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No equipment listed yet</h3>
                  <p className="text-muted-foreground mb-4">Share your equipment with other farmers</p>
                  <Button onClick={() => setShowRentalForm(true)}>
                    List Your Equipment
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myListings.map((equipment) => (
                    <Card key={equipment.id}>
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={equipment.image_url || "https://placehold.co/600x400?text=No+Image"} 
                          alt={equipment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle>{equipment.name}</CardTitle>
                        <CardDescription>{equipment.category}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">{equipment.description || 'No description'}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{equipment.location || 'Not specified'}</span>
                        </div>
                        <p className="font-medium text-lg">₹{equipment.daily_rate}/day</p>
                        <div className="flex items-center gap-2">
                          {equipment.available ? (
                            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-full">Available</span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-red-500/10 text-red-600 rounded-full">Not Available</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <Dialog open={showRentalForm} onOpenChange={setShowRentalForm}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>List Your Equipment</DialogTitle>
              <DialogDescription>
                Fill in the details about your equipment to list it for rental.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Equipment Name</Label>
                <Input
                  id="name"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                  placeholder="e.g., John Deere 5E Tractor"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Equipment Type</Label>
                <Select 
                  value={newEquipment.category} 
                  onValueChange={(value) => setNewEquipment({...newEquipment, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEquipment.description}
                  onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
                  placeholder="Describe your equipment, its condition, and features"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rate">Daily Rate (₹)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={newEquipment.daily_rate?.toString() || ''}
                  onChange={(e) => setNewEquipment({...newEquipment, daily_rate: parseFloat(e.target.value)})}
                  placeholder="e.g., 1500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newEquipment.location}
                  onChange={(e) => setNewEquipment({...newEquipment, location: e.target.value})}
                  placeholder="e.g., Anantapur, Andhra Pradesh"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image URL (Optional)</Label>
                <Input
                  id="image"
                  value={newEquipment.image_url}
                  onChange={(e) => setNewEquipment({...newEquipment, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRentalForm(false)}>Cancel</Button>
              <Button onClick={handleAddEquipment}>List Equipment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default EquipmentRental;