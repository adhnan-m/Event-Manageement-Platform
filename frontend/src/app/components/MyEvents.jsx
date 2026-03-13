import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Search } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { fetchMyEvents } from '@/app/utils/api';

export const MyEvents = ({ onEventClick }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMyEvents()
            .then((data) => setEvents(data))
            .catch((err) => console.error('Failed to load my events:', err))
            .finally(() => setLoading(false));
    }, []);

    const statusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-600';
            case 'pending': return 'bg-yellow-500';
            case 'rejected': return 'bg-red-600';
            default: return 'bg-gray-500';
        }
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.clubName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl mb-2">My Events</h1>
                <p className="text-gray-600">Events you've created and their status</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Search your events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredEvents.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">
                            {events.length === 0 ? "You haven't created any events yet" : 'No events match your search'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                        <Card key={event.id || event._id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onEventClick(event)}>
                            <div className="relative">
                                {event.posterUrl ? (
                                    <img
                                        src={event.posterUrl}
                                        alt={event.title}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                                        <Calendar className="w-12 h-12 text-blue-400" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <Badge className={`${statusColor(event.status)} text-white`}>
                                        {event.status}
                                    </Badge>
                                    {event.isPast && (
                                        <Badge variant="secondary">Past</Badge>
                                    )}
                                </div>
                            </div>
                            <CardHeader>
                                <CardTitle className="text-xl mb-1">{event.title}</CardTitle>
                                <CardDescription className="text-sm text-blue-600">
                                    {event.clubName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Clock className="w-4 h-4" />
                                        <span>{event.time}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4" />
                                        <span>{event.venue}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Users className="w-4 h-4" />
                                        <span>{event.currentParticipants} / {event.maxParticipants} registered</span>
                                    </div>
                                </div>

                                <div className="pt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${(event.currentParticipants / event.maxParticipants) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <Button className="w-full" onClick={() => onEventClick(event)}>
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
