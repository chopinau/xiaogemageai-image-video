import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@ai.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        nickname: '管理员',
        role: 'admin',
        membership: 'enterprise',
        credits: 9999,
        referralCode: 'ADMIN001',
        status: 'active'
      }
    });
    console.log(`Created admin user: ${admin.email} (ID: ${admin.id})`);
  } else {
    console.log('Admin user already exists, skipping seed.');
  }

  const testEmail = 'test@ai.com';
  const existingTest = await prisma.user.findUnique({ where: { email: testEmail } });

  if (!existingTest) {
    const passwordHash = await bcrypt.hash('test123', 10);
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        nickname: '测试用户',
        role: 'user',
        membership: 'pro',
        credits: 100,
        referralCode: 'TEST001',
        status: 'active'
      }
    });
    console.log(`Created test user: ${testUser.email} (ID: ${testUser.id})`);
  }

  const demoEmail = 'demo@ai.com';
  const existingDemo = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!existingDemo) {
    const passwordHash = await bcrypt.hash('demo123', 10);
    const demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        nickname: '演示体验用户',
        role: 'user',
        membership: 'free',
        credits: 50,
        referralCode: 'DEMO001',
        status: 'active'
      }
    });
    console.log(`Created demo user: ${demoUser.email} (ID: ${demoUser.id})`);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
