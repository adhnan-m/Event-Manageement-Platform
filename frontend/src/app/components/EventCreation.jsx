import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { PlusCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { createEvent, createRequest, fetchClubs } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';

export const EventCreation = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userClub, setUserClub] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    category: '',
    maxParticipants: '',
    posterUrl: '',
  });

  // Fetch the club that this admin manages
  useEffect(() => {
    if (user) {
      fetchClubs()
        .then((clubs) => {
          const myClub = clubs.find(c =>
            c.adminId === (user.id || user._id) ||
            (c.adminId && c.adminId.toString() === (user.id || user._id)?.toString())
          );
          if (myClub) setUserClub(myClub);
        })
        .catch(() => { });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the event with pending status
      const event = await createEvent({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        category: formData.category,
        maxParticipants: formData.maxParticipants,
        posterUrl: formData.posterUrl || '',
        clubId: userClub ? (userClub.id || userClub._id) : null,
        clubName: userClub ? userClub.name : '',
      });

      // Also create a request for admin approval
      await createRequest({
        type: 'event',
        title: formData.title,
        description: formData.description,
        relatedId: event.id || event._id,
      });

      toast.success('Event creation request submitted! Waiting for college admin approval.');
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        category: '',
        maxParticipants: '',
        posterUrl: '',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Create New Event</h1>
        <p className="text-gray-600">Create and submit an event for approval</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Fill in the event information. Your event will be reviewed by the college admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Annual Tech Symposium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your event in detail"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Event Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Event Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g., Main Auditorium"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Cultural">Cultural</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants *</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="e.g., 200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="posterUrl">Event Poster URL</Label>
              <Input
                id="posterUrl"
                type="url"
                value={formData.posterUrl || ''}
                onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                placeholder="https://example.com/poster.jpg"
              />
              <p className="text-xs text-gray-500">Provide a direct URL to your event poster image</p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <PlusCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• Ensure all event details are accurate and complete</p>
          <p>• Upload a high-quality poster for better visibility</p>
          <p>• Your event will be reviewed by college admin before approval</p>
          <p>• You will be notified once your event is approved or rejected</p>
        </CardContent>
      </Card>
    </div>
  );
};
