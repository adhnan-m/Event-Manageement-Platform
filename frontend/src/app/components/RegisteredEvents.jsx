import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Calendar, MapPin, Clock, Ticket, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/app/context/AuthContext';
import { getUserRegistrations } from '@/app/utils/api';
import { generateCertificate } from '@/app/utils/CertificateGenerator';

export const RegisteredEvents = ({ onEventClick, onBrowseEvents }) => {
  const { user } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState([]);

  useEffect(() => {
    if (user) {
      getUserRegistrations()
        .then((data) => setRegisteredEvents(data))
        .catch((err) => console.error('Failed to load registrations:', err));
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">My Registered Events</h1>
        <p className="text-gray-600">View your registered events and tickets</p>
      </div>

      {registeredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">You haven't registered for any events yet</p>
            <Button className="mt-4" onClick={onBrowseEvents}>
              Browse Events
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {registeredEvents.map((event) => (
            <Card key={event.id || event._id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={event.posterUrl}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
                {event.registration?.attended ? (
                  <Badge className="absolute top-2 right-2 bg-green-600">✓ Attended</Badge>
                ) : (
                  <Badge className="absolute top-2 right-2">Registered</Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <p className="text-sm text-blue-600">{event.clubName}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.venue}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Your Entry Ticket:</p>
                  <div className="flex justify-center p-4 bg-gray-50 rounded">
                    <QRCodeSVG
                      value={JSON.stringify({
                        eventId: event.id || event._id,
                        userId: user.id || user._id,
                        registrationId: event.registration?.id || event.registration?._id,
                        timestamp: event.registration?.registeredAt,
                      })}
                      size={150}
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Show this QR code at the event venue
                  </p>
                  {event.registration?.registeredAt && (
                    <p className="text-xs text-center text-gray-400 mt-1">
                      Registered on {new Date(event.registration.registeredAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <Button variant="outline" className="w-full" onClick={() => onEventClick(event)}>
                  View Details
                </Button>

                {event.registration?.attended && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => generateCertificate({
                      studentName: user?.name,
                      eventName: event.title,
                      clubName: event.clubName,
                      eventDate: event.date,
                      venue: event.venue,
                      attendedAt: event.registration?.attendedAt,
                    })}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Certificate
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};