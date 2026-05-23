import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { MessageSquare, QrCode, Clock, Award, Download, Users } from 'lucide-react';
import { QRScanner } from '@/app/components/QRScanner';
import { useAuth } from '@/app/context/AuthContext';
import { fetchNotifications, markNotificationRead, fetchMyVolunteerClubs } from '@/app/utils/api';
import { generateVolunteerCertificate } from '@/app/utils/CertificateGenerator';

export const VolunteerDashboard = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [clubsLoading, setClubsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications()
                .then((data) => {
                    const volunteerMsgs = data.filter(n => n.type === 'volunteer');
                    setMessages(volunteerMsgs);
                })
                .catch((err) => console.error('Failed to load messages:', err));
        }
    }, [user]);

    const loadClubs = async () => {
        if (clubs.length > 0) return; // already loaded
        setClubsLoading(true);
        try {
            const data = await fetchMyVolunteerClubs();
            setClubs(data);
        } catch (err) {
            console.error('Failed to load volunteer clubs:', err);
        } finally {
            setClubsLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await markNotificationRead(id);
            setMessages(prev =>
                prev.map(m => (m.id || m._id) === id ? { ...m, read: true } : m)
            );
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl mb-2">Volunteering</h1>
                <p className="text-gray-600">Your volunteer tasks, QR scanner, and certificates</p>
            </div>

            <Tabs defaultValue="messages" className="w-full" onValueChange={(val) => {
                if (val === 'certificate') loadClubs();
            }}>
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="messages">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Messages
                        {messages.filter(m => !m.read).length > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                                {messages.filter(m => !m.read).length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="scanner">
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Scanner
                    </TabsTrigger>
                    <TabsTrigger value="certificate">
                        <Award className="w-4 h-4 mr-2" />
                        Certificate
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="mt-6">
                    {messages.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No messages from club admins yet</p>
                                <p className="text-sm text-gray-400 mt-1">You'll receive task assignments and updates here</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <Card key={msg.id || msg._id} className={!msg.read ? 'border-blue-500 border-2' : ''}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                                    {!msg.read && <Badge variant="destructive">New</Badge>}
                                                </div>
                                                <CardTitle className="text-lg">{msg.subject}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(msg.date || msg.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-gray-700">{msg.content}</p>
                                        {!msg.read && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMarkAsRead(msg.id || msg._id)}
                                            >
                                                Mark as Read
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="scanner" className="mt-6">
                    <QRScanner />
                </TabsContent>

                <TabsContent value="certificate" className="mt-6">
                    {clubsLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                        </div>
                    ) : clubs.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No volunteer certificates available yet</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Certificates will appear here once a club admin assigns you as a volunteer
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <Card className="border-emerald-200 bg-emerald-50/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-emerald-600" />
                                        Your Volunteer Certificates
                                    </CardTitle>
                                    <CardDescription>
                                        Download certificates for the clubs you volunteer with
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {clubs.map((club) => (
                                <Card key={club.id} className="overflow-hidden">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <Users className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-lg">{club.clubName}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Admin: {club.clubAdminName}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Member since {new Date(club.assignedDate).toLocaleDateString('en-US', {
                                                            month: 'long', day: 'numeric', year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => generateVolunteerCertificate({
                                                    volunteerName: user?.name,
                                                    clubName: club.clubName,
                                                    clubAdminName: club.clubAdminName,
                                                    assignedDate: club.assignedDate,
                                                })}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download Certificate
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
