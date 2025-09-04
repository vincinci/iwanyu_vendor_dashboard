#!/usr/bin/env node

// Test script for the redesigned image upload system
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const PRODUCTION_URL = 'https://iwanyuvendordashboard-2v8xqw7k1-fasts-projects-5b1e7db1.vercel.app';

async function testImageUpload() {
  console.log('🧪 Testing redesigned image upload system...');
  
  try {
    // Create a simple test image file (1x1 PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xCF, 0xE5, 0x6C, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Write test image
    fs.writeFileSync('test-image.png', testImageBuffer);
    
    // Create FormData
    const formData = new FormData();
    formData.append('image_0', fs.createReadStream('test-image.png'), {
      filename: 'test-upload.png',
      contentType: 'image/png'
    });
    
    console.log('📤 Uploading test image...');
    
    const response = await fetch(`${PRODUCTION_URL}/api/upload-images`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ SUCCESS: Image upload working correctly!');
      console.log('🔗 Uploaded URLs:', result.urls);
    } else {
      console.log('❌ FAILED: Upload returned error');
      console.log('💥 Error:', result.error || 'Unknown error');
    }
    
    // Cleanup
    fs.unlinkSync('test-image.png');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Test health endpoint first
async function testHealth() {
  console.log('🏥 Testing health endpoint...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/health`);
    const result = await response.json();
    
    console.log('📊 Health Status:', response.status);
    console.log('📋 Health Response:', JSON.stringify(result, null, 2));
    
    return response.ok;
  } catch (error) {
    console.error('💥 Health check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive upload system test...\n');
  
  const healthOk = await testHealth();
  console.log('');
  
  if (healthOk) {
    await testImageUpload();
  } else {
    console.log('❌ Skipping upload test due to health check failure');
  }
  
  console.log('\n🏁 Test completed!');
}

runTests();
