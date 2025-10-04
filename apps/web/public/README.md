# Public Assets

This directory contains static assets served from the root URL path.

## Required Assets (Place Your PNG Images Here)

### Icons & Branding

- `favicon.png` - Main favicon (32x32 or 64x64) - **TODO: Add your PNG**
- `logo.png` - Main application logo - **TODO: Add your PNG**
- `apple-touch-icon.png` - iOS home screen icon (180x180) - **TODO: Add your PNG**
- `og-image.png` - Open Graph/social share image (1200x630) - **TODO: Add your PNG**

### Images

- `images/` - Additional images organized by feature/type

## Usage

All files in this directory are publicly accessible:

```
/favicon.png → https://yoursite.com/favicon.png
/logo.png → https://yoursite.com/logo.png
```

## In Components

```tsx
import Image from 'next/image'

// Logo usage
<Image src="/logo.png" alt="Logo" width={200} height={50} priority />

// Regular image
<img src="/images/hero-bg.jpg" alt="Hero" />
```

## Metadata

Favicon and icons are configured in `src/app/layout.tsx`:

```tsx
export const metadata = {
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
}
```

## Next Steps

Add your PNG image files to this directory:

1. `favicon.png` (32x32 or 64x64)
2. `logo.png` (your brand logo)
3. `apple-touch-icon.png` (180x180 for iOS)
4. `og-image.png` (1200x630 for social sharing)
