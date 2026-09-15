import bcrypt from 'bcryptjs';
import { db, sqlClient } from './index';
import {
  users,
  providers,
  wallets,
  customerLocations,
  menus,
  menuItems,
  serviceAreas,
  cutoffPolicies,
} from './schema/index';
import { logger } from '../shared/logger/logger';

async function seed() {
  logger.info('Starting GharKhana database seed...');

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

  // 1. Create Admin
  const [adminUser] = await db
    .insert(users)
    .values({
      name: 'Platform Operations Admin',
      email: 'admin@gharkhana.app',
      phone: '+9779800000003',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  logger.info({ adminId: adminUser?.id }, 'Admin user created/verified');

  // 2. Create Customer
  const [customerUser] = await db
    .insert(users)
    .values({
      name: 'Ramesh Shrestha',
      email: 'customer@gharkhana.app',
      phone: '+9779800000001',
      passwordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (customerUser) {
    // Add default location for Ramesh
    await db.insert(customerLocations).values({
      customerId: customerUser.id,
      label: 'Office (New Road)',
      addressLine: 'House 45, Khichapokhari, New Road, Kathmandu',
      landmark: 'Near Peoples Plaza',
      latitude: '27.704200',
      longitude: '85.308800',
      instructions: '3rd Floor, IT Department',
      isDefault: true,
    });
  }

  // 3. Create Provider
  const [providerUser] = await db
    .insert(users)
    .values({
      name: 'Hira Devi Maharjan',
      email: 'provider@gharkhana.app',
      phone: '+9779800000002',
      passwordHash,
      role: 'PROVIDER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (providerUser) {
    const [hiraProvider] = await db
      .insert(providers)
      .values({
        userId: providerUser.id,
        displayName: "Hira's Home Kitchen",
        description: 'Authentic Newari and Nepali home-cooked daily meals with love and hygiene.',
        providerType: 'HOME_COOK',
        verificationStatus: 'VERIFIED',
        status: 'ACTIVE',
        dailyCapacity: { BREAKFAST: 10, LUNCH: 40, DINNER: 30, SNACKS: 20 },
        rating: '4.8',
        ratingCount: 36,
      })
      .returning();

    // Create provider wallet
    await db.insert(wallets).values({
      providerId: hiraProvider.id,
      balance: '14250.00',
      currency: 'NPR',
    });

    // Create service area
    await db.insert(serviceAreas).values({
      providerId: hiraProvider.id,
      label: 'Kathmandu Core & New Road Zone',
      centerLat: '27.704500',
      centerLng: '85.312000',
      radiusMeters: 4000,
      isActive: true,
    });

    // Create cutoff policy (12 hours before scheduled meal)
    await db.insert(cutoffPolicies).values({
      providerId: hiraProvider.id,
      mealType: null, // applies to all
      cutoffOffsetHours: 12,
      timezone: 'Asia/Kathmandu',
    });

    // Create menu and menu items
    const [hiraMenu] = await db
      .insert(menus)
      .values({
        providerId: hiraProvider.id,
        name: 'Weekly Comfort Tiffin Menu',
        description: 'Rotating daily nutritious home-cooked meals.',
        status: 'PUBLISHED',
      })
      .returning();

    await db.insert(menuItems).values([
      {
        menuId: hiraMenu.id,
        name: 'Classic Dal Bhat Tarkari',
        description: 'Basmati rice, slow-cooked yellow dal, seasonal sabzi, saag, and tomato golbheda ko achar.',
        price: '220.00',
        mealType: 'LUNCH',
        availability: true,
        dietaryTags: ['vegetarian', 'wholesome'],
      },
      {
        menuId: hiraMenu.id,
        name: 'Special Chicken Thali',
        description: 'Traditional Nepali chicken curry with aromatic spices, steamed rice, dal, and fresh salad.',
        price: '350.00',
        mealType: 'LUNCH',
        availability: true,
        dietaryTags: ['non-vegetarian', 'high-protein'],
      },
      {
        menuId: hiraMenu.id,
        name: 'Handmade Steamed Chicken Momo (10 pcs)',
        description: 'Juicy spiced minced chicken wrapped in thin dough with homemade sesame-tomato dipping sauce.',
        price: '240.00',
        mealType: 'SNACKS',
        availability: true,
        dietaryTags: ['non-vegetarian', 'comfort-food'],
      },
      {
        menuId: hiraMenu.id,
        name: 'Mixed Veg Fried Chowmein',
        description: 'Wok-tossed noodles with crunchy cabbage, capsicum, carrots, and house spice blend.',
        price: '160.00',
        mealType: 'SNACKS',
        availability: true,
        dietaryTags: ['vegetarian'],
      },
      {
        menuId: hiraMenu.id,
        name: 'Home-Style Roti & Paneer Tarkari',
        description: '3 warm wheat rotis with rich cottage cheese in tomato-cumin gravy.',
        price: '280.00',
        mealType: 'DINNER',
        availability: true,
        dietaryTags: ['vegetarian'],
      },
    ]);
  }

  logger.info('Seed completed successfully!');
  await sqlClient.end();
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});

