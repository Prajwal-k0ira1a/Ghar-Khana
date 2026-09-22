import {
  shouldPushNow,
  kathmanduHour,
} from '../modules/notifications/notification.service.js';
import { __test__ as reviewTest } from '../modules/reviews/review.service.js';
import {
  createReviewSchema,
  deliveryFailureSchema,
  registerDeviceTokenSchema,
  createDisputeSchema,
} from '@gharkhana/validation';

async function runTrustCommsTests() {
  console.log('🔔 Starting GharKhana Phase 6/7: Notifications & Reviews Tests...\n');

  // TEST 1: HIGH priority bypasses quiet hours
  console.log('[Test 1] HIGH priority exempt from quiet hours');
  // 02:30 UTC = 08:15 Kathmandu (inside allowed window); 17:00 UTC = 22:45 Kathmandu (quiet)
  const quietTime = new Date('2026-10-06T17:00:00Z');
  if (kathmanduHour(quietTime) < 22) {
    throw new Error(`Expected 22:xx Kathmandu hour, got ${kathmanduHour(quietTime)}`);
  }
  if (!shouldPushNow('HIGH', quietTime)) {
    throw new Error('HIGH priority must push during quiet hours');
  }
  if (shouldPushNow('NORMAL', quietTime) || shouldPushNow('LOW', quietTime)) {
    throw new Error('NORMAL/LOW must be held during 22:00–07:00 Kathmandu quiet hours');
  }
  console.log('✓ Quiet-hours exemption verified (HIGH pushes, NORMAL/LOW held)\n');

  // TEST 2: Daytime delivery allowed for all priorities
  console.log('[Test 2] Daytime push allowed');
  const dayTime = new Date('2026-10-06T04:00:00Z'); // 09:45 Kathmandu
  for (const p of ['HIGH', 'NORMAL', 'LOW'] as const) {
    if (!shouldPushNow(p, dayTime)) throw new Error(`${p} must push at 09:45 Kathmandu`);
  }
  console.log('✓ All priorities push during daytime window\n');

  // TEST 3: Review rating aggregation
  console.log('[Test 3] Provider rating aggregation');
  if (reviewTest.average([5, 4, 5]) !== '4.7') {
    throw new Error(`Expected 4.7, got ${reviewTest.average([5, 4, 5])}`);
  }
  if (reviewTest.average([]) !== null) throw new Error('Empty ratings must yield null');
  if (reviewTest.average([3]) !== '3.0') throw new Error('Single rating mismatch');
  console.log('✓ Denormalized rating average correct\n');

  // TEST 4: Review schema guards
  console.log('[Test 4] Review validation guards');
  const bad = createReviewSchema.safeParse({
    subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
    rating: 6,
  });
  if (bad.success) throw new Error('Rating 6 must be rejected');
  const good = createReviewSchema.safeParse({
    subscriptionId: '550e8400-e29b-41d4-a716-446655440000',
    rating: 5,
    comment: 'Great dal bhat!',
  });
  if (!good.success) throw new Error('Valid review must parse');
  console.log('✓ Rating bounds 1–5 enforced\n');

  // TEST 5: Delivery failure schema
  console.log('[Test 5] Delivery failure reason enum');
  const failBad = deliveryFailureSchema.safeParse({ failureReason: 'RAIN' });
  if (failBad.success) throw new Error('Unknown failure reason must be rejected');
  const failGood = deliveryFailureSchema.safeParse({
    failureReason: 'CUSTOMER_UNAVAILABLE',
    deliveryNotes: 'Gate locked',
  });
  if (!failGood.success) throw new Error('Valid failure payload must parse');
  console.log('✓ Failure reasons constrained to DELIVERY.md §7 set\n');

  // TEST 6: Device token + dispute schemas
  console.log('[Test 6] Device token & dispute schemas');
  const tokenBad = registerDeviceTokenSchema.safeParse({
    expoPushToken: 'ExponentPushToken[abc]',
    platform: 'WEB',
  });
  if (tokenBad.success) throw new Error('WEB platform must be rejected');
  const disputeBad = createDisputeSchema.safeParse({
    subscriptionId: 'not-a-uuid',
    category: 'QUALITY',
  });
  if (disputeBad.success) throw new Error('Non-UUID subscription must be rejected');
  console.log('✓ Schema guards hold\n');

  console.log('🎉 ALL PHASE 6/7 NOTIFICATION & REVIEW TESTS PASSED!\n');
}

runTrustCommsTests().catch((err) => {
  console.error('❌ Trust & comms tests failed:', err);
  process.exit(1);
});
