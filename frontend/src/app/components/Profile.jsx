import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/app/context/AuthContext';
import { User, Mail, Phone, GraduationCap, Award, Edit, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getUserRegistrations } from '@/app/utils/api';

export const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    semester: user?.semester || '',
    department: user?.department || '',
    phoneNumber: user?.phoneNumber || '',
  });

  useEffect(() => {
    if (user) {
      getUserRegistrations()
        .then((data) => {
          // Count events that are not past
          const upcoming = data.filter(e => !e.isPast);
          setUpcomingCount(upcoming.length);
        })
        .catch(() => setUpcomingCount(0));
    }
  }, [user]);

  const handleSave = async () => {
    await updateProfile({
      name: formData.name,
      semester: formData.semester,
      department: formData.department,
      phoneNumber: formData.phoneNumber,
    });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-xl mb-1">{user?.name}</h2>
            <Badge className="mb-4 capitalize">{user?.role}</Badge>
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              {user?.phoneNumber && (
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-700">{user?.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <p className="text-gray-700">{user?.email}</p>
              </div>

              {(user?.role === 'student' || user?.semester) && (
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  {isEditing ? (
                    <Input
                      id="semester"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-700">{user?.semester || 'Not set'}</p>
                  )}
                </div>
              )}

              {(user?.role === 'student' || user?.department) && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-700">{user?.department || 'Not set'}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                ) : (
                  <p className="text-gray-700">{user?.phoneNumber || 'Not set'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        {(user?.role === 'student' || user?.role === 'volunteer') && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Event Participation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-600 p-3 rounded-full">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl">{user?.eventsParticipated || 0}</p>
                    <p className="text-sm text-gray-600">Events Attended</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="bg-green-600 p-3 rounded-full">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl">{upcomingCount}</p>
                    <p className="text-sm text-gray-600">Upcoming Events</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                  <div className="bg-purple-600 p-3 rounded-full">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl capitalize">{user?.role}</p>
                    <p className="text-sm text-gray-600">Current Role</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <Button variant="destructive" onClick={logout} className="w-full">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
