# Simplified Checkout Flow - One API

You're absolutely right! We don't need two separate APIs. Here's the simplified flow with just one API:

## ✅ **Simplified Flow (Only 2 Steps)**

### **Step 1: Get Cart Items**
```bash
GET /api/carts/selectable-items
```

### **Step 2: Create Checkout with Coupon (One API)**
```bash
POST /api/carts/create-checkout-with-coupon
{
  "selectedCartIds": ["cart-1", "cart-2"],
  "couponCode": "SAVE10"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checkout session created successfully with coupon applied",
  "data": {
    "checkoutId": "CHK-2024-123456-ABCD",
    "status": "Pending",
    "totalAmount": 270.00,
    "discount": 29.99,
    "couponCode": "SAVE10",
    "couponApplied": {
      "code": "SAVE10",
      "discount": 29.99,
      "type": "percentage"
    },
    "priceBreakdown": {
      "subtotal": 299.99,
      "discount": 29.99,
      "total": 270.00,
      "currency": "USD",
      "gstInclusive": true
    },
    "cartItems": [...],
    "itemCount": 2
  }
}
```

### **Step 3: Process Payment**
```bash
POST /api/carts/process-payment
{
  "checkoutId": "CHK-2024-123456-ABCD",
  "paymentMethodId": "pm_1234567890",
  "cvc": "123"
}
```

## 💻 **Simplified Frontend Implementation**

```javascript
class SimplifiedCheckout {
  constructor() {
    this.selectedCartIds = [];
    this.checkoutId = null;
  }

  // Step 1: Load cart items
  async loadCartItems() {
    const response = await fetch('/api/carts/selectable-items');
    const data = await response.json();
    return data.data.items;
  }

  // Step 2: Create checkout with coupon (ONE API CALL)
  async createCheckoutWithCoupon(selectedCartIds, couponCode = null) {
    this.selectedCartIds = selectedCartIds;
    
    const response = await fetch('/api/carts/create-checkout-with-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedCartIds, couponCode })
    });
    
    const data = await response.json();
    if (data.success) {
      this.checkoutId = data.data.checkoutId;
      // Show updated pricing with coupon applied
      this.updateCheckoutDisplay(data.data);
    }
    return data;
  }

  // Step 3: Process payment
  async processPayment(paymentMethodId, cvc) {
    const response = await fetch('/api/carts/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkoutId: this.checkoutId,
        paymentMethodId,
        cvc
      })
    });
    
    return response.json();
  }

  // Update UI with checkout data
  updateCheckoutDisplay(checkoutData) {
    // Update price breakdown
    document.getElementById('subtotal').textContent = `$${checkoutData.priceBreakdown.subtotal}`;
    document.getElementById('discount').textContent = `-$${checkoutData.priceBreakdown.discount}`;
    document.getElementById('total').textContent = `$${checkoutData.priceBreakdown.total}`;
    
    // Show applied coupon
    if (checkoutData.couponApplied) {
      document.getElementById('coupon-display').textContent = 
        `Coupon ${checkoutData.couponApplied.code} applied - $${checkoutData.couponApplied.discount} off`;
    }
  }
}

// Usage
const checkout = new SimplifiedCheckout();

// Load cart items
const cartItems = await checkout.loadCartItems();

// User selects items and enters coupon
const selectedCartIds = ['cart-1', 'cart-2'];
const couponCode = 'SAVE10';

// Create checkout with coupon (ONE API CALL)
const checkoutResult = await checkout.createCheckoutWithCoupon(selectedCartIds, couponCode);

if (checkoutResult.success) {
  console.log('Checkout created with coupon applied!');
  console.log('Total:', checkoutResult.data.priceBreakdown.total);
  console.log('Discount:', checkoutResult.data.priceBreakdown.discount);
  
  // Process payment
  const paymentResult = await checkout.processPayment('pm_1234567890', '123');
  
  if (paymentResult.success) {
    console.log('Payment successful!');
  }
}
```

## 🎯 **What This Single API Does**

1. **Applies Coupon** (if provided)
2. **Creates Checkout Session** 
3. **Returns Checkout ID** for payment
4. **Shows Updated Pricing** with discount applied

## ✅ **Benefits of One API**

- **Simpler**: Only one API call instead of two
- **Faster**: Less network requests
- **Cleaner**: Single responsibility for checkout creation
- **Easier**: Frontend code is simpler
- **Atomic**: Coupon application and checkout creation happen together

## 📋 **Final API Summary**

| Step | Endpoint | Purpose | Input | Output |
|------|----------|---------|-------|--------|
| 1 | `GET /api/carts/selectable-items` | Get cart items | - | Cart items with selection options |
| 2 | `POST /api/carts/create-checkout-with-coupon` | Create checkout + apply coupon | `selectedCartIds`, `couponCode` | `checkoutId` + updated pricing |
| 3 | `POST /api/carts/process-payment` | Process payment | `checkoutId`, payment details | Payment result |

Perfect! Now it's just **3 simple steps** instead of 4! 🎉
