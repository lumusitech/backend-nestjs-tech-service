import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webPush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class PushNotificationsService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationsService.name);
  private vapidPublicKey!: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PushSubscription)
    private readonly subscriptionRepository: Repository<PushSubscription>,
  ) {}

  onModuleInit(): void {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT');

    if (publicKey && privateKey && subject) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidPublicKey = publicKey;
      this.logger.log('VAPID keys configured for push notifications');
    } else {
      this.logger.warn(
        'VAPID keys not configured — push notifications disabled',
      );
    }
  }

  getPublicKey(): string | null {
    return this.vapidPublicKey ?? null;
  }

  async subscribe(userId: string, dto: SubscribeDto): Promise<PushSubscription> {
    const existing = await this.subscriptionRepository.findOne({
      where: { endpoint: dto.endpoint, userId },
    });

    if (existing) {
      existing.p256dh = dto.p256dh;
      existing.auth = dto.auth;
      existing.userAgent = dto.userAgent;
      return this.subscriptionRepository.save(existing);
    }

    const subscription = this.subscriptionRepository.create({
      endpoint: dto.endpoint,
      p256dh: dto.p256dh,
      auth: dto.auth,
      userId,
      userAgent: dto.userAgent,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async unsubscribe(endpoint: string, userId: string): Promise<void> {
    await this.subscriptionRepository.delete({ endpoint, userId });
  }

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; url?: string; icon?: string },
  ): Promise<void> {
    if (!this.vapidPublicKey) return;

    const subscriptions = await this.subscriptionRepository.find({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? '/',
      icon: payload.icon ?? '/assets/icons/icon-192x192.png',
    });

    const failures: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          pushPayload,
        );
      } catch (error: any) {
        if (error.statusCode === 410) {
          this.logger.log(`Removing stale subscription: ${sub.id}`);
          await this.subscriptionRepository.remove(sub);
        } else {
          this.logger.warn(`Push failed for subscription ${sub.id}: ${error.message}`);
          failures.push(sub.id);
        }
      }
    }

    if (failures.length > 0) {
      this.logger.warn(`Push delivery failed for ${failures.length} subscriptions`);
    }
  }

  async sendToAll(
    userIds: string[],
    payload: { title: string; body: string; url?: string; icon?: string },
  ): Promise<void> {
    for (const userId of userIds) {
      await this.sendToUser(userId, payload);
    }
  }
}
