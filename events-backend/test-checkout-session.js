#!/usr/bin/env node

/**
 * Test script for WooShPay Checkout Sessions
 * This script helps you test the checkout session functionality
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Adjust to your server URL
const WOOSHPAY_TEST_API = 'https://apitest.wooshpay.com';

// Test data
const testData = {
    // Test with the exact format that worked for you
    directWooShPayTest: {
        cancel_url: "https://yourwebsite.com",
        mode: "payment",
        success_url: "https://yourwebsite.com",
        line_items: [
            {
                price_data: {
                    currency: "USD", // Changed from GBP to USD for consistency
                    unit_amount: 2000, // $20.00
                    product_data: {
                        name: "Test Event Registration"
                    }
                },
                quantity: 1
            }
        ]
    },
    
    // Test via your API endpoint
    apiEndpointTest: {
        amount: 20.00,
        currency: "USD",
        productName: "Event Registration Test",
        success_url: "https://yourwebsite.com/success",
        cancel_url: "https://yourwebsite.com/cancel"
    }
};

async function testDirectWooShPay() {
    console.log('\n🧪 Testing Direct WooShPay API Call...');
    console.log('=' .repeat(50));
    
    try {
        // Check if API key is provided
        const apiKey = process.env.WOOSHPay_API_KEY;
        
        if (!apiKey || apiKey === 'your-api-key-here') {
            console.log('⚠️  WooShPay API Key not configured!');
            console.log('📝 Please set your WooShPay API key:');
            console.log('   1. Create .env file in events-backend folder');
            console.log('   2. Add: WOOSHPay_API_KEY=your_actual_secret_key');
            console.log('   3. Add: WOOSHPay_TEST_MODE=true');
            console.log('   4. Get your API key from WooShPay dashboard');
            return null;
        }
        
        const basicAuth = Buffer.from(`${apiKey}:`).toString('base64');
        console.log('🔑 Using API Key:', `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
        console.log('🔐 Basic Auth:', `Basic ${basicAuth.substring(0, 20)}...`);
        
        const response = await axios.post(
            `${WOOSHPAY_TEST_API}/v1/checkout/sessions`,
            testData.directWooShPayTest,
            {
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        
        console.log('✅ Direct API call successful!');
        console.log('Session ID:', response.data.id);
        console.log('Payment URL:', response.data.url);
        console.log('Status:', response.data.status);
        console.log('\n🎯 Test Cards:');
        console.log('✅ Success: 4111111111111111 (Exp: 12/25, CVV: 123)');
        console.log('❌ Decline: 4000000000000002 (Exp: 12/25, CVV: 123)');
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Direct API call failed:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

async function testViaYourAPI() {
    console.log('\n🚀 Testing via Your API Endpoint...');
    console.log('=' .repeat(50));
    
    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/checkout/test-checkout-session`,
            testData.apiEndpointTest
        );
        
        console.log('✅ Your API call successful!');
        console.log('Session ID:', response.data.data.id);
        console.log('Payment URL:', response.data.data.url);
        console.log('Status:', response.data.data.status);
        console.log('Test Cards:', response.data.testCards);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Your API call failed:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

async function runTests() {
    console.log('🎯 WooShPay Checkout Session Test Suite');
    console.log('=' .repeat(50));
    
    // Test 1: Direct WooShPay API (your working example)
    const directResult = await testDirectWooShPay();
    
    // Test 2: Via your API endpoint
    const apiResult = await testViaYourAPI();
    
    console.log('\n📊 Test Summary:');
    console.log('=' .repeat(50));
    console.log('Direct WooShPay API:', directResult ? '✅ PASSED' : '❌ FAILED');
    console.log('Your API Endpoint:', apiResult ? '✅ PASSED' : '❌ FAILED');
    
    if (directResult && apiResult) {
        console.log('\n🎉 All tests passed! Your checkout session integration is working correctly.');
        console.log('\n💡 Next Steps:');
        console.log('1. Use the payment URL to test with the provided test cards');
        console.log('2. Implement webhook handling for payment completion');
        console.log('3. Test the full checkout flow with your frontend');
    } else {
        console.log('\n⚠️  Some tests failed. Check the errors above and your configuration.');
    }
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testDirectWooShPay, testViaYourAPI, runTests };
