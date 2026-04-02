import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Calendar, Clock, MapPin, Users, Search, Pencil, X, Save, Upload, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { fetchMyEvents, updateEvent, uploadPoster } from '@/app/utils/api';

export const MyEvents = ({ onEventClick }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [posterPreview, setPosterPreview] = useState(null);
    const [posterFile, setPosterFile] = useState(null);
    const fileInputRef = useRef(null);

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

    const openEdit = (event, e) => {
        e.stopPropagation();
        setEditingEvent(event.id || event._id);
        setEditForm({
            title: event.title || '',
            description: event.description || '',
            date: event.date || '',
            time: event.time || '',
            venue: event.venue || '',
            category: event.category || '',
            maxParticipants: event.maxParticipants || '',
            posterUrl: event.posterUrl || '',
        });
        setPosterPreview(event.posterUrl || null);
        setPosterFile(null);
    };

    const closeEdit = () => {
        setEditingEvent(null);
        setEditForm({});
        setPosterPreview(null);
        setPosterFile(null);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please select an image file (JPEG, PNG, GIF, or WebP)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }
        setPosterFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPosterPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!editForm.title.trim() || !editForm.date || !editForm.time || !editForm.venue.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Check if the event date/time is in the past
        const eventDateTime = new Date(`${editForm.date}T${editForm.time}`);
        if (eventDateTime < new Date()) {
            toast.error('Event date and time cannot be in the past');
            return;
        }
        setSaving(true);
        try {
            let posterUrl = editForm.posterUrl;
            if (posterFile) {
                setIsUploading(true);
                const uploadResult = await uploadPoster(posterFile);
                posterUrl = uploadResult.url;
                setIsUploading(false);
            }

            const updated = await updateEvent(editingEvent, {
                title: editForm.title,
                description: editForm.description,
                date: editForm.date,
                time: editForm.time,
                venue: editForm.venue,
                category: editForm.category,
                maxParticipants: Number(editForm.maxParticipants),
                posterUrl,
            });
            setEvents(events.map(ev =>
                (ev.id || ev._id) === editingEvent ? { ...ev, ...updated } : ev
            ));
            toast.success('Event updated successfully!');
            closeEdit();
        } catch (err) {
            toast.error(err.message || 'Failed to update event');
        } finally {
            setSaving(false);
            setIsUploading(false);
        }
    };

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

            {/* Edit Modal Overlay */}
            {editingEvent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeEdit}>
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Pencil className="w-5 h-5 text-blue-600" />
                                        Edit Event
                                    </CardTitle>
                                    <CardDescription>Update your event details</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={closeEdit}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">Event Title *</Label>
                                <Input
                                    id="edit-title"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    placeholder="Event title"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description *</Label>
                                <Textarea
                                    id="edit-description"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Describe your event"
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-date">Event Date *</Label>
                                    <Input
                                        id="edit-date"
                                        type="date"
                                        value={editForm.date}
                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-time">Event Time *</Label>
                                    <Input
                                        id="edit-time"
                                        type="time"
                                        value={editForm.time}
                                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-venue">Venue *</Label>
                                <Input
                                    id="edit-venue"
                                    value={editForm.venue}
                                    onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                                    placeholder="e.g., Main Auditorium"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-category">Category *</Label>
                                    <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                                        <SelectTrigger id="edit-category">
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
                                    <Label htmlFor="edit-maxParticipants">Max Participants *</Label>
                                    <Input
                                        id="edit-maxParticipants"
                                        type="number"
                                        value={editForm.maxParticipants}
                                        onChange={(e) => setEditForm({ ...editForm, maxParticipants: e.target.value })}
                                        placeholder="e.g., 200"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Poster Upload */}
                            <div className="space-y-2">
                                <Label>Event Poster</Label>
                                {posterPreview ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={posterPreview}
                                            alt="Poster preview"
                                            className="w-full max-w-sm h-48 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPosterFile(null);
                                                setPosterPreview(null);
                                                setEditForm({ ...editForm, posterUrl: '' });
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                    >
                                        <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600 font-medium">Click to upload poster image</p>
                                        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, or WebP (Max 5MB)</p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={closeEdit} className="flex-1">
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={saving || isUploading} className="flex-1">
                                    <Save className="w-4 h-4 mr-2" />
                                    {isUploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

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

                                <div className="flex gap-2">
                                    <Button className="flex-1" onClick={() => onEventClick(event)}>
                                        View Details
                                    </Button>
                                    {!event.isPast && (
                                        <Button variant="outline" size="sm" onClick={(e) => openEdit(event, e)}>
                                            <Pencil className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
