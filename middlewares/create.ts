import { Composer } from "grammy"
import { getMediaGroup } from "../funcs/storage"
import { createMediaGroupShortcut, createSingleMediaShortcut, createSingleTextShortcut } from "../funcs/create"

const create_command = new Composer()

create_command
    .errorBoundary(async (err, next) => {
        console.log(err.error)
        await err.ctx.reply('Error: ' + err.error)
        return next()
    })
    .on('message:text')
    .command('create')
    .use(async ctx => {
        const my_username = ctx.me?.username
        
        let shortcut = ''
    
        if(ctx.message?.chat.type !== 'private') {
            return ctx.reply('只能在与我的私聊中创建消息引用。', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '点这里私聊我', url: `https://t.me/${my_username}` }]
                    ]
                }
            })
        }
    
        const target_message = ctx.message?.reply_to_message
    
        if(!target_message) {
            return ctx.reply('请回复一条消息以创建引用。')
        }

        if(target_message.from?.is_bot) {
            return ctx.reply('你必须回复你自己发送的消息。')
        }
    
        if(target_message.photo || target_message.document || target_message.audio || target_message.video) {
        
            if(target_message.media_group_id) {
                const media_group = await getMediaGroup(target_message.chat.id, target_message.media_group_id)
                if(!media_group) {
                    return ctx.reply('该消息的记录已失效，请重新把它转发给我，然后再次尝试使用 create 命令。')
                }
            
                shortcut = await createMediaGroupShortcut(target_message.chat.id, target_message.media_group_id, ctx.message.from.id)
            }
        
            shortcut = await createSingleMediaShortcut(target_message)
        }
    
        if(target_message.text && target_message.from) {
            shortcut = await createSingleTextShortcut(target_message)
        }

        if(shortcut) return await ctx.reply(`创建成功！请复制下面的命令然后发送给我以使用。\n\n<pre>/send ${shortcut} [目标聊天]</pre>\n\n其中，目标聊天的格式可以为 <pre>@username</pre> 或者纯数字ID。`, {
            parse_mode: 'HTML'
        })

        return ctx.reply(`失败：不支持的消息类型。`)
})

export default create_command