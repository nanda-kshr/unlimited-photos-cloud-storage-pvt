import TelegramBot from 'node-telegram-bot-api';

interface CustomTelegramBot {
  sendDocument(chatId: string, buffer: Buffer, options?: { filename?: string }): Promise<TelegramBot.Message>;
  sendPhoto(chatId: string, buffer: Buffer): Promise<TelegramBot.Message>;
  getFile(fileId: string): Promise<TelegramBot.File>;
}

export const createBot = (token: string): CustomTelegramBot => {
  const bot = new TelegramBot(token, { polling: false });
  return {
    sendDocument: (chatId: string, buffer: Buffer) =>
      bot.sendDocument(chatId, buffer),
    sendPhoto: (chatId: string, buffer: Buffer) =>
      bot.sendPhoto(chatId, buffer),
    getFile: (fileId: string) =>
      bot.getFile(fileId),
  };
};