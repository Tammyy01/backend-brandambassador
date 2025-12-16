import mongoose from 'mongoose';
import User from './models/User';
import dotenv from 'dotenv';

dotenv.config();

const seedAppleTestAccount = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/punch-ambassador';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Test account credentials (must match your .env)
        const testPhone = process.env.APPLE_TEST_PHONE || '+15555555555';
        const testOtp = process.env.APPLE_TEST_OTP || '1234';

        console.log(`\n🍎 Setting up Apple Test Account:`);
        console.log(`   Phone: ${testPhone}`);
        console.log(`   OTP: ${testOtp}`);

        // Check if test user already exists
        let testUser = await User.findOne({ phone: testPhone });

        if (testUser) {
            console.log('\n📱 Test user already exists, updating...');
            testUser.status = 'submitted';
            testUser.phoneVerified = true;
            testUser.emailVerified = true;
            testUser.isProfileCompleted = true;
            testUser.name = testUser.name || 'Apple Reviewer';
            testUser.email = testUser.email || 'applereviewer@test.com';
            await testUser.save();
        } else {
            console.log('\n📱 Creating new test user...');
            testUser = await User.create({
                phone: testPhone,
                email: 'applereviewer@test.com',
                name: 'Apple Reviewer',
                status: 'submitted',
                phoneVerified: true,
                emailVerified: true,
                isProfileCompleted: true,
                completedAt: new Date(),
                videoUploaded: true,
                videoReviewStatus: 'approved',
                progress: {
                    video: true,
                    phone: true,
                    email: true
                }
            });
        }

        console.log('\n✅ Apple Test Account Ready!');
        console.log(`   User ID: ${testUser._id}`);
        console.log(`   Name: ${testUser.name}`);
        console.log(`   Phone: ${testUser.phone}`);
        console.log(`   Status: ${testUser.status}`);
        console.log(`   Profile Completed: ${testUser.isProfileCompleted}`);

        console.log('\n🎯 Test Instructions:');
        console.log(`   1. Open the app and go to Login`);
        console.log(`   2. Enter phone number: ${testPhone}`);
        console.log(`   3. Enter OTP: ${testOtp}`);
        console.log(`   4. Login should succeed!`);

    } catch (error) {
        console.error('❌ Error seeding test account:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

seedAppleTestAccount();
