// The iPhone app: the same web app, bundled inside a native shell with native sign-in, haptics, reminders,
// and sharing. Built and signed by .github/workflows/ios.yml.
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.withinoracle',
  appName: 'Within',
  webDir: 'dist',
  ios: { contentInset: 'never', scheme: 'Within' },
  plugins: {
    SplashScreen: { launchShowDuration: 600, backgroundColor: '#0b1030', showSpinner: false },
    LocalNotifications: { iconColor: '#d9b26a' },
  },
};

export default config;
