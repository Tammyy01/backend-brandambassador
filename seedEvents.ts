import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './models/Event';

dotenv.config();

const sampleEvents = [
  {
    title: "Lagos Tech Summit",
    date: new Date("2025-09-04"),
    time: "10:00AM",
    description: "The biggest tech gathering in West Africa. Join us at the Landmark Centre for a day of innovation and networking.",
    location: "Landmark Centre, Victoria Island, Lagos",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    attendees: []
  },
  {
    title: "Abuja AI Conference",
    date: new Date("2025-10-15"),
    time: "9:00AM",
    description: "Exploring the future of Artificial Intelligence in governance and public sector. Held at the International Conference Centre.",
    location: "International Conference Centre, Garki, Abuja",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    attendees: []
  },
  {
    title: "Port Harcourt Startup Meetup",
    date: new Date("2025-11-29"),
    time: "5:00PM",
    description: "A meetup for founders and investors in the Garden City. Connect and grow your business.",
    location: "Tech Creek, Aba Road, Port Harcourt",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    attendees: []
  }
];

const seedEvents = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing events to avoid duplicates and keep data clean
    await Event.deleteMany({});
    console.log('🗑️ Cleared existing events');

    const createdEvents = await Event.insertMany(sampleEvents);
    console.log(`🎉 Successfully added ${createdEvents.length} events`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  }
};

seedEvents();
