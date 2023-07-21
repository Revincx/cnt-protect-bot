import { Composer } from "grammy"
import { createMediaGroupShortcut, createSingleMediaShortcut, createSingleTextShortcut } from "../funcs/create"

const keybordCallback = new Composer()

keybordCallback
    .errorBoundary(async (err, next) => {
        console.log(err.error)
        await err.ctx.editMessageText('创建失败: ' + err.error)
        return next()
    })
    .callbackQuery('create', async ctx => {
        const target_message = ctx.callbackQuery.message?.reply_to_message        

        if(!target_message) {
            return ctx.editMessageText('失败：找不到目标消息。')
        }

        let shortcut = ''

        if(target_message.media_group_id)
        {
            shortcut = await createMediaGroupShortcut(target_message.chat.id, target_message.media_group_id, target_message.from!.id)
        }
        else if(target_message.photo || target_message.document || target_message.audio || target_message.video) 
        {
            shortcut = await createSingleMediaShortcut(target_message)
        }
        else if(target_message.text && target_message.from){
            shortcut = await createSingleTextShortcut(target_message)
        }
        else {
            return await ctx.editMessageText('失败：不支持的消息类型。')
        }

        if(shortcut) return await ctx.editMessageText(`创建成功！请复制下面的命令然后发送给我以使用。\n\n<pre>/send ${shortcut} [目标聊天]</pre>\n\n其中，目标聊天的格式可以为 <pre>@username</pre> 或者纯数字ID。`, { 
            parse_mode: 'HTML' 
        })

        return await ctx.editMessageText(`失败：不支持的消息类型。`)
    })

keybordCallback
    .callbackQuery('cancel', async ctx => {
        await ctx.editMessageText('取消操作。')
    })

export default keybordCallback