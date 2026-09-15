import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';
import { env } from '../shared/config/env.js';

async function runTests() {
  console.log('🚀 Starting GharKhana Backend Foundation & API Tests...');

  const app = createApp();
  let server: any = null;
  let baseUrl = '';

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server?.address();
      const port = typeof addr === 'object' && addr ? addr.port : 4000;
      baseUrl = `http://localhost:${port}/api/v1`;
      resolve();
    });
  });

  try {
    // 1. Health Check Test
    console.log('\n[Test 1] Health Check Endpoint');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = (await healthRes.json()) as any;
    console.log(`Status: ${healthRes.status}, Body:`, healthData);
    if (healthRes.status !== 200 || healthData.status !== 'ok') {
      throw new Error('Health check failed');
    }
    console.log('✓ Health check passed');

    // 2. 404 Unknown Route Test
    console.log('\n[Test 2] 404 Unknown Route Handling');
    const notFoundRes = await fetch(`${baseUrl}/unknown-route`);
    const notFoundData = (await notFoundRes.json()) as any;
    console.log(`Status: ${notFoundRes.status}, Error:`, notFoundData);
    if (notFoundRes.status !== 404 || notFoundData.error?.code !== 'RESOURCE_NOT_FOUND') {
      throw new Error('404 handling failed');
    }
    console.log('✓ 404 handling passed with standardized JSON envelope');

    // 3. Validation Error on Malformed Register Body
    console.log('\n[Test 3] Validation Error (Malformed Registration Payload)');
    const badRegisterRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A', // Too short (min 2)
        phone: 'invalid-phone', // Bad regex
        password: 'short', // Too short (min 8)
      }),
    });
    const badRegisterData = (await badRegisterRes.json()) as any;
    console.log(`Status: ${badRegisterRes.status}, Error:`, badRegisterData);
    if (badRegisterRes.status !== 400 || badRegisterData.error?.code !== 'VALIDATION_ERROR') {
      throw new Error('Validation error handling failed');
    }
    console.log('✓ Validation error returned code 400 with details');

    // 4. Validation Error on Empty Login
    console.log('\n[Test 4] Validation Error (Empty Login Payload)');
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const badLoginData = (await badLoginRes.json()) as any;
    console.log(`Status: ${badLoginRes.status}, Error:`, badLoginData);
    if (badLoginRes.status !== 400) {
      throw new Error('Login validation failed');
    }
    console.log('✓ Login validation passed');

    // 5. Auth Middleware Protection on /users/me
    console.log('\n[Test 5] Authentication Guard on Protected Route');
    const unauthRes = await fetch(`${baseUrl}/users/me`);
    const unauthData = (await unauthRes.json()) as any;
    console.log(`Status: ${unauthRes.status}, Error:`, unauthData);
    if (unauthRes.status !== 401 || unauthData.error?.code !== 'TOKEN_MISSING') {
      throw new Error('Protected route unauthorized check failed');
    }
    console.log('✓ Protected route correctly rejects unauthenticated request with 401 TOKEN_MISSING');

    // 6. JWT Token Generation & Verification
    console.log('\n[Test 6] JWT Token Sign & Verification');
    const testPayload = { sub: 'usr_test_123', role: 'CUSTOMER', email: 'test@gharkhana.app' };
    const testToken = jwt.sign(testPayload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const verified = jwt.verify(testToken, env.JWT_ACCESS_SECRET) as typeof testPayload;
    if (verified.sub !== testPayload.sub || verified.role !== 'CUSTOMER') {
      throw new Error('JWT verification failed');
    }
    console.log('✓ JWT access token successfully generated and verified');

    console.log('\n🎉 ALL FOUNDATION TESTS PASSED CLEANLY!\n');
  } finally {
    server?.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
