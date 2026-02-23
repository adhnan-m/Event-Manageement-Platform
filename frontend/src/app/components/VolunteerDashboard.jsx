import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { MessageSquare, QrCode, Clock } from 'lucide-react';
import { QRScanner } from '@/app/components/QRScanner';
import { useAuth } from '@/app/context/AuthContext';
import { fetchNotifications, markNotificationRead } from '@/app/utils/api';

export const VolunteerDashboard = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (user) {
            fetchNotifications()
                .then((data) => {
                    // Filter volunteer-specific messages (type = 'volunteer')
                    const volunteerMsgs = data.filter(n => n.type === 'volunteer');
                    setMessages(volunteerMsgs);
                })
                .catch((err) => console.error('Failed to load messages:', err));
        }
    }, [user]);

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
                <p className="text-gray-600">Your volunteer tasks and QR attendance scanner</p>
            </div>

            <Tabs defaultValue="messages" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
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
            </Tabs>
        </div>
    );
};
