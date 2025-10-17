import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, MapPin, Search, Plus } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

// Mock data for demonstration
const mockEquipment = [
  {
    id: 1,
    name: 'John Deere 5E Tractor',
    category: 'Tractor',
    description: 'Powerful 55HP tractor with front loader, perfect for small to medium farms.',
    daily_rate: 2500,
    location: 'Pune, Maharashtra',
    image_url: 'https://placehold.co/600x400?text=Tractor',
    owner_name: 'Rajesh Kumar',
    owner_contact: '+91 9876543210',
    available_from: '2023-06-01',
    available_to: '2023-08-30'
  },
  {
    id: 2,
    name: 'Mahindra Harvester',
    category: 'Harvester',
    description: 'Efficient harvester for wheat and rice crops with minimal grain loss.',
    daily_rate: 3500,
    location: 'Nashik, Maharashtra',
    image_url: 'https://placehold.co/600x400?text=Harvester',
    owner_name: 'Sunil Patil',
    owner_contact: '+91 9876543211',
    available_from: '2023-06-15',
    available_to: '2023-09-15'
  },
  {
    id: 3,
    name: 'Sprayer Equipment',
    category: 'Sprayer',
    description: 'Modern sprayer with 500L tank capacity and 12m boom width.',
    daily_rate: 1200,
    location: 'Nagpur, Maharashtra',
    image_url: 'https://placehold.co/600x400?text=Sprayer',
    owner_name: 'Amit Singh',
    owner_contact: '+91 9876543212',
    available_from: '2023-07-01',
    available_to: '2023-10-31'
  }
];

type Equipment = {
  id: string;
  name: string;
  description: string;
  daily_rate: number;
  location: string;
  owner_id: string;
  owner_name: string;
  owner_phone: string;
  image_url: string;
  available_from: string;
  available_to: string;
  equipment_type: string;
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
  const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
    name: '',
    description: '',
    daily_rate: 0,
    location: '',
    equipment_type: '',
    available_from: '',
    available_to: '',
    image_url: 'https://placehold.co/600x400?text=Equipment+Image',
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all equipment listings
      const { data: allEquipment, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user's own listings
      if (user) {
        const { data: userEquipment, error: userError } = await supabase
          .from('equipment')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
        
        if (userError) throw userError;
        setMyListings(userEquipment || []);
      }
      
      setEquipmentList(allEquipment || []);
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

      // Get user profile for owner details
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const { error } = await supabase.from('equipment').insert({
        name: newEquipment.name,
        description: newEquipment.description,
        daily_rate: newEquipment.daily_rate,
        location: newEquipment.location,
        owner_id: user.id,
        owner_name: profile?.full_name || 'Anonymous',
        owner_phone: profile?.phone || 'Not provided',
        image_url: newEquipment.image_url,
        available_from: newEquipment.available_from,
        available_to: newEquipment.available_to,
        equipment_type: newEquipment.equipment_type,
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
        equipment_type: '',
        available_from: '',
        available_to: '',
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to request a rental');

      // Get user profile for renter details
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const { error } = await supabase.from('rental_requests').insert({
        equipment_id: equipment.id,
        renter_id: user.id,
        renter_name: profile?.full_name || 'Anonymous',
        renter_phone: profile?.phone || 'Not provided',
        owner_id: equipment.owner_id,
        status: 'pending',
        request_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Rental request sent',
        description: 'The owner will contact you soon',
      });
    } catch (error: any) {
      toast({
        title: 'Error requesting rental',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = equipmentType ? item.equipment_type === equipmentType : true;
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
                        <CardDescription>{equipment.equipment_type}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">{equipment.description}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{equipment.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Available: {new Date(equipment.available_from).toLocaleDateString()} - {new Date(equipment.available_to).toLocaleDateString()}</span>
                        </div>
                        <p className="font-medium text-lg">₹{equipment.daily_rate}/day</p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="text-sm">
                          <p className="font-medium">{equipment.owner_name}</p>
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            <span>{equipment.owner_phone}</span>
                          </div>
                        </div>
                        <Button onClick={() => handleRequestRental(equipment)}>
                          Request Rental
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
                        <CardDescription>{equipment.equipment_type}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">{equipment.description}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{equipment.location}</span>
                        </div>
                        <p className="font-medium text-lg">₹{equipment.daily_rate}/day</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">
                          Edit Listing
                        </Button>
                      </CardFooter>
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
                  value={newEquipment.equipment_type} 
                  onValueChange={(value) => setNewEquipment({...newEquipment, equipment_type: value})}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="available-from">Available From</Label>
                  <Input
                    id="available-from"
                    type="date"
                    value={newEquipment.available_from}
                    onChange={(e) => setNewEquipment({...newEquipment, available_from: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="available-to">Available To</Label>
                  <Input
                    id="available-to"
                    type="date"
                    value={newEquipment.available_to}
                    onChange={(e) => setNewEquipment({...newEquipment, available_to: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image URL</Label>
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