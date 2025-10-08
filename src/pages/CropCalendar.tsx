import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Bell, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CropCalendar = () => {
  const [crops, setCrops] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCrop, setIsAddingCrop] = useState(false);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [formData, setFormData] = useState({
    crop_name: '',
    variety: '',
    planting_date: '',
    expected_harvest_date: '',
    field_location: '',
    field_size: '',
    notes: '',
  });
  const [reminderData, setReminderData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_type: 'irrigation',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCrops();
    loadReminders();
  }, []);

  const loadCrops = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('crop_calendar')
        .select('*')
        .eq('user_id', user.id)
        .order('planting_date', { ascending: false });

      if (error) throw error;
      setCrops(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading crops',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('crop_reminders')
        .select('*, crop_calendar(*)')
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading reminders',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCrop(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('crop_calendar').insert({
        ...formData,
        user_id: user.id,
        field_size: formData.field_size ? parseFloat(formData.field_size) : null,
      });

      if (error) throw error;

      toast({
        title: 'Crop added successfully',
        description: 'Your crop has been added to the calendar',
      });

      setFormData({
        crop_name: '',
        variety: '',
        planting_date: '',
        expected_harvest_date: '',
        field_location: '',
        field_size: '',
        notes: '',
      });

      loadCrops();
    } catch (error: any) {
      toast({
        title: 'Error adding crop',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingCrop(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop) return;

    setIsAddingReminder(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('crop_reminders').insert({
        ...reminderData,
        crop_calendar_id: selectedCrop.id,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Reminder added successfully',
        description: 'You will be notified on the specified date',
      });

      setReminderData({
        title: '',
        description: '',
        reminder_date: '',
        reminder_type: 'irrigation',
      });
      setSelectedCrop(null);
      loadReminders();
    } catch (error: any) {
      toast({
        title: 'Error adding reminder',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingReminder(false);
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    try {
      const { error } = await supabase.from('crop_calendar').delete().eq('id', cropId);

      if (error) throw error;

      toast({
        title: 'Crop deleted',
        description: 'Crop has been removed from your calendar',
      });

      loadCrops();
    } catch (error: any) {
      toast({
        title: 'Error deleting crop',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCompleteReminder = async (reminderId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('crop_reminders')
        .update({ is_completed: !isCompleted })
        .eq('id', reminderId);

      if (error) throw error;

      loadReminders();
    } catch (error: any) {
      toast({
        title: 'Error updating reminder',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Crop Calendar</h1>
                    <p className="text-xs text-muted-foreground">Manage your planting schedule</p>
                  </div>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Crop
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Crop</DialogTitle>
                    <DialogDescription>Track your crop planting and harvest dates</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCrop} className="space-y-4">
                    <div>
                      <Label htmlFor="crop_name">Crop Name*</Label>
                      <Input
                        id="crop_name"
                        value={formData.crop_name}
                        onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="variety">Variety</Label>
                      <Input
                        id="variety"
                        value={formData.variety}
                        onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planting_date">Planting Date*</Label>
                        <Input
                          id="planting_date"
                          type="date"
                          value={formData.planting_date}
                          onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="expected_harvest_date">Expected Harvest</Label>
                        <Input
                          id="expected_harvest_date"
                          type="date"
                          value={formData.expected_harvest_date}
                          onChange={(e) =>
                            setFormData({ ...formData, expected_harvest_date: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="field_location">Field Location</Label>
                        <Input
                          id="field_location"
                          value={formData.field_location}
                          onChange={(e) => setFormData({ ...formData, field_location: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="field_size">Field Size (acres)</Label>
                        <Input
                          id="field_size"
                          type="number"
                          step="0.01"
                          value={formData.field_size}
                          onChange={(e) => setFormData({ ...formData, field_size: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                    <Button type="submit" disabled={isAddingCrop} className="w-full">
                      {isAddingCrop ? 'Adding...' : 'Add Crop'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Crops List */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">Your Crops</h2>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading crops...</p>
                </div>
              ) : crops.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No crops added yet. Add your first crop to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {crops.map((crop) => (
                    <Card key={crop.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{crop.crop_name}</CardTitle>
                            {crop.variety && (
                              <CardDescription>Variety: {crop.variety}</CardDescription>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedCrop(crop)}
                                >
                                  <Bell className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Reminder for {crop.crop_name}</DialogTitle>
                                  <DialogDescription>Set up irrigation, fertilization, or other reminders</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddReminder} className="space-y-4">
                                  <div>
                                    <Label htmlFor="reminder_type">Reminder Type</Label>
                                    <Select
                                      value={reminderData.reminder_type}
                                      onValueChange={(value) =>
                                        setReminderData({ ...reminderData, reminder_type: value })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="irrigation">Irrigation</SelectItem>
                                        <SelectItem value="fertilization">Fertilization</SelectItem>
                                        <SelectItem value="spraying">Spraying</SelectItem>
                                        <SelectItem value="harvesting">Harvesting</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="title">Title*</Label>
                                    <Input
                                      id="title"
                                      value={reminderData.title}
                                      onChange={(e) =>
                                        setReminderData({ ...reminderData, title: e.target.value })
                                      }
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                      id="description"
                                      value={reminderData.description}
                                      onChange={(e) =>
                                        setReminderData({ ...reminderData, description: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="reminder_date">Reminder Date*</Label>
                                    <Input
                                      id="reminder_date"
                                      type="date"
                                      value={reminderData.reminder_date}
                                      onChange={(e) =>
                                        setReminderData({ ...reminderData, reminder_date: e.target.value })
                                      }
                                      required
                                    />
                                  </div>
                                  <Button type="submit" disabled={isAddingReminder} className="w-full">
                                    {isAddingReminder ? 'Adding...' : 'Add Reminder'}
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCrop(crop.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Planted:</span>
                            <span className="font-medium">
                              {new Date(crop.planting_date).toLocaleDateString()}
                            </span>
                          </div>
                          {crop.expected_harvest_date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expected Harvest:</span>
                              <span className="font-medium">
                                {new Date(crop.expected_harvest_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {crop.field_location && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-medium">{crop.field_location}</span>
                            </div>
                          )}
                          {crop.field_size && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Size:</span>
                              <span className="font-medium">{crop.field_size} acres</span>
                            </div>
                          )}
                          {crop.notes && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-muted-foreground text-xs">Notes:</p>
                              <p className="mt-1">{crop.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Upcoming Reminders</h2>
              {reminders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground text-sm">No reminders set</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {reminders.map((reminder) => (
                    <Card
                      key={reminder.id}
                      className={reminder.is_completed ? 'opacity-60' : ''}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-sm">{reminder.title}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {reminder.crop_calendar?.crop_name}
                            </CardDescription>
                          </div>
                          <Badge className="capitalize text-xs">{reminder.reminder_type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {reminder.description && (
                          <p className="text-xs text-muted-foreground mb-2">{reminder.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {new Date(reminder.reminder_date).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCompleteReminder(reminder.id, reminder.is_completed)
                            }
                            className="h-6 text-xs"
                          >
                            {reminder.is_completed ? 'Undo' : 'Complete'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default CropCalendar;
