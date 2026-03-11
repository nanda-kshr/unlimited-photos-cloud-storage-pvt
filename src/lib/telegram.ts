import TelegramBot from 'node-telegram-bot-api';

interface CustomTelegramBot {
  sendDocument(chatId: string, buffer: Buffer, options?: { filename?: string }): Promise<TelegramBot.Message>;
  sendPhoto(chatId: string, buffer: Buffer): Promise<TelegramBot.Message>;
  getFile(fileId: string): Promise<TelegramBot.File>;
}

export const createBot = (token: string): CustomTelegramBot => {
  // Increase request timeout to accommodate larger uploads where possible.
  // node-telegram-bot-api accepts `request` options which are forwarded to the HTTP client.
  // cast options as any to avoid type mismatch in @types
  const bot = new TelegramBot(token, { polling: false } as any);
  try {
    ;(bot as any).options = { ...(bot as any).options, request: { timeout: 300000 } };
  } catch (e) {
    // ignore
  }
  return {
    sendDocument: (chatId: string, buffer: Buffer) =>
      bot.sendDocument(chatId, buffer),
    sendPhoto: (chatId: string, buffer: Buffer) =>
      bot.sendPhoto(chatId, buffer),
    getFile: (fileId: string) =>
      bot.getFile(fileId),
  };
};