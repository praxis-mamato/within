/**
 * The iPhone app's native side (Capacitor): sign-in through Safari with a link back into the app, haptics,
 * daily reminders scheduled on the phone, and the status bar. On the web every function here does nothing.
 */
import { Capacitor } from '@capacitor/core';

export const NATIVE_APP = Capacitor.isNativePlatform();
export const IOS_APP = Capacitor.getPlatform() === 'ios';
/** Sign-in and email links come back into the app through this address. */
export const APP_RETURN_URL = 'app.withinoracle://auth';

/** Opens a page in Safari over the app (sign-in, links out). */
export async function openInBrowser(url: string) {
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url, presentationStyle: 'popover' });
}

/** A light tap you feel: on a shake, and when the Oracle answers. */
export async function haptic(kind: 'shake' | 'answer') {
  if (!NATIVE_APP) return;
  const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
  if (kind === 'shake') await Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => undefined);
  else await Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
}

const REMINDER_ID = 7001;
/** The daily check-in reminder, scheduled by the phone itself: discreet, with no names or details. */
export async function setDailyReminder(on: boolean) {
  if (!NATIVE_APP) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => undefined);
  if (!on) return;
  const perm = await LocalNotifications.requestPermissions().catch(() => ({ display: 'denied' }));
  if (perm.display !== 'granted') return;
  await LocalNotifications.schedule({
    notifications: [{ id: REMINDER_ID, title: 'Within', body: 'Your message from the Oracle is waiting.', schedule: { on: { hour: 9, minute: 0 }, allowWhileIdle: true } }],
  }).catch(() => undefined);
}

/** Once at start: sign-in links that come back into the app finish signing in, and the status bar fits the dark sky. */
export async function startNative(finishSignIn: (code: string) => Promise<unknown>) {
  if (!NATIVE_APP) return;
  const [{ App }, { Browser }, { StatusBar, Style }] = await Promise.all([import('@capacitor/app'), import('@capacitor/browser'), import('@capacitor/status-bar')]);
  await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(APP_RETURN_URL)) return;
    const code = new URL(url.replace(/^app\.withinoracle:\/\//, 'https://x/')).searchParams.get('code');
    if (code) await finishSignIn(code).catch(() => undefined);
    await Browser.close().catch(() => undefined);
  });
}
