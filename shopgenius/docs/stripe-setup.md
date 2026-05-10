# Stripe Setup Guide — ShopGenius

## 1. Tạo tài khoản Stripe

1. Đăng ký tại https://stripe.com
2. Vào **Developers → API Keys**
3. Copy **Publishable key** (`pk_test_...`) và **Secret key** (`sk_test_...`)
4. Điền vào `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 2. Tạo Products & Prices (cho Merchant Subscription)

1. Vào **Products → Add product**
2. Tạo **"ShopGenius Pro"**:
   - Price: $29/month (recurring)
   - Copy Price ID → `STRIPE_PRO_PRICE_ID=price_...`
3. Tạo **"ShopGenius Enterprise"** (optional):
   - Copy Price ID → `STRIPE_ENTERPRISE_PRICE_ID=price_...`

## 3. Setup Webhook (local development)

### Cài Stripe CLI:
```bash
# Windows (scoop)
scoop install stripe

# hoặc download từ https://stripe.com/docs/stripe-cli
```

### Forward webhook đến localhost:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy **webhook signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET=whsec_...`

### Events cần enable:
- `checkout.session.completed`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 4. Setup Customer Portal

1. Vào **Settings → Billing → Customer portal**
2. Enable portal và configure:
   - Allow customers to cancel subscriptions
   - Allow customers to update payment methods
   - Show invoice history
3. Save settings

## 5. Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | 3D Secure required |
| `4000 0000 0000 9995` | Insufficient funds |

Expiry: any future date, CVC: any 3 digits

## 6. Production Checklist

- [ ] Switch to live keys (`pk_live_`, `sk_live_`)
- [ ] Create production webhook endpoint in Stripe Dashboard
- [ ] Enable Stripe Tax if needed
- [ ] Configure allowed countries for shipping
- [ ] Test full checkout flow end-to-end
- [ ] Enable fraud protection (Stripe Radar)
