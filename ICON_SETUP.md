# Icon Setup Guide

The PWA icons have been configured to fix the cropped icon issue. Here's what was done:

## Files Created

1. **`public/icon.svg`** - Main app icon (192x192 and 512x512 will be generated)
2. **`public/icon-maskable.svg`** - Maskable icon for Android (with safe zone)
3. **`public/favicon.svg`** - Browser favicon

## How It Works

When you run `npm run build`, vite-plugin-pwa will:
- Generate `pwa-192x192.png` from `icon.svg`
- Generate `pwa-512x512.png` from `icon.svg`
- Generate `maskable-icon-512x512.png` from `icon-maskable.svg`

## If Icons Don't Generate Automatically

If the build doesn't generate the PNG files, you can:

1. **Option 1: Use an online converter**
   - Convert `public/icon.svg` to PNG at 192x192 and 512x512
   - Convert `public/icon-maskable.svg` to PNG at 512x512
   - Place them in the `public/` folder with the names:
     - `pwa-192x192.png`
     - `pwa-512x512.png`
     - `maskable-icon-512x512.png`

2. **Option 2: Use ImageMagick or similar tool**
   ```bash
   # Convert icon.svg to PNGs
   convert public/icon.svg -resize 192x192 public/pwa-192x192.png
   convert public/icon.svg -resize 512x512 public/pwa-512x512.png
   convert public/icon-maskable.svg -resize 512x512 public/maskable-icon-512x512.png
   ```

3. **Option 3: Use a design tool**
   - Open the SVG files in Figma, Illustrator, or similar
   - Export as PNG at the required sizes
   - Save to the `public/` folder

## Testing

After building:
1. Check that `dist/pwa-192x192.png`, `dist/pwa-512x512.png`, and `dist/maskable-icon-512x512.png` exist
2. Test the PWA installation on Android
3. Verify the icon appears correctly in the app launcher
4. Check that the splash screen shows the icon properly (not a black squircle)

## Icon Design

The icons feature:
- Blue gradient background (#2563eb to #4f46e5)
- White book icon in the center
- Proper safe zones for maskable icons (80% of canvas)
- Rounded corners for modern look

## Troubleshooting

**Icon still shows as black squircle:**
- Ensure `background_color` in manifest.json matches the icon background (#2563eb)
- Check that maskable icon has proper safe zone (content in center 80%)
- Clear browser cache and reinstall PWA

**Icon appears cropped:**
- Verify maskable icon has content within the safe zone
- Check that all icon sizes are generated correctly
- Ensure manifest.json references the correct icon files

