import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Calendar, Clock, MapPin, Users, ArrowLeft, UserPlus, Mail, Phone, Send } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { registerForEvent, checkRegistration, getEventRegistrations, sendEventMessage } from '@/app/utils/api';
import { Textarea } from '@/app/components/ui/textarea';

export const EventDetails = ({ event, onClose, onRegisterSuccess }) => {
  const { user, updateProfile } = useAuth();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    semester: user?.semester || '',
    department: user?.department || '',
    phoneNumber: user?.phoneNumber || '',
  });

  useEffect(() => {
    if (event && user) {
      const eventId = event.id || event._id;
      checkRegistration(eventId)
        .then((data) => setAlreadyRegistered(data.isRegistered))
        .catch(() => setAlreadyRegistered(false));
    }
  }, [event, user]);

  // Fetch participants for college admins and club admins
  useEffect(() => {
    if (event && (user?.role === 'collegeAdmin' || user?.role === 'clubAdmin')) {
      const eventId = event.id || event._id;
      setLoadingParticipants(true);
      getEventRegistrations(eventId)
        .then((data) => setParticipants(data))
        .catch((err) => console.error('Failed to load participants:', err))
        .finally(() => setLoadingParticipants(false));
    }
  }, [event, user]);

  if (!event) return null;

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) {
        toast.error('You must be logged in to register');
        return;
      }

      const eventId = event.id || event._id;
      const result = await registerForEvent(eventId, formData);

      if (result.success) {
        // Update user profile with the form data
        updateProfile({
          name: formData.name,
          semester: formData.semester,
          department: formData.department,
          phoneNumber: formData.phoneNumber,
        });

        toast.success('Successfully registered for the event!');
        setShowRegistrationForm(false);
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Button variant="ghost" onClick={onClose} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="relative">
                <img
                  src={event.posterUrl}
                  alt={event.title}
                  className="w-full h-96 object-cover rounded-t-lg"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="text-lg px-4 py-2">{event.category}</Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-3xl">{event.title}</CardTitle>
                <CardDescription className="text-lg text-blue-600">
                  Organized by {event.clubName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl mb-2">About This Event</h3>
                  <p className="text-gray-700 leading-relaxed">{event.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p>{event.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Venue</p>
                    <p>{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Participants</p>
                    <p>{event.currentParticipants} / {event.maxParticipants}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(event.currentParticipants / event.maxParticipants) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {(user?.role === 'collegeAdmin' || user?.role === 'clubAdmin') ? null : alreadyRegistered ? (
                  <Button className="w-full" size="lg" disabled>
                    Already Registered
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setShowRegistrationForm(true)}
                    disabled={event.currentParticipants >= event.maxParticipants}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {event.currentParticipants >= event.maxParticipants ? 'Event Full' : 'Register Now'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Participants List - College Admin & Club Admin */}
          {(user?.role === 'collegeAdmin' || user?.role === 'clubAdmin') && (
            <Card className="lg:col-span-3 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Registered Participants ({participants.length})
                </CardTitle>
                <CardDescription>List of all students registered for this event</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingParticipants ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : participants.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No participants registered yet</p>
                ) : (
                  <div className="space-y-3">
                    {participants.map((p, idx) => (
                      <div key={p.id || p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-400 w-6">{idx + 1}.</span>
                            <p className="font-medium">{p.userName}</p>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 ml-8 mt-1">
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" /> {p.userEmail}
                            </span>
                            {p.department && (
                              <span className="text-sm text-gray-600">Dept: {p.department}</span>
                            )}
                            {p.semester && (
                              <span className="text-sm text-gray-600">Sem: {p.semester}</span>
                            )}
                            {p.phoneNumber && (
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="w-3 h-3" /> {p.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-600">Registered</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Event Messaging - Club Admin Only */}
          {user?.role === 'clubAdmin' && participants.length > 0 && (
            <Card className="lg:col-span-3 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Message Participants
                </CardTitle>
                <CardDescription>Send a notification to all {participants.length} registered participant(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setSendingMessage(true);
                  try {
                    const eventId = event.id || event._id;
                    await sendEventMessage(eventId, messageSubject, messageContent);
                    toast.success(`Message sent to ${participants.length} participant(s)!`);
                    setMessageSubject('');
                    setMessageContent('');
                  } catch (error) {
                    toast.error(error.message || 'Failed to send message');
                  } finally {
                    setSendingMessage(false);
                  }
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="msg-subject">Subject</Label>
                    <Input
                      id="msg-subject"
                      placeholder="e.g., Important update about the event"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="msg-content">Message</Label>
                    <Textarea
                      id="msg-content"
                      placeholder="Type your message here..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={sendingMessage}>
                    <Send className="w-4 h-4 mr-2" />
                    {sendingMessage ? 'Sending...' : 'Send to All Participants'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Registration Form Dialog */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register for {event.title}</DialogTitle>
            <DialogDescription>Please fill in your details to complete registration</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Input
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                placeholder="e.g., 5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Computer Science"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="1234567890"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowRegistrationForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Registering...' : 'Confirm Registration'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};