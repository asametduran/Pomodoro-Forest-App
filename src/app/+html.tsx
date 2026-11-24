import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only root HTML used by the static export (`web.output: "static"`).
 * Adds the PWA manifest, home-screen icons, theme colours, and registers the service worker in
 * production builds so the installed web app keeps working offline.
 */

// Matches the app background, so there is no white flash before the bundle loads.
const BACKGROUND_CSS = `
html, body { background-color: #F9F1E6; }
@media (prefers-color-scheme: dark) { html, body { background-color: #212820; } }
`;

const REGISTER_SERVICE_WORKER = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
`;

export default function Root({ children }: PropsWithChildren) {
  // Expo injects the app's scripts, styles and fonts through these nodes (SDK 58+); they must be rendered.
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
  // Only production exports get the service worker; the dev server must never be cached.
  const production = process.env.NODE_ENV === 'production';
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Forest Pomodoro</title>
        <meta
          name="description"
          content="A calm Pomodoro focus timer. Stay focused and grow a forest: every session grows a tree."
        />
        <meta name="theme-color" content="#F9F1E6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#212820" media="(prefers-color-scheme: dark)" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Forest Pomodoro" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: BACKGROUND_CSS }} />
        {production && <script dangerouslySetInnerHTML={{ __html: REGISTER_SERVICE_WORKER }} />}
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
