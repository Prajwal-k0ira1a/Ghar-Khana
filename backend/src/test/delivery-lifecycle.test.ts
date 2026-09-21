import {
  canTransitionDelivery,
  mirrorOccurrenceStatus,
  TERMINAL_DELIVERY_STATUSES,
} from '../modules/deliveries/delivery.service.js';

async function runDeliveryLifecycleTests() {
  console.log('🚚 Starting GharKhana Phase 5: Delivery Lifecycle Tests...\n');

  // TEST 1: Happy-path transition chain
  console.log('[Test 1] Happy-path status chain');
  const chain: Array<[string, string]> = [
    ['PENDING', 'ASSIGNED'],
    ['ASSIGNED', 'PICKED_UP'],
    ['PICKED_UP', 'OUT_FOR_DELIVERY'],
    ['OUT_FOR_DELIVERY', 'DELIVERED'],
  ];
  for (const [from, to] of chain) {
    if (!canTransitionDelivery(from, to)) {
      throw new Error(`Expected transition ${from} -> ${to} to be allowed`);
    }
  }
  console.log('✓ PENDING → ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED verified\n');

  // TEST 2: Direct ASSIGNED → DELIVERED shortcut (API_SPEC §15 has no out-for-delivery endpoint)
  console.log('[Test 2] Partner shortcut ASSIGNED → DELIVERED');
  if (!canTransitionDelivery('ASSIGNED', 'DELIVERED')) {
    throw new Error('ASSIGNED → DELIVERED shortcut must be allowed');
  }
  console.log('✓ Shortcut transition allowed\n');

  // TEST 3: Terminal states are sinks
  console.log('[Test 3] Terminal states accept no further transitions');
  for (const terminal of TERMINAL_DELIVERY_STATUSES) {
    for (const target of ['ASSIGNED', 'PICKED_UP', 'DELIVERED', 'FAILED', 'CANCELLED']) {
      if (canTransitionDelivery(terminal, target)) {
        throw new Error(`Terminal ${terminal} must not transition to ${target}`);
      }
    }
  }
  console.log('✓ DELIVERED / FAILED / CANCELLED are terminal sinks\n');

  // TEST 4: Failure reachable from every non-terminal state
  console.log('[Test 4] FAILED reachable pre-delivery');
  for (const from of ['PENDING', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY']) {
    if (!canTransitionDelivery(from, 'FAILED')) {
      throw new Error(`${from} must be able to transition to FAILED`);
    }
  }
  console.log('✓ Failure handling reachable from all active states\n');

  // TEST 5: Occurrence mirror mapping
  console.log('[Test 5] Delivery → occurrence status mirror');
  const mirrors: Array<[string, string | null]> = [
    ['PICKED_UP', 'PICKED_UP'],
    ['DELIVERED', 'DELIVERED'],
    ['FAILED', 'FAILED'],
    ['CANCELLED', 'CANCELLED'],
    ['PENDING', null],
    ['ASSIGNED', null],
    ['OUT_FOR_DELIVERY', null],
  ];
  for (const [delivery, expected] of mirrors) {
    const actual = mirrorOccurrenceStatus(delivery);
    if (actual !== expected) {
      throw new Error(`Mirror mismatch for ${delivery}: expected ${expected}, got ${actual}`);
    }
  }
  console.log('✓ Occurrence stays the canonical customer-facing status\n');

  console.log('🎉 ALL PHASE 5 DELIVERY LIFECYCLE TESTS PASSED!\n');
}

runDeliveryLifecycleTests().catch((err) => {
  console.error('❌ Delivery lifecycle tests failed:', err);
  process.exit(1);
});
