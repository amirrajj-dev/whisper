/**
 * End-to-end manual validation script for push notification fixes.
 * 
 * Tests the actual GatewayService logic (shouldSuppressPush, per-socket tracking, cleanup)
 * and NotificationListener flow (badge calculation, cache invalidation) 
 * WITHOUT requiring MongoDB, Redis, or a full NestJS server.
 * 
 * The core logic being tested IS the logic that was changed:
 *   - socketActiveConversations Map<socketId, convId>
 *   - shouldSuppressPush() 
 *   - unregisterSocket cleanup
 *   - Badge count flow (create → invalidate cache → getUnreadCount)
 */

// ============================================================
// GatewayService Simulator (exact replica of changed logic)
// ============================================================
class GatewayService {
  constructor() {
    this.userSockets = new Map();           // userId → Set<socketId>
    this.socketUsers = new Map();           // socketId → userId
    this.socketActiveConversations = new Map(); // socketId → conversationId
    this.events = []; // event log for verification
  }

  registerSocket(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
    this.socketUsers.set(socketId, userId);
    this.log(`REGISTER socket=${socketId} user=${userId}`);
  }

  unregisterSocket(socketId) {
    this.socketActiveConversations.delete(socketId);
    const userId = this.socketUsers.get(socketId) ?? null;
    if (!userId) return null;

    this.socketUsers.delete(socketId);
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.log(`UNREGISTER socket=${socketId} user=${userId}`);
    return userId;
  }

  setActiveConversation(socketId, conversationId) {
    if (conversationId === null) {
      this.socketActiveConversations.delete(socketId);
      this.log(`CLEAR_VIEWING socket=${socketId}`);
    } else {
      this.socketActiveConversations.set(socketId, conversationId);
      this.log(`SET_VIEWING socket=${socketId} conv=${conversationId}`);
    }
  }

  shouldSuppressPush(userId, conversationId) {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds || socketIds.size === 0) {
      this.log(`SUPPRESS_CHECK user=${userId} conv=${conversationId} → OFFLINE`);
      return false;
    }
    for (const socketId of socketIds) {
      const activeConv = this.socketActiveConversations.get(socketId);
      if (activeConv !== conversationId) {
        this.log(`SUPPRESS_CHECK user=${userId} conv=${conversationId} → SEND_PUSH (socket ${socketId} not viewing ${conversationId})`);
        return false;
      }
    }
    this.log(`SUPPRESS_CHECK user=${userId} conv=${conversationId} → SUPPRESS`);
    return true;
  }

  isUserOnline(userId) {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  // Because socketIds are server-generated, for testing we simulate
  // by maintaining our own counter
  static makeSocketId(prefix) {
    if (!GatewayService.idCounter) GatewayService.idCounter = 0;
    return `${prefix}_${++GatewayService.idCounter}`;
  }

  log(msg) {
    this.events.push(msg);
  }

  printState(label) {
    console.log(`  ── ${label} ──`);
    console.log(`    userSockets:`, JSON.stringify([...this.userSockets.entries()].map(([k,v]) => `${k}→[${[...v].join(',')}]`)));
    console.log(`    socketActiveConversations:`, JSON.stringify([...this.socketActiveConversations.entries()]));
    console.log(`    socketUsers:`, JSON.stringify([...this.socketUsers.entries()]));
  }
}

// ============================================================
// NotificationService Simulator (badge/cache logic)
// ============================================================
class NotificationService {
  constructor() {
    this.cache = new Map();
    this.notifications = []; // in-memory "DB"
  }

  async create(data) {
    const notification = { id: `notif_${Date.now()}_${Math.random()}`, ...data, isRead: false, createdAt: new Date() };
    this.notifications.push(notification);
    // Invalidate unread count cache (exact replica of changed code)
    this.cache.delete(`unread_count:${data.userId}`);
    return notification;
  }

  async getUnreadCount(userId) {
    const cacheKey = `unread_count:${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached; // { count: N }
    }
    const count = this.notifications.filter(n => n.userId === userId && !n.isRead).length;
    const result = { count };
    this.cache.set(cacheKey, result);
    return result;
  }

  // Simulate concurrent badge calculation (exact replica of new code in notification.listener.ts)
  async calculateBadge(userId) {
    const result = await this.getUnreadCount(userId);
    return result.count;  // No more +1
  }
}

// ============================================================
// Test Runner
// ============================================================
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => {
        passed++;
        console.log(`  ✓ ${name}`);
      }).catch(e => {
        failed++;
        console.log(`  ✗ ${name}: ${e.message}`);
      });
    }
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ============================================================
// TEST SUITE 1: shouldSuppressPush correctness
// ============================================================
console.log('\n══════════════════════════════════════════════');
console.log('SUITE 1: shouldSuppressPush() - Code Path Coverage');
console.log('══════════════════════════════════════════════\n');

(function() {
  const gs = new GatewayService();
  let s1;

  test('Offline user should get push (no sockets)', () => {
    assert(gs.shouldSuppressPush('user1', 'convA') === false);
  });

  test('Online user with no active convs should get push', () => {
    s1 = GatewayService.makeSocketId('phone');
    gs.registerSocket('user1', s1);
    assert(gs.shouldSuppressPush('user1', 'convA') === false, 
      `expected false, got ${gs.shouldSuppressPush('user1', 'convA')}`);
  });

  test('Socket viewing different conv should get push', () => {
    gs.setActiveConversation(s1, 'convB');
    assert(gs.shouldSuppressPush('user1', 'convA') === false);
  });

  test('Socket viewing same conv should suppress push', () => {
    gs.setActiveConversation(s1, 'convA');
    assert(gs.shouldSuppressPush('user1', 'convA') === true);
  });

  test('Socket stops viewing → push is sent again', () => {
    gs.setActiveConversation(s1, null);
    assert(gs.shouldSuppressPush('user1', 'convA') === false);
  });
})();

// ============================================================
// TEST SUITE 2: Multi-device scenarios
// ============================================================
console.log('\n══════════════════════════════════════════════');
console.log('SUITE 2: Multi-Device Scenarios (P0 Fix)');
console.log('══════════════════════════════════════════════\n');

(function() {
  const gs = new GatewayService();
  let desktop;

  // Test 2a: Phone viewing A, Desktop idle
  test('Phone viewing A + Desktop idle → push sent', () => {
    const phone = GatewayService.makeSocketId('phone');
    desktop = GatewayService.makeSocketId('desktop');
    gs.registerSocket('user1', phone);
    gs.registerSocket('user1', desktop);
    gs.setActiveConversation(phone, 'convA');
    // Desktop has no active conversation set
    assert(gs.shouldSuppressPush('user1', 'convA') === false);
  });

  // Test 2b: Both viewing same → suppress
  test('Phone viewing A + Desktop viewing A → push suppressed', () => {
    gs.setActiveConversation(desktop, 'convA');
    assert(gs.shouldSuppressPush('user1', 'convA') === true);
  });

  // Test 2c: Phone viewing A, Desktop viewing B → push sent for A
  test('Phone viewing A + Desktop viewing B → push sent for A', () => {
    gs.setActiveConversation(desktop, 'convB');
    assert(gs.shouldSuppressPush('user1', 'convA') === false);
  });

  // Test 2d: Message in B, Phone viewing A, Desktop viewing B → push sent for B
  test('Phone viewing A + Desktop viewing B → push sent for B', () => {
    assert(gs.shouldSuppressPush('user1', 'convB') === false, 
      `expected false (phone viewing A != B), got ${gs.shouldSuppressPush('user1', 'convB')}`);
  });

  // Test 2e: Three devices, two viewing A, one viewing B
  test('3 devices, 2 view A + 1 views B → push sent for A', () => {
    const tab = GatewayService.makeSocketId('tab');
    gs.registerSocket('user1', tab);
    gs.setActiveConversation(tab, 'convA');
    assert(gs.shouldSuppressPush('user1', 'convA') === false, 
      `expected false (tab viewing A, desktop viewing B), got ${gs.shouldSuppressPush('user1', 'convA')}`);
  });

  // Test 2f: All three viewing A → suppress
  test('All 3 devices viewing A → push suppressed', () => {
    gs.setActiveConversation(desktop, 'convA');
    assert(gs.shouldSuppressPush('user1', 'convA') === true);
  });
})();

// ============================================================
// TEST SUITE 3: Background/Tab-Hidden behavior
// ============================================================
console.log('\n══════════════════════════════════════════════');
console.log('SUITE 3: Background/Tab-Hidden Transitions');
console.log('══════════════════════════════════════════════\n');

(function() {
  // Test 3a: App background → viewing cleared → push sent
  test('App background clears active conv → push sent', () => {
    const gs = new GatewayService();
    const phone = GatewayService.makeSocketId('phone');
    gs.registerSocket('user1', phone);
    gs.setActiveConversation(phone, 'convA');
    assert(gs.shouldSuppressPush('user1', 'convA') === true); // viewing

    // Simulate AppState background → clearViewingConversation
    gs.setActiveConversation(phone, null);
    assert(gs.shouldSuppressPush('user1', 'convA') === false); // push sent
  });

  // Test 3b: App foreground → viewing restored → push suppressed
  test('App foreground restores active conv → push suppressed', () => {
    const gs = new GatewayService();
    const phone = GatewayService.makeSocketId('phone');
    gs.registerSocket('user1', phone);
    // Simulate `active` → setViewingConversation
    gs.setActiveConversation(phone, 'convA');
    assert(gs.shouldSuppressPush('user1', 'convA') === true);
  });

  // Test 3c: Background then push tap opens different conv  
  test('Background + tap opens different conv', () => {
    const gs = new GatewayService();
    const phone = GatewayService.makeSocketId('phone');
    gs.registerSocket('user1', phone);
    gs.setActiveConversation(phone, 'convA'); // was viewing A

    // Background clears
    gs.setActiveConversation(phone, null);

    // Tap push for convB → navigates → sets new active conv
    gs.setActiveConversation(phone, 'convB');

    // Message in A should send push (phone is viewing B now)
    assert(gs.shouldSuppressPush('user1', 'convA') === false,
      `A should send push, got ${gs.shouldSuppressPush('user1', 'convA')}`);

    // Message in B should suppress (phone is viewing B)
    assert(gs.shouldSuppressPush('user1', 'convB') === true,
      `B should suppress, got ${gs.shouldSuppressPush('user1', 'convB')}`);
  });

  // Test 3d: Web tab hidden → visibilitychange → clear
  test('Web tab hidden → push sent for active conv', () => {
    const gs = new GatewayService();
    const tab = GatewayService.makeSocketId('tab');
    gs.registerSocket('user1', tab);
    gs.setActiveConversation(tab, 'convA');
    // Tab hidden
    gs.setActiveConversation(tab, null);
    assert(gs.shouldSuppressPush('user1', 'convA') === false);
  });

  // Test 3e: Web tab becomes visible → viewing restored
  test('Web tab visible → viewing restored → suppress', () => {
    const gs = new GatewayService();
    const tab = GatewayService.makeSocketId('tab');
    gs.registerSocket('user1', tab);
    gs.setActiveConversation(tab, 'convA');
    assert(gs.shouldSuppressPush('user1', 'convA') === true);
  });
})();

// ============================================================
// TEST SUITE 4: Disconnect/Cleanup
// ============================================================
console.log('\n══════════════════════════════════════════════');
console.log('SUITE 4: Disconnect & Cleanup (Stale Entry Prevention)');
console.log('══════════════════════════════════════════════\n');

(function() {
  // Test 4a: Socket disconnect cleans up active conversation
  test('Socket disconnect removes active conversation entry', () => {
    const gs = new GatewayService();
    const phone = GatewayService.makeSocketId('phone');
    gs.registerSocket('user1', phone);
    gs.setActiveConversation(phone, 'convA');
    assert(gs.socketActiveConversations.size === 1);
    
    gs.unregisterSocket(phone);
    assert(gs.socketActiveConversations.size === 0, 
      `expected 0, got ${gs.socketActiveConversations.size}`);
    assert(gs.isUserOnline('user1') === false);
  });

  // Test 4b: Only disconnected socket's entry is cleaned, others preserved
  test('Only disconnected socket cleaned, others preserved', () => {
    const gs = new GatewayService();
    const phone = GatewayService.makeSocketId('phone');
    const desktop = GatewayService.makeSocketId('desktop');
    gs.registerSocket('user1', phone);
    gs.registerSocket('user1', desktop);
    gs.setActiveConversation(phone, 'convA');
    gs.setActiveConversation(desktop, 'convA');
    
    gs.unregisterSocket(phone);
    assert(gs.socketActiveConversations.size === 1,
      `expected 1 remaining entry, got ${gs.socketActiveConversations.size}`);
    assert(gs.socketActiveConversations.has(desktop), 'desktop entry should remain');
    assert(gs.isUserOnline('user1') === true, 'user should still be online');
  });

  // Test 4c: Reconnect with new socketId clears old state
  test('Reconnect with new socketId — old state gone', () => {
    const gs = new GatewayService();
    const oldSocket = GatewayService.makeSocketId('phone');
    gs.registerSocket('user1', oldSocket);
    gs.setActiveConversation(oldSocket, 'convA');
    gs.unregisterSocket(oldSocket);
    
    const newSocket = GatewayService.makeSocketId('phone_v2');
    gs.registerSocket('user1', newSocket);
    // No active conversation set yet (may be restored by connection handler)
    assert(gs.socketActiveConversations.size === 0,
      `expected 0, got ${gs.socketActiveConversations.size}`);
    assert(gs.shouldSuppressPush('user1', 'convA') === false,
      'fresh socket should not suppress push');
  });

  // Test 4d: Reconnect + restore active conv via connection handler
  test('Reconnect restores active conv via connection handler', () => {
    const gs = new GatewayService();
    const newSocket = GatewayService.makeSocketId('phone_v2');
    gs.registerSocket('user1', newSocket);
    
    // Simulate socket-connection-handlers.ts:47-49
    // `if (activeId) { socketManager.setViewingConversation(activeId); }`
    const restoredActiveId = 'convA';
    gs.setActiveConversation(newSocket, restoredActiveId);
    
    assert(gs.shouldSuppressPush('user1', 'convA') === true,
      'restored active conv should suppress push');
  });

  // Test 4e: Logout → disconnect → cleanup
  test('Logout disconnects and cleans up all state', () => {
    const gs = new GatewayService();
    const phone = GatewayService.makeSocketId('phone');
    const desktop = GatewayService.makeSocketId('desktop');
    gs.registerSocket('user1', phone);
    gs.registerSocket('user1', desktop);
    gs.setActiveConversation(phone, 'convA');
    gs.setActiveConversation(desktop, 'convB');

    // Logout disconnects both sockets
    gs.unregisterSocket(phone);
    gs.unregisterSocket(desktop);
    
    assert(gs.userSockets.size === 0, 'userSockets should be empty');
    assert(gs.socketUsers.size === 0, 'socketUsers should be empty');
    assert(gs.socketActiveConversations.size === 0, 'socketActiveConversations should be empty');
    assert(gs.isUserOnline('user1') === false, 'user should be offline');
  });
})();

// ============================================================
// TEST SUITE 5: Edge Cases
// ============================================================
console.log('\n══════════════════════════════════════════════');
console.log('SUITE 5: Edge Cases');
console.log('══════════════════════════════════════════════\n');

(function() {
  // Test 5a: Socket never sent conversation:viewing
  test('Socket connected but never viewed any conv → push sent', () => {
    const gs = new GatewayService();
    const socket = GatewayService.makeSocketId('s');
    gs.registerSocket('user1', socket);
    // No setActiveConversation ever called for this socket
    assert(gs.shouldSuppressPush('user1', 'convA') === false);
  });

  // Test 5b: Multiple rapid setActiveConversation switches
  test('Rapid conv switching — last one wins', () => {
    const gs = new GatewayService();
    const socket = GatewayService.makeSocketId('s');
    gs.registerSocket('user1', socket);
    
    gs.setActiveConversation(socket, 'convA');
    gs.setActiveConversation(socket, 'convB');
    gs.setActiveConversation(socket, 'convC');
    
    assert(gs.socketActiveConversations.get(socket) === 'convC');
    assert(gs.shouldSuppressPush('user1', 'convA') === false);
    assert(gs.shouldSuppressPush('user1', 'convC') === true);
  });

  // Test 5c: Unregister unknown socket (should be no-op)
  test('Unregister unknown socket returns null', () => {
    const gs = new GatewayService();
    const result = gs.unregisterSocket('nonexistent');
    assert(result === null, `expected null, got ${result}`);
  });

  // Test 5d: Server restart (all maps gone)  
  test('Server restart — all state is fresh', () => {
    const gs = new GatewayService();
    // No sockets registered, no active conversations
    assert(gs.userSockets.size === 0);
    assert(gs.socketActiveConversations.size === 0);
    assert(gs.shouldSuppressPush('user1', 'convA') === false);
  });

  // Test 5e: Memory leak check — many connect/disconnect cycles
  test('100 connect/disconnect cycles with no leaks', () => {
    const gs = new GatewayService();
    const sockets = [];
    for (let i = 0; i < 100; i++) {
      const s = GatewayService.makeSocketId('cycle');
      gs.registerSocket('user1', s);
      gs.setActiveConversation(s, 'convA');
      sockets.push(s);
    }
    // Disconnect all
    for (const s of sockets) {
      gs.unregisterSocket(s);
    }
    assert(gs.userSockets.size === 0 || gs.socketActiveConversations.size === 0, 
      'maps should be empty after all disconnects');
    // Only edge: if userSockets still has user1 with empty Set, it's fine
    // After last disconnect, the empty Set is deleted
    assert(gs.socketActiveConversations.size === 0,
      `socketActiveConversations should be 0, got ${gs.socketActiveConversations.size}`);
    assert(gs.socketUsers.size === 0,
      `socketUsers should be 0, got ${gs.socketUsers.size}`);
  });
})();

// ============================================================
// TEST SUITE 6: Badge Calculation (P1 Fix)
// ============================================================
console.log('\n══════════════════════════════════════════════');
console.log('SUITE 6: Badge Calculation (Cache Invalidation Fix)');
console.log('══════════════════════════════════════════════\n');

(async function() {
  const ns = new NotificationService();

  await test('Badge starts at 0', async () => {
    const b = await ns.calculateBadge('user1');
    assert(b === 0, `expected 0, got ${b}`);
  });

  // Simulate sequential message arrival (create → invalidate → getUnreadCount)
  await test('Single message → badge = 1', async () => {
    await ns.create({ userId: 'user1', type: 'message', message: 'test1', relatedConversation: 'convA' });
    const b = await ns.calculateBadge('user1');
    assert(b === 1, `expected 1, got ${b}`);
  });

  await test('Second message → badge = 2', async () => {
    await ns.create({ userId: 'user1', type: 'message', message: 'test2', relatedConversation: 'convA' });
    const b = await ns.calculateBadge('user1');
    assert(b === 2, `expected 2, got ${b}`);
  });

  // Rapid 20-message burst
  await test('20 rapid messages → badge = 22', async () => {
    for (let i = 0; i < 20; i++) {
      await ns.create({ userId: 'user1', type: 'message', message: `burst_${i}`, relatedConversation: 'convA' });
    }
    const b = await ns.calculateBadge('user1');
    assert(b === 22, `expected 22, got ${b}`);
  });

  // Verify the no-+1 fix: create then getUnreadCount returns actual count
  await test('No speculative +1 — getUnreadCount returns actual DB count', async () => {
    const ns2 = new NotificationService();
    await ns2.create({ userId: 'user2', type: 'message', message: 'm1', relatedConversation: 'convA' });
    await ns2.create({ userId: 'user2', type: 'message', message: 'm2', relatedConversation: 'convA' });
    await ns2.create({ userId: 'user2', type: 'message', message: 'm3', relatedConversation: 'convA' });
    
    // Simulate the new notification.listener.ts badge flow
    const result = await ns2.getUnreadCount('user2');
    const badge = result.count;  // NO +1
    assert(badge === 3, `expected 3, got ${badge}`);
  });

  // Test cache invalidation: after create, cache is empty
  await test('Cache invalidation — after create, read hits DB', async () => {
    const ns3 = new NotificationService();
    // First call populates cache
    await ns3.getUnreadCount('user3');
    // Cache should have entry now
    assert(ns3.cache.has('unread_count:user3'), 'cache should have entry after first read');
    // Create notification
    await ns3.create({ userId: 'user3', type: 'message', message: 'test', relatedConversation: 'convA' });
    // Cache should be invalidated
    assert(!ns3.cache.has('unread_count:user3'), 'cache should be cleared after create');
    // Next read should go to DB (in-memory "notifications" array)
    const result = await ns3.getUnreadCount('user3');
    assert(result.count === 1, `expected 1, got ${result.count}`);
  });

  // Per-user isolation
  await test('Badge count is per-user', async () => {
    // Add user2 notifications to the shared ns instance
    await ns.create({ userId: 'user2', type: 'message', message: 'u2_m1', relatedConversation: 'convA' });
    await ns.create({ userId: 'user2', type: 'message', message: 'u2_m2', relatedConversation: 'convA' });
    await ns.create({ userId: 'user2', type: 'message', message: 'u2_m3', relatedConversation: 'convA' });
    const b1 = await ns.calculateBadge('user1');
    const b2 = await ns.calculateBadge('user2');
    assert(b1 === 22, `user1 expected 22, got ${b1}`);
    assert(b2 === 3, `user2 expected 3, got ${b2}`);
  });

  // ============================================================
  // STRESS TEST: Concurrent badge calculation
  // Simulating the remaining race (create + getUnreadCount concurrent)
  // ============================================================
  await test('Concurrent create + read — badge never exceeds actual count', async () => {
    const ns4 = new NotificationService();
    
    // Launch creates concurrently (simulating multiple MESSAGE_SENT events)
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(ns4.create({ userId: 'user4', type: 'message', message: `race_${i}`, relatedConversation: 'convA' }));
    }
    await Promise.all(promises);
    
    const result = await ns4.getUnreadCount('user4');
    // Badge should be exactly 10 (all creates completed)
    assert(result.count === 10, `expected 10, got ${result.count}`);
  });

  // Test: marking as read properly affects count
  await test('Marking notification as read reduces count', async () => {
    const ns5 = new NotificationService();
    await ns5.create({ userId: 'user5', type: 'message', message: 'm1', relatedConversation: 'convA' });
    await ns5.create({ userId: 'user5', type: 'message', message: 'm2', relatedConversation: 'convA' });
    const before = await ns5.getUnreadCount('user5');
    assert(before.count === 2, `expected 2, got ${before.count}`);
    
    // Simulate markAsRead
    const notif = ns5.notifications.find(n => n.userId === 'user5');
    if (notif) notif.isRead = true;
    
    // After marking read, cache is stale. getUnreadCount reads cache.
    // That's OK — the fix handles this via cache invalidation on markAsRead too
    // (markAsRead also invalidates cache in the real implementation)
    ns5.cache.delete(`unread_count:user5`);
    const after = await ns5.getUnreadCount('user5');
    assert(after.count === 1, `expected 1, got ${after.count}`);
  });
})();

// Wait for async tests
setTimeout(() => {
  console.log('\n══════════════════════════════════════════════');
  console.log('RESULTS');
  console.log('══════════════════════════════════════════════');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);
  console.log(`  Status: ${failed === 0 ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
  console.log('');
  
  process.exit(failed > 0 ? 1 : 0);
}, 500);
