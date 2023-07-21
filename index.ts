import dotenv from "dotenv"
import { Bot } from "grammy"
import combined from "./middlewares"

dotenv.config()

const bot = new Bot(process.env.BOT_TOKEN || '')

bot
    .chatType('private')
    .command('start', ctx => {
        ctx.reply('欢迎使用！\n\n请直接发送任意媒体消息或者文字消息给我。如果想要转发消息给我，请选择无引用转发。')
    })

bot.use(combined)

bot.start()