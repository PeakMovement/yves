// Email onboarding via webhook (e.g. Make.com, Zapier, or any HTTP endpoint).
// Set the webhook URL in localStorage under 'buddy_webhook_url',
// or fall back to the VITE_WELCOME_EMAIL_WEBHOOK env var.

const WEBHOOK_KEY = 'buddy_webhook_url';

export function getWebhookUrl(): string {
  return localStorage.getItem(WEBHOOK_KEY) || import.meta.env.VITE_WELCOME_EMAIL_WEBHOOK || '';
}

export function setWebhookUrl(url: string) {
  localStorage.setItem(WEBHOOK_KEY, url.trim());
}

export interface WelcomeEmailPayload {
  client_name: string;
  client_email: string;
  login_code: string;
  app_url: string;
}

export async function sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<{ success: boolean; error?: string }> {
  const url = getWebhookUrl();
  if (!url) {
    return { success: false, error: 'No webhook URL configured. Go to Admin Dashboard settings to add one.' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `Webhook returned ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
