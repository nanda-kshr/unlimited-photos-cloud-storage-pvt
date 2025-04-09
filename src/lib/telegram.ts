import TelegramBot from 'node-telegram-bot-api'



const createBot = (apiKey: string) => {
  return new TelegramBot(apiKey, {
    polling: false,
  })
}

export default createBot