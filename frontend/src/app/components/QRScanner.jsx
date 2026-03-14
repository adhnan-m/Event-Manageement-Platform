import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { QrCode, CheckCircle, XCircle, Camera } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { markAttendance, getTodayAttendance } from '@/app/utils/api';

export const QRScanner = () => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const videoRef = useRef(null);
  const [codeReader] = useState(() => new BrowserMultiFormatReader());

  // Load today's scan history on mount
  useEffect(() => {
    getTodayAttendance()
      .then((data) => setScanHistory(data))
      .catch((err) => console.error('Failed to load attendance:', err));
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);

      // Explicitly request camera permission first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch (permErr) {
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          toast.error('Camera permission denied. Please allow camera access in your browser settings and try again.');
        } else if (permErr.name === 'NotFoundError') {
          toast.error('No camera found on this device.');
        } else {
          toast.error('Unable to access camera: ' + permErr.message);
        }
        setIsScanning(false);
        return;
      }

      // Stop the temporary stream — the zxing library will create its own
      stream.getTracks().forEach(track => track.stop());

      if (videoRef.current) {
        codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, error) => {
            if (result) {
              handleScan(result.getText());
            }
          }
        );
      }
    } catch (error) {
      console.error('Scanner error:', error);
      toast.error('Failed to start scanner. Please check camera permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    codeReader.reset();
    setIsScanning(false);
  };

  const handleScan = async (data) => {
    try {
      // Parse QR code data (JSON format)
      const qrData = JSON.parse(data);
      const { eventId, userId, registrationId } = qrData;

      if (!eventId || !userId || !registrationId) {
        toast.error('Invalid QR code format');
        return;
      }

      // Mark attendance via API
      const result = await markAttendance(userId, eventId);

      if (result.success) {
        const scanResult = {
          eventId,
          userId,
          userName: result.userName || 'Attendee',
          eventName: result.eventName || 'Event',
          timestamp: new Date().toISOString(),
          status: 'valid',
        };

        setScanHistory(prev => [scanResult, ...prev]);
        toast.success('Attendance marked successfully!');
      }

      stopScanning();
    } catch (error) {
      console.error('QR scan error:', error);

      // Handle API error response
      const scanResult = {
        eventId: '',
        userId: '',
        userName: 'Unknown',
        eventName: 'Unknown',
        timestamp: new Date().toISOString(),
        status: 'invalid',
        message: error.message || 'Invalid QR code',
      };

      setScanHistory(prev => [scanResult, ...prev]);
      toast.error(error.message || 'Failed to mark attendance');
      stopScanning();
    }
  };

  useEffect(() => {
    return () => {
      codeReader.reset();
    };
  }, [codeReader]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">QR Code Scanner</h1>
        <p className="text-gray-600">Scan student tickets for event attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {isScanning ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <QrCode className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-center opacity-75">Click start to scan QR codes</p>
                </div>
              )}

              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-green-500 rounded-lg" style={{ width: '60%', height: '60%' }}>
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startScanning} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scanner
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="destructive" className="flex-1">
                  Stop Scanner
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>• Position the QR code within the frame</p>
              <p>• Ensure good lighting for best results</p>
              <p>• The ticket will be validated automatically</p>
            </div>
          </CardContent>
        </Card>

        {/* Scan History */}
        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {scanHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No scans yet</p>
              ) : (
                scanHistory.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${result.status === 'valid'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p>{result.eventName}</p>
                        <p className="text-sm text-gray-600">{result.userName}</p>
                        {result.message && (
                          <p className="text-xs text-red-600 mt-1">{result.message}</p>
                        )}
                      </div>
                      {result.status === 'valid' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <Badge variant={result.status === 'valid' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                      <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl">{scanHistory.length}</p>
              <p className="text-sm text-gray-600">Total Scans</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl">{scanHistory.filter(s => s.status === 'valid').length}</p>
              <p className="text-sm text-gray-600">Valid Tickets</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-2xl">{scanHistory.filter(s => s.status === 'invalid').length}</p>
              <p className="text-sm text-gray-600">Invalid Tickets</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};