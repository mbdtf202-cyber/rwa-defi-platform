import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!@#', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rwa-defi.com' },
    update: {},
    create: {
      email: 'admin@rwa-defi.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      kycStatus: 'APPROVED',
      walletAddress: '0x0000000000000000000000000000000000000001',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create test investor
  console.log('\n👤 Creating test investor...');
  const investorPassword = await bcrypt.hash('Investor123!@#', 10);
  
  const investor = await prisma.user.upsert({
    where: { email: 'investor@example.com' },
    update: {},
    create: {
      email: 'investor@example.com',
      password: investorPassword,
      firstName: 'John',
      lastName: 'Investor',
      role: 'INVESTOR',
      kycStatus: 'APPROVED',
      walletAddress: '0x0000000000000000000000000000000000000002',
    },
  });
  console.log('✅ Test investor created:', investor.email);

  // Create test SPV
  console.log('\n🏢 Creating test SPV...');
  const spv = await prisma.sPV.upsert({
    where: { registrationNumber: 'SPV-TEST-001' },
    update: {},
    create: {
      companyName: 'Test Property SPV LLC',
      jurisdiction: 'Delaware',
      legalRepresentative: 'John Doe',
      registrationNumber: 'SPV-TEST-001',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Test SPV created:', spv.companyName);

  // Create test property
  console.log('\n🏠 Creating test property...');
  const property = await prisma.property.create({
    data: {
      spvId: spv.id,
      address: '123 Main Street, New York, NY 10001',
      type: 'COMMERCIAL',
      area: 5000,
      purchasePrice: 5000000,
      currentValue: 5500000,
      occupancyRate: 0.95,
      monthlyRent: 50000,
      lat: 40.7128,
      lon: -74.0060,
    },
  });
  console.log('✅ Test property created:', property.address);

  // Create test valuation
  console.log('\n📊 Creating test valuation...');
  const valuation = await prisma.valuation.create({
    data: {
      propertyId: property.id,
      value: 5500000,
      method: 'AVM',
      confidence: 0.92,
      valuationDate: new Date(),
    },
  });
  console.log('✅ Test valuation created: $', valuation.value.toLocaleString());

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin:    admin@rwa-defi.com / Admin123!@#');
  console.log('   Investor: investor@example.com / Investor123!@#');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
