import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { CheckCircle, XCircle, User, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { fetchRequests, updateRequest } from '@/app/utils/api';

const RequestCard = ({ request, onApprove, onReject }) => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={request.type === 'event' ? 'default' : 'secondary'}>
              {request.type === 'event' ? 'Event' : 'Club'}
            </Badge>
            {request.status !== 'pending' && (
              <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
                {request.status}
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl">{request.title}</CardTitle>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-gray-700">{request.description}</p>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4" />
          <span>Submitted by: {request.submittedBy}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{request.submittedEmail}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{new Date(request.submittedAt || request.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {request.status === 'pending' && (
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onReject(request.id || request._id)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            className="flex-1"
            onClick={() => onApprove(request.id || request._id)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

export const RequestsPage = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests()
      .then((data) => setRequests(data))
      .catch((err) => console.error('Failed to load requests:', err));
  }, []);

  const handleApprove = async (id) => {
    try {
      await updateRequest(id, 'approved');
      setRequests(requests.map(req =>
        (req.id || req._id) === id ? { ...req, status: 'approved' } : req
      ));
      toast.success('Request approved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      await updateRequest(id, 'rejected');
      setRequests(requests.map(req =>
        (req.id || req._id) === id ? { ...req, status: 'rejected' } : req
      ));
      toast.success('Request rejected.');
    } catch (err) {
      toast.error(err.message || 'Failed to reject request');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Approval Requests</h1>
        <p className="text-gray-600">Review and manage event and club requests</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processed ({processedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingRequests.map(request => (
                <RequestCard
                  key={request.id || request._id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4 mt-6">
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No processed requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {processedRequests.map(request => (
                <RequestCard
                  key={request.id || request._id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
