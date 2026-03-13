import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Dashboard } from '@/app/components/Dashboard';
import { EventDetails } from '@/app/components/EventDetails';
import { RegisteredEvents } from '@/app/components/RegisteredEvents';
import { PastEvents } from '@/app/components/PastEvents';
import { Inbox } from '@/app/components/Inbox';
import { Profile } from '@/app/components/Profile';
import { ClubCreation } from '@/app/components/ClubCreation';
import { EventCreation } from '@/app/components/EventCreation';
import { RequestsPage } from '@/app/components/RequestsPage';
import { QRScanner } from '@/app/components/QRScanner';
import { AssignVolunteers } from '@/app/components/AssignVolunteers';
import { VolunteerDashboard } from '@/app/components/VolunteerDashboard';
import { MyEvents } from '@/app/components/MyEvents';
import { fetchClubs } from '@/app/utils/api';
import { Button } from '@/app/components/ui/button';
import {
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  User,
  Users,
  PlusCircle,
  FileText,
  QrCode,
  Briefcase,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [clubName, setClubName] = useState('');

  // Fetch club name for club admins
  useEffect(() => {
    if (user?.role === 'clubAdmin') {
      fetchClubs()
        .then((clubs) => {
          const userId = user.id || user._id;
          const myClub = clubs.find(c => (c.adminId?.toString?.() || c.adminId) === userId);
          if (myClub) setClubName(myClub.name);
        })
        .catch(() => { });
    }
  }, [user]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setCurrentPage('eventDetails');
  };

  const handleLogout = () => {
    logout();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
    // Refresh data when changing pages
    setRefreshKey(prev => prev + 1);
  };

  const navigationItems = [
    { page: 'dashboard', icon: Calendar, label: 'Upcoming Events', roles: ['student', 'volunteer', 'clubAdmin', 'collegeAdmin'] },
    { page: 'registered', icon: CheckCircle, label: 'Registered Events', roles: ['student', 'volunteer'] },
    { page: 'past', icon: Clock, label: 'Past Events', roles: ['student', 'volunteer'] },
    { page: 'inbox', icon: Mail, label: 'Inbox', roles: ['student', 'volunteer', 'clubAdmin'] },
    { page: 'clubCreation', icon: PlusCircle, label: 'Create Club', roles: ['student', 'volunteer'] },
    { page: 'assignVolunteers', icon: Users, label: 'Assign Volunteers', roles: ['clubAdmin'] },
    { page: 'eventCreation', icon: PlusCircle, label: 'Create Event', roles: ['clubAdmin'] },
    { page: 'myEvents', icon: Calendar, label: 'My Events', roles: ['clubAdmin'] },
    { page: 'requests', icon: FileText, label: 'Requests', roles: ['collegeAdmin'] },
    { page: 'volunteerDashboard', icon: Briefcase, label: 'Volunteering', roles: ['volunteer'] },
    { page: 'scanner', icon: QrCode, label: 'QR Scanner', roles: ['clubAdmin'] },
    { page: 'profile', icon: User, label: 'Profile', roles: ['student', 'volunteer', 'clubAdmin', 'collegeAdmin'] },
  ];

  const availableNavItems = navigationItems.filter(item =>
    item.roles.includes(user?.role || 'student')
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={refreshKey} onEventClick={handleEventClick} />;
      case 'eventDetails':
        return (
          <EventDetails
            event={selectedEvent}
            onClose={() => handlePageChange('dashboard')}
            onRegisterSuccess={() => handlePageChange('registered')}
          />
        );
      case 'registered':
        return <RegisteredEvents key={refreshKey} onEventClick={handleEventClick} onBrowseEvents={() => handlePageChange('dashboard')} />;
      case 'past':
        return <PastEvents key={refreshKey} onEventClick={handleEventClick} />;
      case 'inbox':
        return <Inbox key={refreshKey} />;
      case 'profile':
        return <Profile key={refreshKey} />;
      case 'clubCreation':
        return <ClubCreation key={refreshKey} />;
      case 'eventCreation':
        return <EventCreation key={refreshKey} />;
      case 'requests':
        return <RequestsPage key={refreshKey} />;
      case 'scanner':
        return <QRScanner key={refreshKey} />;
      case 'myEvents':
        return <MyEvents key={refreshKey} onEventClick={handleEventClick} />;
      case 'assignVolunteers':
        return <AssignVolunteers key={refreshKey} />;
      case 'volunteerDashboard':
        return <VolunteerDashboard key={refreshKey} />;
      default:
        return <Dashboard key={refreshKey} onEventClick={handleEventClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl">Event Portal</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b">
              <h1 className="text-2xl">Event Portal</h1>
              <p className="text-sm text-gray-600 mt-1">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              {clubName && (
                <p className="text-xs text-blue-600 font-medium mt-1">{clubName}</p>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-2">
                {availableNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.page;

                  return (
                    <li key={item.page}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => handlePageChange(item.page)}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="p-4 border-t">
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};