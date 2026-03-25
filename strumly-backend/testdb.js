const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test 1: Basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Test 2: Count existing records
    const userCount = await prisma.user. count();
    const bandCount = await prisma.band.count();
    console.log('📊 Current Database Stats:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Bands: ${bandCount}\n`);

    // Test 3: Create a test user
    console.log('👤 Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@strumly.com',
        password: 'password123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        instruments: ['Guitar', 'Piano'],
        genres: ['Rock', 'Jazz'],
        skillLevel: 'INTERMEDIATE',
        location: 'Kathmandu'
      }
    });
    console.log('✅ Test user created:', testUser.username);
    console.log('   ID:', testUser.id);
    console.log('   Email:', testUser.email, '\n');

    // Test 4: Retrieve the user
    console.log('🔎 Retrieving user...');
    const foundUser = await prisma.user. findUnique({
      where:  { email: 'test@strumly.com' }
    });
    console.log('✅ User found:', foundUser. username, '\n');

    // Test 5: Create a test band
    console.log('🎸 Creating test band...');
    const testBand = await prisma.band.create({
      data: {
        name: 'Test Band',
        description: 'A test band for development',
        genre: ['Rock'],
        location: 'Kathmandu',
        lookingFor: ['Drummer'],
        members: {
          create: {
            userId: testUser.id,
            role: 'LEADER'
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });
    console.log('✅ Test band created:', testBand.name);
    console.log('   Leader:', testBand.members[0].user.username, '\n');

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error. message);
  } finally {
    await prisma.$disconnect();
    console.log('👋 Disconnected from database');
  }
}

testDatabase();