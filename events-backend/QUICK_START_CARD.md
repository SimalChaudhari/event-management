# 🚀 Quick Start Card - QR Code & Scanner System

## ⚡ Essential Steps (5 Minutes)

### 1. Start Backend
```bash
cd events-backend
npm run start:dev
```

### 2. Import Postman Collection
- Import `postman-collection.json`
- Create environment with variables: `baseUrl`, `jwtToken`, `userId`, `eventId`

### 3. Login
- **Authentication > Login**
- Use admin credentials
- JWT token auto-saved

### 4. Create QR Codes (Admin)
- **Event QR Code Management > Create Event QR Code**
- Set `type: "check_in"`, `allowSelfCheckIn: true`
- Copy returned `id` to `eventQRCodeId` variable

### 5. Test Self Check-in (User)
- **User Self-Service > Self Check-in**
- Should work with auto-filled variables

---

## 🔧 Environment Variables

| Variable | Value | Source |
|----------|-------|--------|
| `baseUrl` | `http://localhost:3000` | Manual |
| `jwtToken` | Auto-filled | Login response |
| `userId` | Auto-filled | Login response |
| `eventId` | Your event ID | Manual |
| `eventQRCodeId` | Auto-filled | QR code creation |
| `exhibitorQRCodeId` | Auto-filled | Exhibitor QR creation |

---

## 📱 Key Endpoints

### Admin Only
- `POST /api/attendance/event-qr-codes/create` - Create QR codes
- `POST /api/attendance/scan-qr-code` - Scan user QR codes
- `GET /api/attendance/event/{eventId}/stats` - View stats

### User Self-Service
- `POST /api/attendance/self-check-in` - Self check-in
- `POST /api/attendance/contact-exchange` - Exchange contacts
- `POST /api/attendance/exhibitor-stamp` - Collect stamps

---

## 🚨 Common Issues

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token in environment |
| 404 Not Found | Verify backend is running on port 3000 |
| 400 Bad Request | Check request body format |
| Database errors | Check enum values match database |

---

## ✅ Success Indicators

- ✅ Login returns JWT token
- ✅ QR code creation returns ID
- ✅ Self check-in works
- ✅ Contact exchange works
- ✅ Exhibitor stamp collection works

---

## 📞 Need Help?

1. Check `STEP_BY_STEP_GUIDE.md` for detailed instructions
2. Verify all prerequisites are met
3. Check server logs for errors
4. Ensure database is connected

**Ready to test! 🎯**
