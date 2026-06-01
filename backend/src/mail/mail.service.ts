import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendWelcomeEmail(to: string, username: string) {
    const appName = 'Whisper';
    const loginUrl = `${this.configService.get('FRONTEND_URL')}/login`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body class="bg-gray-100 font-sans">
        <div class="max-w-2xl mx-auto my-10 bg-white rounded-2xl shadow-lg overflow-hidden">
          <!-- Header -->
          <div class="bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 class="text-3xl font-bold text-white">Welcome to ${appName}! 🎉</h1>
          </div>
          
          <!-- Content -->
          <div class="px-8 py-6">
            <p class="text-gray-700 text-lg mb-4">Hello <strong class="text-blue-600">${username}</strong>,</p>
            
            <p class="text-gray-600 mb-4">Thank you for joining <strong>${appName}</strong>! We're excited to have you on board.</p>
            
            <div class="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded">
              <p class="text-gray-700 text-sm">✨ Your account has been successfully created. You can now start connecting with friends, join group chats, and share moments instantly.</p>
            </div>
            
            <div class="space-y-3 mb-6">
              <p class="text-gray-700">🔹 <strong>Send messages</strong> – Text, images, voice, and video</p>
              <p class="text-gray-700">🔹 <strong>Group chats</strong> – Create and manage group conversations</p>
              <p class="text-gray-700">🔹 <strong>Real-time</strong> – Instant delivery and read receipts</p>
              <p class="text-gray-700">🔹 <strong>End-to-end</strong> – Your privacy matters</p>
            </div>
            
            <div class="text-center my-8">
              <a href="${loginUrl}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-200">
                Start Chatting →
              </a>
            </div>
            
            <hr class="my-6 border-gray-200">
            
            <p class="text-gray-500 text-sm text-center">
              Need help? Contact us at <a href="mailto:support@${appName.toLowerCase()}.com" class="text-blue-600">support@${appName.toLowerCase()}.com</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div class="bg-gray-50 px-8 py-4 text-center">
            <p class="text-gray-400 text-xs">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Welcome to ${appName} ${username}! Your account has been successfully created. Login at ${loginUrl} to start chatting.`;

    await this.mailerService.sendMail({
      from: `"${appName}" <${this.configService.get('EMAIL_FROM')}>`,
      to,
      subject: `Welcome to ${appName}! 🎉`,
      text,
      html,
    });

    return { success: true };
  }
}
