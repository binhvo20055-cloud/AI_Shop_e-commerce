# AI Features Setup — ShopGenius

## Bria AI (Image Processing)

### 1. Đăng ký tài khoản
1. Vào https://platform.bria.ai
2. Tạo tài khoản và lấy API token
3. Điền vào `.env.local`:

```env
BRIA_API_TOKEN=your-api-token
```

### 2. Tính năng
- **Remove Background** — Xóa nền ảnh sản phẩm, trả về PNG trong suốt
- **Lifestyle Shot** — Đặt sản phẩm vào cảnh thực tế (bếp, văn phòng, ngoài trời)
- **Upscale** — Tăng độ phân giải 2x hoặc 4x

### 3. Pipeline tự động
Khi merchant upload ảnh sản phẩm:
1. Ảnh gốc → Bria xóa nền → PNG trong suốt
2. PNG trong suốt → Bria tạo lifestyle shot
3. Cả hai ảnh được lưu vào Supabase Storage
4. Product record được update với `processed_images`

---

## ElevenLabs (Voice AI)

### 1. Đăng ký tài khoản
1. Vào https://elevenlabs.io
2. Lấy API key từ Profile → API Keys
3. Chọn voice ID từ Voice Library
4. Điền vào `.env.local`:

```env
ELEVENLABS_API_KEY=your-api-key
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb  # Rachel voice (default)
```

### 2. Tính năng

#### Text-to-Speech (TTS)
- Model: `eleven_flash_v2_5` — ~75ms latency, multilingual
- Tự động generate audio description khi tạo sản phẩm
- Audio được lưu vào Supabase Storage (`product-audio` bucket)
- Player trên product page với progress bar

#### Speech-to-Text (STT) — Voice Search
- **Realtime** (authenticated users): Dùng ElevenLabs Scribe v2 realtime
  - Single-use token minted từ backend (`/api/ai/scribe-token`)
  - Live transcript hiển thị khi đang nói
- **File-based** (fallback): Upload audio file → Scribe v1 transcription

### 3. Voice Search Flow
```
User clicks mic → Backend mints Scribe token → Browser connects to ElevenLabs
→ Live transcript → User stops → Search with transcript
```

### 4. Recommended Voices
| Voice ID | Name | Style |
|----------|------|-------|
| `JBFqnCBsd6RMkjVDRZzb` | George | Warm, professional |
| `21m00Tcm4TlvDq8ikWAM` | Rachel | Clear, neutral |
| `AZnzlk1XvdvUeBnXmlld` | Domi | Energetic |
| `EXAVITQu4vr4xnSDxMaL` | Bella | Soft, friendly |

---

## Testing Without API Keys

Tất cả AI features đều **gracefully degrade** khi không có API keys:
- Bria AI không có key → ảnh gốc được dùng, product vẫn active
- ElevenLabs không có key → không có audio player, voice search dùng browser MediaRecorder
- Stripe không có key → checkout page hiển thị nhưng redirect sẽ fail

Để test đầy đủ, cần điền đủ keys vào `.env.local`.
