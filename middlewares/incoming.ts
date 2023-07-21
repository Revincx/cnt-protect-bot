import { Composer } from "grammy"
import { saveMediaMessages } from "../funcs/create"
import { getMediaGroup } from "../funcs/storage"
import { MediaGroup } from "../types/Media"

const incoming = new Composer()

incoming
    .chatType('private')
    .on('message', async (ctx) => {
        const entities = ctx.message?.entities
        let media_group: MediaGroup | undefined

        if(entities && entities[0].type == 'bot_command') return

        if(ctx.message.forward_from || ctx.message.forward_from_chat) {
            return await ctx.reply('暂不支持带转发来源的消息，请将这条消息无引用转发给我。')
        }
        
        if(ctx.message.media_group_id) {
            
            await saveMediaMessages(ctx.message)
            
            media_group = await getMediaGroup(ctx.message.chat.id, ctx.message.media_group_id ? ctx.message.media_group_id : ctx.message.message_id.toString())
        }

        if(media_group?.medias.length === 1 || !ctx.message.media_group_id) await ctx.reply('确认为此消息创建一条引用？', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '创建', callback_data: 'create' },
                    { text: '取消', callback_data: 'cancel' }
                ]]
            },
            reply_to_message_id: ctx.message.message_id
        })
    })

export default incoming