import { Bot, webhookCallback } from 'grammy'
import type { VercelRequest, VercelResponse } from '@vercel/node';
import combined from '../middlewares';

const BOT_TOKEN = process.env.BOT_TOKEN || ''
const THE_TOKEN = BOT_TOKEN?.split(':')[1] || ''

const bot = new Bot(BOT_TOKEN)

bot
    .chatType('private')
    .command('start', ctx => {
        ctx.reply('欢迎使用！\n\n请直接发送任意媒体消息或者文字消息给我。如果想要转发消息给我，请选择无引用转发。')
    })

bot.use(combined)

export default function (request: VercelRequest, response: VercelResponse) {
    if(request.url?.indexOf(THE_TOKEN) === -1) {
        return response.status(401).send('401 Unauthorized')
    }

    const callback = webhookCallback(bot, 'http')

    callback(request, response)
}