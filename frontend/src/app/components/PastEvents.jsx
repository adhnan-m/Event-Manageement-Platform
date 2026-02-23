import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Calendar, MapPin, Clock, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { fetchPastEvents, getUserRegistrations } from '@/app/utils/api';

export const PastEvents = ({ onEventClick }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [attendedFilter, setAttendedFilter] = useState('all');
  const [eventsWithAttendance, setEventsWithAttendance] = useState([]);

  useEffect(() => {
    if (user) {
      // Load past events and user registrations from API
      // getUserRegistrations returns event objects with a nested .registration field
      Promise.all([fetchPastEvents(), getUserRegistrations()])
        .then(([pastEvents, userRegistrations]) => {
          // userRegistrations are event objects with .registration nested inside
          // Match past events with user's registrations by event ID
          const pastEventIds = pastEvents.map(e => String(e.id || e._id));

          // Filter user registrations to only include past events
          const pastRegistrations = userRegistrations.filter(regEvent => {
            const regEventId = String(regEvent.id || regEvent._id);
            return pastEventIds.includes(regEventId);
          });

          // Build events with attendance status
          const eventsWithStatus = pastRegistrations.map(regEvent => {
            const attended = regEvent.registration?.attended || false;

            return {
              ...regEvent,
              attended,
              registered: true,
              registeredAt: regEvent.registration?.registeredAt,
              attendedAt: regEvent.registration?.attendedAt,
            };
          });

          // Also add past events the user didn't register for (without attendance)
          const registeredIds = pastRegistrations.map(r => String(r.id || r._id));
          const unregisteredPast = pastEvents
            .filter(e => !registeredIds.includes(String(e.id || e._id)))
            .map(e => ({ ...e, attended: false, registered: false }));

          setEventsWithAttendance([...eventsWithStatus, ...unregisteredPast]);
        })
        .catch((err) => console.error('Failed to load past events:', err));
    }
  }, [user]);

  const filteredEvents = eventsWithAttendance.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.clubName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAttendance = attendedFilter === 'all' ||
      (attendedFilter === 'attended' && event.attended) ||
      (attendedFilter === 'notAttended' && !event.attended);
    return matchesSearch && matchesAttendance;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Past Events</h1>
        <p className="text-gray-600">View your event participation history</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search past events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={attendedFilter} onValueChange={(value) => setAttendedFilter(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by attendance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="attended">Attended</SelectItem>
            <SelectItem value="notAttended">Not Attended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No past events found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id || event._id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onEventClick(event)}>
              <div className="relative">
                <img
                  src={event.posterUrl}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
                {/* Watermark */}
                {event.registered && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`
                      ${event.attended ? 'bg-green-500' : 'bg-red-500'}
                      bg-opacity-90 text-white px-6 py-3 rounded-lg rotate-[-15deg] text-xl
                    `}>
                      {event.attended ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-6 h-6" />
                          <span>ATTENDED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-6 h-6" />
                          <span>NOT ATTENDED</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <p className="text-sm text-blue-600 mt-1">{event.clubName}</p>
                  </div>
                  <Badge variant={event.attended ? 'default' : 'secondary'}>
                    {event.attended ? 'Attended' : 'Missed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venue}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};