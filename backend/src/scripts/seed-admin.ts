import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../prisma';

const adminEnvSchema = z.object({
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_NAME: z.string().min(1),
});

async function main() {
  const env = adminEnvSchema.parse(process.env);
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {
      name: env.ADMIN_NAME,
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
    },
    create: {
      email: env.ADMIN_EMAIL,
      name: env.ADMIN_NAME,
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  console.log(`Seeded admin ${admin.email} (${admin.role}/${admin.status})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
