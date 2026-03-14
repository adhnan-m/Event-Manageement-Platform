import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClub, createRequest } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';

export const ClubCreation = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clubName: '',
    description: '',
    contactEmail: '',
    memberCount: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the club with pending status
      const club = await createClub({
        name: formData.clubName,
        description: formData.description,
        contactEmail: formData.contactEmail,
        memberCount: formData.memberCount,
      });

      // Also create a request for admin approval
      await createRequest({
        type: 'club',
        title: formData.clubName,
        description: formData.description,
        relatedId: club.id || club._id,
      });

      toast.success('Club creation request submitted! Waiting for college admin approval.');
      setFormData({ clubName: '', description: '', contactEmail: '', memberCount: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Create a New Club</h1>
        <p className="text-gray-600">Request to become a club admin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Club Information</CardTitle>
          <CardDescription>
            Fill in the details below. Your request will be reviewed by the college admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clubName">Club Name *</Label>
              <Input
                id="clubName"
                value={formData.clubName}
                onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                placeholder="e.g., Robotics Club"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose and activities of your club"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="club@college.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberCount">Expected Member Count</Label>
              <Input
                id="memberCount"
                type="number"
                min="0"
                value={formData.memberCount}
                onChange={(e) => setFormData({ ...formData, memberCount: e.target.value })}
                placeholder="Estimated number of members"
              />
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
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• Your request will be reviewed by the college administration</p>
          <p>• You will be notified once your request is approved or rejected</p>
          <p>• Upon approval, you will gain access to event creation features</p>
          <p>• As a club admin, you will be responsible for managing your club's events</p>
        </CardContent>
      </Card>
    </div>
  );
};
