import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Mail, Ticket, Bell, Calendar } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/app/context/AuthContext';
import { fetchNotifications, markNotificationRead } from '@/app/utils/api';

export const Inbox = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      fetchNotifications()
        .then((data) => setNotifications(data))
        .catch((err) => console.error('Failed to load notifications:', err));
    }
  }, [user]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id || n._id) === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Inbox</h1>
        <p className="text-gray-600">Your event tickets and announcements</p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((message) => (
            <Card key={message.id || message._id} className={!message.read ? 'border-blue-500 border-2' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {message.type === 'ticket' ? (
                        <Ticket className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Bell className="w-5 h-5 text-orange-600" />
                      )}
                      <Badge variant={message.type === 'ticket' ? 'default' : 'secondary'}>
                        {message.type === 'ticket' ? 'Ticket' : 'Announcement'}
                      </Badge>
                      {!message.read && <Badge variant="destructive">New</Badge>}
                    </div>
                    <CardTitle className="text-lg">{message.subject}</CardTitle>
                    {message.eventClubName && (
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        From: {message.eventClubName}
                        {message.eventTitle ? ` — ${message.eventTitle}` : ''}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(message.date || message.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{message.content}</p>

                {message.type === 'ticket' && message.eventId && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3">Your Entry Ticket:</p>
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded">
                      <QRCodeSVG
                        value={JSON.stringify({
                          eventId: message.eventId,
                          userId: user.id || user._id,
                          registrationId: message.registrationId,
                          timestamp: message.date || message.createdAt,
                        })}
                        size={200}
                        level="H"
                      />
                      <p className="text-xs text-center text-gray-500 mt-3">
                        Show this QR code at the event venue
                      </p>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      Download Ticket
                    </Button>
                  </div>
                )}

                {!message.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleMarkAsRead(message.id || message._id)}
                  >
                    Mark as Read
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