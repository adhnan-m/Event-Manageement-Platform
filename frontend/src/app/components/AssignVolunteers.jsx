import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Users, Search, UserPlus, UserMinus, Send, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { fetchStudents, assignVolunteer, removeVolunteer, sendVolunteerMessage, transferClubAdmin } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';

export const AssignVolunteers = () => {
    const { user, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [msgSubject, setMsgSubject] = useState('');
    const [msgContent, setMsgContent] = useState('');
    const [sending, setSending] = useState(false);
    const [transferTarget, setTransferTarget] = useState(null);
    const [transferring, setTransferring] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await fetchStudents();
            setUsers(data);
        } catch (err) {
            console.error('Failed to load students:', err);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (userId) => {
        try {
            await assignVolunteer(userId);
            setUsers(users.map(u =>
                (u.id || u._id) === userId ? { ...u, role: 'volunteer' } : u
            ));
            toast.success('Volunteer assigned successfully!');
        } catch (err) {
            toast.error(err.message || 'Failed to assign volunteer');
        }
    };

    const handleRemove = async (userId) => {
        try {
            await removeVolunteer(userId);
            setUsers(users.map(u =>
                (u.id || u._id) === userId ? { ...u, role: 'student' } : u
            ));
            toast.success('Volunteer role removed.');
        } catch (err) {
            toast.error(err.message || 'Failed to remove volunteer role');
        }
    };

    const handleSendMessage = async () => {
        if (!msgSubject.trim() || !msgContent.trim()) {
            toast.error('Please fill in both subject and message');
            return;
        }
        setSending(true);
        try {
            const volunteerIds = users.filter(u => u.role === 'volunteer').map(u => u.id || u._id);
            await sendVolunteerMessage(msgSubject, msgContent, volunteerIds);
            toast.success('Message sent to all volunteers!');
            setMsgSubject('');
            setMsgContent('');
        } catch (err) {
            toast.error(err.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const volunteers = filteredUsers.filter(u => u.role === 'volunteer');
    const students = filteredUsers.filter(u => u.role === 'student');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl mb-2">Assign Volunteers</h1>
                <p className="text-gray-600">Manage volunteer assignments and send them messages</p>
            </div>

            {/* Message Volunteers */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600" />
                        Message Volunteers
                    </CardTitle>
                    <CardDescription>Send a message to all your assigned volunteers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="msg-subject">Subject</Label>
                        <Input
                            id="msg-subject"
                            placeholder="e.g., Event setup instructions for tomorrow"
                            value={msgSubject}
                            onChange={(e) => setMsgSubject(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="msg-content">Message</Label>
                        <Textarea
                            id="msg-content"
                            placeholder="Write your message to all volunteers..."
                            value={msgContent}
                            onChange={(e) => setMsgContent(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <Button onClick={handleSendMessage} disabled={sending || users.filter(u => u.role === 'volunteer').length === 0}>
                        <Send className="w-4 h-4 mr-2" />
                        {sending ? 'Sending...' : `Send to ${users.filter(u => u.role === 'volunteer').length} Volunteer(s)`}
                    </Button>
                </CardContent>
            </Card>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Search students by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : (
                <>
                    {/* Current Volunteers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Current Volunteers ({volunteers.length})
                            </CardTitle>
                            <CardDescription>Students currently assigned as volunteers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {volunteers.length === 0 ? (
                                <p className="text-center text-gray-500 py-6">No volunteers assigned yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {volunteers.map(user => (
                                        <div key={user.id || user._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="default" className="bg-green-600">Volunteer</Badge>
                                                <Button variant="outline" size="sm" onClick={() => handleRemove(user.id || user._id)}>
                                                    <UserMinus className="w-4 h-4 mr-1" />
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Available Students */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Students ({students.length})</CardTitle>
                            <CardDescription>Assign students as volunteers for event management</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {students.length === 0 ? (
                                <p className="text-center text-gray-500 py-6">No students available</p>
                            ) : (
                                <div className="space-y-3">
                                    {students.map(user => (
                                        <div key={user.id || user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                            <Button size="sm" onClick={() => handleAssign(user.id || user._id)}>
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Assign
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {/* Transfer Position */}
                    <Card className="border-red-200 bg-red-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <ArrowRightLeft className="w-5 h-5" />
                                Transfer Club Admin Position
                            </CardTitle>
                            <CardDescription>
                                Hand over your club admin position. You will become a volunteer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!transferTarget ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600">Select a student to transfer your club admin position to:</p>
                                    {[...students, ...volunteers].map(u => (
                                        <div key={u.id || u._id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                            <div>
                                                <p className="font-medium">{u.name}</p>
                                                <p className="text-sm text-gray-600">{u.email}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setTransferTarget(u)} className="text-red-600 border-red-300 hover:bg-red-50">
                                                <ArrowRightLeft className="w-4 h-4 mr-1" />
                                                Select
                                            </Button>
                                        </div>
                                    ))}
                                    {students.length === 0 && volunteers.length === 0 && (
                                        <p className="text-center text-gray-500 py-4">No students available to transfer to</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-red-100 rounded-lg border border-red-300">
                                        <p className="font-medium text-red-800">⚠️ Are you sure?</p>
                                        <p className="text-sm text-red-700 mt-1">
                                            You are about to transfer your Club Admin position to <strong>{transferTarget.name}</strong> ({transferTarget.email}).
                                            You will become a volunteer and lose admin privileges.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setTransferTarget(null)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            disabled={transferring}
                                            onClick={async () => {
                                                setTransferring(true);
                                                try {
                                                    await transferClubAdmin(transferTarget.id || transferTarget._id);
                                                    toast.success(`Position transferred to ${transferTarget.name}. Logging out...`);
                                                    setTimeout(() => logout(), 2000);
                                                } catch (err) {
                                                    toast.error(err.message || 'Failed to transfer position');
                                                    setTransferring(false);
                                                }
                                            }}
                                        >
                                            {transferring ? 'Transferring...' : 'Confirm Transfer'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};
