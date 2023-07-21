import { Api, Composer, GrammyError, RawApi } from "grammy";
import { deleteShourtcut, getMessagesByShortcut } from "../funcs/storage";
import { MediaGroup, MediaTypeStr, PlainText } from "../types/Media";


const send_command = new Composer()

send_command
    .on('message:text')
    .command('send')
    .errorBoundary(async (err, next) => {
        console.log(err.error)
        const grammy_err = err.error as GrammyError
        if(grammy_err.description === 'Bad Request: chat not found') {
            await err.ctx.reply('失败：找不到发送目标，请检查输入是否正确。')
            return next()
        }
        if(grammy_err.description === 'Bad Request: member list is inaccessible') {
            await err.ctx.reply('失败：机器人不是目标频道的管理员或者权限不足，无法发送消息。')
            return next()
        }
        await err.ctx.reply('失败: ' + err.error)
        return next()
    })
    .use(async ctx => {
        
        const params = ctx.message?.text?.split(' ')

        if(!params || params.length < 2) return ctx.reply('请提供 ID。')

        const shortcut_id = params[1]
        let target_chat: number | string = ctx.message?.chat.id

        if (params.length === 3) {
            target_chat = params[2]

            const chat = await ctx.api.getChat(target_chat)

            if(chat.type === 'private') return ctx.reply('目标聊天不能为私聊。')

            if((chat.type === 'group' || chat.type === 'supergroup') ) {
                if(ctx.message.chat.type == 'private') 
                    return ctx.reply('暂时禁止在私聊中向群组中发送消息。如果需要，请直接在目标群组中使用 send 命令。')

                if((ctx.message.chat.type === 'group' || ctx.message.chat.type === 'supergroup') && ctx.message.chat.id !== chat.id) 
                    return ctx.reply('不允许在群组中想其他群组发送消息。')
            }

            const is_admin = await isTargetChatAdmin(target_chat, ctx.message.from.id, ctx.api)

            if(!is_admin) return ctx.reply('您不是目标群组的管理员，无法发送消息。')
        }

        if(!/[A-Za-z0-9]{6}/.test(shortcut_id)) return ctx.reply('ID 参数不合法。')

        const messages = await getMessagesByShortcut(shortcut_id, ctx.message.from.id)

        if(!messages) return ctx.reply('找不到该消息引用，请确认该引用是您创建的并且未使用过。')

        const wait_msg = await ctx.reply('正在发送消息，请稍候...')

        const s_type = messages.ref_name.split(':')[0]

        switch(s_type) {
            case 'text': 
                const text_msg = messages as PlainText
                await ctx.api.sendMessage(target_chat, text_msg.text, { entities: text_msg.entities, protect_content: true })
                break
            case 'mg':
                const media_group = messages as MediaGroup
                await sendMedia(media_group, ctx.api, target_chat)
                break
            default:
                return await ctx.api.editMessageText(ctx.chat.id, wait_msg.message_id, '发送失败：未知的消息类型。')
        }

        await deleteShourtcut(shortcut_id, ctx.message.from.id)

        return await ctx.api.editMessageText(ctx.chat.id, wait_msg.message_id, '发送成功！')

    })

async function isTargetChatAdmin(target_chat: string | number, user_id: number , api: Api<RawApi>) {
    const admins = await api.getChatAdministrators(target_chat)
    return admins.map(admin => admin.user.id).includes(user_id)
}

async function sendMedia(media_group: MediaGroup, api: Api<RawApi>, chat_id: string | number) {
    const media_type = media_group.type.toString() as MediaTypeStr
    await api.sendMediaGroup(chat_id, media_group.medias.map(media => ({
        type: media_type,
        media: media.file_id,
        caption: media.caption,
        caption_entities: media.caption_entities
    })), { protect_content: true })
}

export default send_command