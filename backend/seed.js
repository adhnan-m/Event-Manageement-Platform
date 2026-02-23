const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Event = require('./models/Event');
const Club = require('./models/Club');

const connectDB = require('./config/db');

const seedData = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...');

        // Clear existing data
        await User.deleteMany({});
        await Event.deleteMany({});
        await Club.deleteMany({});
        console.log('Cleared existing data.');

        // Create users
        const users = await User.create([
            {
                name: 'John Doe',
                email: 'john@college.edu',
                password: 'password123',
                role: 'clubAdmin',
                semester: '5',
                department: 'Computer Science',
                phoneNumber: '1234567890',
            },
            {
                name: 'Jane Smith',
                email: 'jane@college.edu',
                password: 'password123',
                role: 'clubAdmin',
                department: 'Arts',
                phoneNumber: '2345678901',
            },
            {
                name: 'Mike Johnson',
                email: 'mike@college.edu',
                password: 'password123',
                role: 'clubAdmin',
                department: 'Physical Education',
                phoneNumber: '3456789012',
            },
            {
                name: 'Student User',
                email: 'student@college.edu',
                password: 'password123',
                role: 'student',
                semester: '3',
                department: 'Computer Science',
                phoneNumber: '4567890123',
            },
            {
                name: 'Volunteer User',
                email: 'volunteer@college.edu',
                password: 'password123',
                role: 'volunteer',
                phoneNumber: '5678901234',
            },
            {
                name: 'College Admin',
                email: 'admin@college.edu',
                password: 'password123',
                role: 'collegeAdmin',
                phoneNumber: '6789012345',
            },
        ]);

        console.log(`Created ${users.length} users.`);

        // Create clubs
        const clubs = await Club.create([
            {
                name: 'Tech Club',
                description: 'Promoting technical excellence and innovation',
                adminId: users[0]._id,
                adminName: 'John Doe',
                status: 'approved',
            },
            {
                name: 'Cultural Club',
                description: 'Celebrating arts and culture',
                adminId: users[1]._id,
                adminName: 'Jane Smith',
                status: 'approved',
            },
            {
                name: 'Sports Club',
                description: 'Promoting sports and fitness',
                adminId: users[2]._id,
                adminName: 'Mike Johnson',
                status: 'approved',
            },
        ]);

        console.log(`Created ${clubs.length} clubs.`);

        // Create upcoming events
        const events = await Event.create([
            {
                title: 'Tech Symposium 2026',
                description: 'Annual technical symposium featuring workshops, competitions, and guest lectures from industry experts.',
                date: '2026-02-15',
                time: '09:00 AM',
                venue: 'Main Auditorium',
                posterUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
                clubId: clubs[0]._id,
                clubName: 'Tech Club',
                maxParticipants: 200,
                currentParticipants: 0,
                status: 'approved',
                category: 'Technical',
                createdBy: users[0]._id,
                isPast: false,
            },
            {
                title: 'Cultural Fest 2026',
                description: 'Three-day cultural extravaganza with music, dance, drama, and art competitions.',
                date: '2026-03-01',
                time: '10:00 AM',
                venue: 'College Grounds',
                posterUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop',
                clubId: clubs[1]._id,
                clubName: 'Cultural Club',
                maxParticipants: 500,
                currentParticipants: 0,
                status: 'approved',
                category: 'Cultural',
                createdBy: users[1]._id,
                isPast: false,
            },
            {
                title: 'Hackathon 2026',
                description: '24-hour coding marathon with exciting prizes and mentorship from tech leaders.',
                date: '2026-02-28',
                time: '08:00 AM',
                venue: 'Computer Lab',
                posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
                clubId: clubs[0]._id,
                clubName: 'Tech Club',
                maxParticipants: 100,
                currentParticipants: 0,
                status: 'approved',
                category: 'Technical',
                createdBy: users[0]._id,
                isPast: false,
            },
            {
                title: 'Sports Day 2026',
                description: 'Annual sports day with various athletic events and team competitions.',
                date: '2026-02-20',
                time: '07:00 AM',
                venue: 'Sports Ground',
                posterUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop',
                clubId: clubs[2]._id,
                clubName: 'Sports Club',
                maxParticipants: 300,
                currentParticipants: 0,
                status: 'approved',
                category: 'Sports',
                createdBy: users[2]._id,
                isPast: false,
            },
        ]);

        // Create past events
        const pastEvents = await Event.create([
            {
                title: 'Web Development Workshop',
                description: 'Hands-on workshop on modern web development with React and Node.js',
                date: '2025-12-15',
                time: '02:00 PM',
                venue: 'Lab 3',
                posterUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
                clubId: clubs[0]._id,
                clubName: 'Tech Club',
                maxParticipants: 50,
                currentParticipants: 0,
                status: 'approved',
                category: 'Technical',
                createdBy: users[0]._id,
                isPast: true,
            },
            {
                title: 'Dance Competition',
                description: 'Inter-college dance competition with various categories',
                date: '2025-11-20',
                time: '05:00 PM',
                venue: 'Main Stage',
                posterUrl: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=600&fit=crop',
                clubId: clubs[1]._id,
                clubName: 'Cultural Club',
                maxParticipants: 80,
                currentParticipants: 0,
                status: 'approved',
                category: 'Cultural',
                createdBy: users[1]._id,
                isPast: true,
            },
        ]);

        console.log(`Created ${events.length} upcoming events and ${pastEvents.length} past events.`);

        console.log('\n--- Seed Complete ---');
        console.log('Test accounts (all password: password123):');
        console.log('  Student:      student@college.edu');
        console.log('  Volunteer:    volunteer@college.edu');
        console.log('  Club Admin:   john@college.edu');
        console.log('  College Admin: admin@college.edu');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedData();
