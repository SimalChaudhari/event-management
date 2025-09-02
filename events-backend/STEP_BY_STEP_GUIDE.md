# 🚀 Complete Step-by-Step Guide: QR Code & Scanner System

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Postman installed
- [ ] Backend server running (`npm run start:dev`)
- [ ] Database connected and running
- [ ] Admin user account created
- [ ] Test event created in the system

---

## 🎯 Phase 1: Initial Setup

### Step 1: Start Your Backend Server
```bash
cd events-backend
npm run start:dev
```
**Expected Output:** Server should start on `http://localhost:3000`

### Step 2: Import Postman Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select `postman-collection.json` from your project root
4. Collection "Event QR Code & Scanner System" will appear

### Step 3: Create Environment
1. Click **Environment** dropdown (top right)
2. Click **Create Environment**
3. Name: `Event System`
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `jwtToken` | (leave empty) | (will be filled after login) |
| `userId` | (leave empty) | (will be filled after login) |
| `eventId` | `your-event-id` | `your-event-id` |
| `eventQRCodeId` | (leave empty) | (will be filled after creating QR codes) |
| `scannedUserId` | (leave empty) | (will be filled with another user's ID) |
| `exhibitorQRCodeId` | (leave empty) | (will be filled after creating exhibitor QR code) |

5. Click **Save**
6. Select "Event System" environment from dropdown

---

## 🔐 Phase 2: Authentication

### Step 4: Login as Admin
1. Go to **Authentication > Login**
2. Update request body with your admin credentials:
```json
{
  "email": "admin@example.com",
  "password": "your-admin-password"
}
```
3. Click **Send**
4. **Verify Success:** You should see:
   - Status: `200 OK`
   - Response contains `access_token` and `user` object
   - JWT token automatically saved to environment

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id-123",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

## 🏗️ Phase 3: Admin Setup - Create Event QR Codes

### Step 5: Create Check-in QR Code
1. Go to **Event QR Code Management > Create Event QR Code**
2. Update request body with your event ID:
```json
{
  "eventId": "your-event-id",
  "type": "check_in",
  "title": "Main Entrance Check-in",
  "description": "QR code for main entrance check-in",
  "location": "Main Entrance",
  "allowSelfCheckIn": true,
  "autoRegister": true,
  "redirectToPayment": false,
  "maxScans": 1000
}
```
3. Click **Send**
4. **Copy the returned `id`** - this is your `eventQRCodeId`
5. **Update Environment:** Set `eventQRCodeId` variable with the returned ID

**Expected Response:**
```json
{
  "id": "qr-code-id-123",
  "eventId": "your-event-id",
  "type": "check_in",
  "title": "Main Entrance Check-in",
  "status": "active",
  "createdAt": "2025-01-09T10:00:00.000Z"
}
```

### Step 6: Create Contact Exchange QR Code
1. Go to **Event QR Code Management > Create Contact Exchange QR Code**
2. Update request body:
```json
{
  "eventId": "your-event-id",
  "type": "contact_exchange",
  "title": "Networking Area",
  "description": "QR code for contact exchange",
  "location": "Networking Lounge",
  "allowSelfCheckIn": false,
  "autoRegister": false,
  "redirectToPayment": false
}
```
3. Click **Send**

### Step 7: Create Exhibitor Stamp QR Code
1. Go to **Event QR Code Management > Create Exhibitor Stamp QR Code**
2. Update request body:
```json
{
  "eventId": "your-event-id",
  "type": "exhibitor_stamp",
  "title": "TechCorp Booth",
  "description": "QR code for TechCorp booth stamp collection",
  "location": "Booth A1",
  "allowSelfCheckIn": false,
  "autoRegister": false,
  "redirectToPayment": false
}
```
3. Click **Send**
4. **Copy the returned `id`** - this is your `exhibitorQRCodeId`
5. **Update Environment:** Set `exhibitorQRCodeId` variable

### Step 8: Verify QR Codes Created
1. Go to **Event QR Code Management > Get Event QR Codes**
2. Click **Send**
3. **Verify:** You should see all 3 QR codes listed

---

## 👥 Phase 4: Admin Attendance Management

### Step 9: Get User QR Code
1. Go to **User QR Code > Get User QR Code (Admin)**
2. The `userId` will be automatically filled from login
3. Click **Send**
4. **Verify:** You should get a QR code image and data

### Step 9.5: Generate Simple Event QR Code (New Method)
1. Go to **Event QR Code (Simple) > Generate Simple Event QR Code (Admin)**
2. The `eventId` should be set in your environment
3. Click **Send**
4. **Verify:** You should get an event QR code image and data
5. **Copy the `qrCodeId`** from response to `eventQRCodeId` variable

### Step 10: Test Manual Check-in
1. Go to **Admin Attendance Management > Manual Check-in**
2. Click **Send** (all variables are auto-filled)
3. **Verify Success:** User should be checked in

### Step 11: Test QR Code Scanning
1. Go to **Admin Attendance Management > Scan QR Code for Attendance**
2. Update `qrCodeData` with actual QR code data from Step 9
3. Click **Send**
4. **Verify Success:** Attendance should be recorded

### Step 12: View Attendance Stats
1. Go to **Admin Attendance Management > Get Event Attendance Stats**
2. Click **Send**
3. **Verify:** You should see attendance statistics

---

## 📱 Phase 5: User Self-Service Testing

### Step 13: Test Self Check-in
1. Go to **User Self-Service > Self Check-in**
2. Update `qrCodeData` with the QR code ID from Step 9.5 (e.g., "event_event-123_1700000000000_abc123")
3. Click **Send**
4. **Verify Success:** Self check-in should work
5. **Note:** The system will automatically extract the event ID from the QR code data

### Step 14: Test Contact Exchange
1. Go to **User Self-Service > Contact Exchange**
2. Update `scannedUserId` with another user's ID (you can use the same user for testing)
3. Click **Send**
4. **Verify Success:** Contact exchange should be recorded

### Step 15: Test Exhibitor Stamp Collection
1. Go to **User Self-Service > Collect Exhibitor Stamp**
2. The `exhibitorQRCodeId` should be auto-filled from Step 7
3. Click **Send**
4. **Verify Success:** Stamp should be collected

### Step 16: View User Data
1. Go to **User Self-Service > Get My Contact Exchanges**
2. Click **Send**
3. **Verify:** You should see your contact exchanges

4. Go to **User Self-Service > Get My Exhibitor Stamps**
5. Click **Send**
6. **Verify:** You should see your collected stamps

---

## 🔍 Phase 6: Advanced Testing

### Step 17: Test QR Code Image Generation
1. Go to **Event QR Code Management > Get QR Code Image**
2. Update `qrCodeId` with one of your created QR code IDs
3. Click **Send**
4. **Verify:** You should get a QR code image

### Step 18: Test Check-out
1. Go to **Admin Attendance Management > Check-out User**
2. Click **Send**
3. **Verify Success:** User should be checked out

### Step 19: Test Event Attendance List
1. Go to **Admin Attendance Management > Get Event Attendance**
2. Click **Send**
3. **Verify:** You should see all attendance records

---

## 🧪 Phase 7: Error Testing

### Step 20: Test Invalid QR Code
1. Go to **Admin Attendance Management > Scan QR Code for Attendance**
2. Update `qrCodeData` with invalid data: `"invalid_qr_code"`
3. Click **Send**
4. **Expected:** Should return error message

### Step 21: Test Unauthorized Access
1. Create a new environment without JWT token
2. Try to access admin endpoints
3. **Expected:** Should return 401 Unauthorized

### Step 22: Test Invalid Event ID
1. Update `eventId` to invalid value
2. Try to create QR code
3. **Expected:** Should return error

---

## 📊 Phase 8: Data Verification

### Step 23: Check Database Records
1. Connect to your database
2. Check `event_qr_codes` table - should have 3 records
3. Check `event_attendance` table - should have attendance records
4. Check `contact_exchanges` table - should have contact exchange records
5. Check `exhibitor_stamps` table - should have stamp records

### Step 24: Verify QR Code Functionality
1. Use a QR code scanner app on your phone
2. Scan the QR code images generated
3. **Verify:** QR codes should contain the expected data

---

## 🎯 Phase 9: Mobile App Integration Testing

### Step 25: Test API Endpoints for Mobile
1. **Self Check-in**: `POST /api/attendance/self-check-in`
2. **Contact Exchange**: `POST /api/attendance/contact-exchange`
3. **Exhibitor Stamp**: `POST /api/attendance/exhibitor-stamp`
4. **Get My Data**: `GET /api/attendance/contact-exchanges`

### Step 26: Test Different User Roles
1. Login as different user types (user, exhibitor, speaker)
2. Test appropriate endpoints for each role
3. **Verify:** Role-based access control works

---

## ✅ Phase 10: Final Verification

### Step 27: Complete System Test
1. **Admin Flow:**
   - Create all QR code types ✅
   - Manage attendance ✅
   - View statistics ✅

2. **User Flow:**
   - Self check-in ✅
   - Contact exchange ✅
   - Stamp collection ✅
   - View personal data ✅

3. **Error Handling:**
   - Invalid inputs ✅
   - Unauthorized access ✅
   - Missing data ✅

### Step 28: Performance Check
1. Test with multiple concurrent requests
2. Check response times
3. Verify database performance

---

## 🚨 Troubleshooting Common Issues

### Issue 1: 401 Unauthorized
**Solution:** 
- Check JWT token is set in environment
- Verify token hasn't expired
- Re-login if needed

### Issue 2: 404 Not Found
**Solution:**
- Verify backend is running on correct port
- Check endpoint URLs are correct
- Ensure routes are properly configured

### Issue 3: 400 Bad Request
**Solution:**
- Check request body format
- Verify all required fields are provided
- Check data types match expected format

### Issue 4: Database Errors
**Solution:**
- Check database connection
- Verify tables exist
- Check for enum value mismatches

### Issue 5: Environment Variables Not Working
**Solution:**
- Ensure correct environment is selected
- Check variable names match exactly
- Verify values are set correctly

---

## 📱 Mobile App Integration Notes

### QR Code Scanning
- Use camera library (e.g., react-native-camera, expo-camera)
- Extract QR code data
- Determine QR code type from data format
- Route to appropriate API endpoint

### Error Handling
- Show user-friendly error messages
- Handle network connectivity issues
- Provide offline capabilities where possible

### User Experience
- Show loading states during API calls
- Provide success/error feedback
- Allow retry for failed operations

---

## 🎉 Success Criteria

Your system is working correctly when:

✅ **Admin can:**
- Create event QR codes
- Scan user QR codes for attendance
- Manage attendance manually
- View attendance statistics

✅ **Users can:**
- Self check-in via event QR codes
- Exchange contacts with other users
- Collect exhibitor stamps
- View their personal data

✅ **System handles:**
- Invalid QR codes gracefully
- Unauthorized access properly
- Database operations correctly
- Error responses appropriately

---

## 🔄 Next Steps

After successful testing:

1. **Deploy to staging environment**
2. **Test with real users**
3. **Implement mobile app features**
4. **Add additional security measures**
5. **Optimize performance**
6. **Add monitoring and logging**

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check server logs for detailed error messages
4. Ensure database is properly configured
5. Verify all environment variables are set correctly

**Happy Testing! 🚀**
