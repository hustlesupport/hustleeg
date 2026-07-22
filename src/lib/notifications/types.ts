export type NotificationTarget = { email?: string; phone?: string };

export type NotificationResult = { delivered: boolean; providerReference?: string };

export interface NotificationProvider {
  name: string;
  send(to: NotificationTarget, message: string): Promise<NotificationResult>;
}
