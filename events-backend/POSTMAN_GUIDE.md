# 📱 Postman Guide for QR Code & Scanner System

## 🚀 Quick Setup

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select the `postman-collection.json` file from the project root
4. The collection will be imported with all endpoints

### 2. Set Up Environment
1. Click the **Environment** dropdown (top right)
2. Click **Create Environment**
3. Name it "Event System"
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `jwtToken` | (leave empty) | (will be filled after login) |
| `userId` | (leave empty) | (will be filled after login) |
| `eventId` | `your-event-id` | `your-event-id` |

5. Click **Save**

### 3. Start Your Backend
```bash
cd events-backend
npm run start:dev
```

## 🔐 Authentication Flow

### Step 1: Login
1. Go to **Authentication > Login**
2. Update the request body with your credentials:
```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```
3. Click **Send**
4. The JWT token will be automatically saved to your environment

## 📋 Testing Scenarios

### Scenario 1: Admin Creates Event QR Codes

1. **Create Check-in QR Code**
   - Go to **Event QR Code Management > Create Event QR Code**
   - Update `eventId` in the request body
   - Click **Send**
   - Copy the returned `qrCodeId` for later use

2. **Create Contact Exchange QR Code**
   - Go to **Event QR Code Management > Create Contact Exchange QR Code**
   - Update `eventId` in the request body
   - Click **Send**

3. **Create Exhibitor Stamp QR Code**
   - Go to **Event QR Code Management > Create Exhibitor Stamp QR Code**
   - Update `eventId` in the request body
   - Click **Send**

### Scenario 2: Admin Manages Attendance

1. **Get User QR Code**
   - Go to **User QR Code > Get User QR Code (Admin)**
   - The `userId` will be automatically filled from login
   - Click **Send**

2. **Scan QR Code for Attendance**
   - Go to **Admin Attendance Management > Scan QR Code for Attendance**
   - Update the `qrCodeData` with actual QR code data
   - Click **Send**

3. **Manual Check-in**
   - Go to **Admin Attendance Management > Manual Check-in**
   - Click **Send**

4. **View Attendance Stats**
   - Go to **Admin Attendance Management > Get Event Attendance Stats**
   - Click **Send**

### Scenario 3: User Self-Service

1. **Self Check-in**
   - Go to **User Self-Service > Self Check-in**
   - Update `eventQRCodeId` with the QR code ID from Scenario 1
   - Click **Send**

2. **Contact Exchange**
   - Go to **User Self-Service > Contact Exchange**
   - Update `scannedUserId` with another user's ID
   - Click **Send**

3. **Collect Exhibitor Stamp**
   - Go to **User Self-Service > Collect Exhibitor Stamp**
   - Update `eventQRCodeId` with the exhibitor QR code ID
   - Click **Send**

4. **View My Data**
   - Go to **User Self-Service > Get My Contact Exchanges**
   - Go to **User Self-Service > Get My Exhibitor Stamps**

## 🔧 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Solution:** Make sure you're logged in and the JWT token is set in your environment.

### Issue 2: 404 Not Found
**Solution:** Check that your backend is running on the correct port (default: 3000).

### Issue 3: 400 Bad Request
**Solution:** Verify that all required fields in the request body are filled correctly.

### Issue 4: Environment Variables Not Working
**Solution:** Make sure you've selected the correct environment in the dropdown.

## 📊 Expected Responses

### Successful Login Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Successful QR Code Creation:
```json
{
  "id": "qr-code-id",
  "eventId": "event-id",
  "type": "check_in",
  "title": "Main Entrance Check-in",
  "status": "active",
  "createdAt": "2025-01-09T10:00:00.000Z"
}
```

### Successful Self Check-in:
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "checkInResult": {
      "id": "attendance-id",
      "status": "checked_in",
      "checkInTime": "2025-01-09T10:00:00.000Z",
      "method": "qr_code"
    },
    "autoRegistered": false,
    "redirectToPayment": false
  }
}
```

## 🎯 Testing Tips

1. **Start with Authentication** - Always login first
2. **Use Environment Variables** - They make testing much easier
3. **Test in Order** - Create QR codes before testing self-service features
4. **Check Responses** - Look at the response data to get IDs for subsequent requests
5. **Use Different Users** - Test with different user roles (admin, user, exhibitor)

## 📱 Mobile App Integration

When integrating with your mobile app, use these endpoints:

- **Self Check-in**: `POST /api/attendance/self-check-in`
- **Contact Exchange**: `POST /api/attendance/contact-exchange`
- **Exhibitor Stamp**: `POST /api/attendance/exhibitor-stamp`
- **Get My Data**: `GET /api/attendance/contact-exchanges` and `GET /api/attendance/exhibitor-stamps`

The mobile app should:
1. Scan QR codes using a camera library
2. Extract the QR code data
3. Send the appropriate API request based on the QR code type
4. Handle the response and show success/error messages
