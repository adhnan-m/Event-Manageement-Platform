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

  const handleDownloadTicket = (message) => {
    // Find the QR code SVG element inside the ticket card
    const cardEl = document.getElementById(`ticket-${message.id || message._id}`);
    if (!cardEl) return;

    const svgEl = cardEl.querySelector('svg');
    if (!svgEl) return;

    // Serialize SVG to a data URL
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const ticketWidth = 500;
      const ticketHeight = 600;
      const canvas = document.createElement('canvas');
      canvas.width = ticketWidth;
      canvas.height = ticketHeight;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, ticketWidth, ticketHeight);

      // Header bar
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, ticketWidth, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎫 Event Ticket', ticketWidth / 2, 45);

      // Event title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 20px Arial, sans-serif';
      const title = message.eventTitle || message.subject || 'Event';
      ctx.fillText(title, ticketWidth / 2, 110);

      // Club name
      if (message.eventClubName) {
        ctx.fillStyle = '#2563eb';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(message.eventClubName, ticketWidth / 2, 138);
      }

      // Date
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Arial, sans-serif';
      const dateStr = new Date(message.date || message.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      ctx.fillText(dateStr, ticketWidth / 2, 165);

      // Dashed divider line
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 185);
      ctx.lineTo(ticketWidth - 30, 185);
      ctx.stroke();
      ctx.setLineDash([]);

      // QR Code
      const qrSize = 250;
      const qrX = (ticketWidth - qrSize) / 2;
      const qrY = 205;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Instructions
      ctx.fillStyle = '#64748b';
      ctx.font = '13px Arial, sans-serif';
      ctx.fillText('Show this QR code at the event venue', ticketWidth / 2, qrY + qrSize + 30);

      // Attendee info
      ctx.fillStyle = '#334155';
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText(`Attendee: ${user.name || user.email || ''}`, ticketWidth / 2, qrY + qrSize + 60);

      // Footer bar
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, ticketHeight - 40, ticketWidth, 40);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Arial, sans-serif';
      ctx.fillText('Event Portal — Keep this ticket safe', ticketWidth / 2, ticketHeight - 15);

      // Border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, ticketWidth - 2, ticketHeight - 2);

      // Trigger download
      const link = document.createElement('a');
      link.download = `ticket-${message.eventTitle || 'event'}.png`.replace(/\s+/g, '-');
      link.href = canvas.toDataURL('image/png');
      link.click();

      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
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
                  <div className="border-t pt-4" id={`ticket-${message.id || message._id}`}>
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
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => handleDownloadTicket(message)}
                    >
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