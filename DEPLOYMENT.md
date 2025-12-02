# Deployment Guide - PWA Auto-Update Setup

This guide explains how the PWA (Progressive Web App) auto-update system works and how to ensure users always get the latest version.

## How Auto-Updates Work

### 1. Service Worker Configuration
- **vite-plugin-pwa** is configured with `registerType: 'autoUpdate'`
- Service worker uses `skipWaiting: true` and `clientsClaim: true` to immediately activate updates
- The service worker checks for updates every 60 seconds automatically

### 2. Cache Busting Strategy
- **HTML files**: Never cached (no-cache headers) - ensures users always get the latest HTML
- **Service Worker**: Never cached - ensures the SW itself is always fresh
- **Assets with hashes**: Long cache (31536000 seconds) - safe because filenames include content hashes
- **Build output**: All files include content hashes in filenames (e.g., `app.abc123.js`)

### 3. Update Flow
1. When you push code to GitHub and Netlify deploys:
   - New service worker is generated with updated file hashes
   - New HTML references the new hashed assets
2. When users visit the app:
   - Service worker checks for updates automatically
   - If update found, user sees an "Update Available" notification
   - User clicks "Update" → Service worker activates → Page reloads with new version
   - If user dismisses, they can still use the app but will be prompted again

### 4. Netlify Configuration
The `netlify.toml` file ensures:
- HTML files are never cached
- Service worker files are never cached
- Assets with hashes can be cached (they're unique per build)
- Proper redirects for SPA routing

## Deployment Steps

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Build the app**:
   ```bash
   npm run build
   ```
   This generates:
   - Service worker files in `dist/`
   - Hashed asset files
   - Updated manifest.json

3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push
   ```

4. **Netlify automatically**:
   - Detects the push
   - Runs `npm run build`
   - Deploys the `dist/` folder
   - Applies cache headers from `netlify.toml`

5. **Users get updates**:
   - Service worker detects new version within 60 seconds
   - Update notification appears
   - One click to update

## Testing Updates Locally

1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Make a change and rebuild
4. Refresh - you should see the update notification

## Important Notes

- **Never cache HTML**: This is critical - HTML must always be fresh to reference new assets
- **Service Worker updates**: The SW checks for updates automatically, no manual refresh needed
- **User experience**: Users see a friendly notification instead of a forced reload
- **Offline support**: The app works offline with cached data, but always checks for updates when online

## Troubleshooting

### Users not getting updates?
1. Check `netlify.toml` is in the repo root
2. Verify cache headers are being applied (check Netlify deploy logs)
3. Ensure service worker is being generated (check `dist/sw.js` exists after build)

### Build issues?
1. Make sure `vite-plugin-pwa` is installed: `npm install vite-plugin-pwa --save-dev`
2. Check `vite.config.ts` has the PWA plugin configured
3. Verify build completes without errors

### Service worker not updating?
1. Clear browser cache and service workers (DevTools → Application → Clear storage)
2. Check browser console for service worker errors
3. Verify `skipWaiting: true` is set in vite.config.ts

## Files Modified/Created

- ✅ `vite.config.ts` - PWA plugin configuration
- ✅ `netlify.toml` - Cache headers and deployment config
- ✅ `App.tsx` - Update checking logic
- ✅ `components/UpdateNotification.tsx` - Update UI component
- ✅ `manifest.json` - Updated PWA manifest
- ✅ `package.json` - Added vite-plugin-pwa dependency

