import { Message } from "@grammyjs/types";
import { generateRandomString } from "./util";
import { DEFAULT_EXPIRE, getMediaGroup, saveMediaShortCut, savePlainText, saveTextShortcut, setObject } from "./storage";
import { MediaGroup, MediaType, PlainText } from "../types/Media";

export async function saveMediaMessages(message: Message) {
    let media_group: MediaGroup = {
        type: MediaType.NULL,
        id: message.media_group_id ? message.media_group_id : message.message_id.toString(),
        chat_id: message.chat.id,
        medias: []
    }

    media_group = await getMediaGroup(message.chat.id, media_group.id) || media_group

    if(message.photo) {
        media_group.type = MediaType.PHOTO
        media_group.medias.push({
            message_id: message.message_id,
            file_id: message.photo[message.photo.length - 1].file_id,
            caption: message.caption,
            caption_entities: message.caption_entities
        })
        
    }

    if (message.document) {
            
        media_group.type = MediaType.DOCUMENT
        media_group.medias.push({
            message_id: message.message_id,
            file_id: message.document.file_id,
            caption: message.caption,
            caption_entities: message.caption_entities
        })
    }

    if (message.audio) {
            
        media_group.type = MediaType.AUDIO
        media_group.medias.push({
            message_id: message.message_id,
            file_id: message.audio.file_id,
            caption: message.caption,
            caption_entities: message.caption_entities
        })
    }

    if (message.video) {
                
        media_group.type = MediaType.VIDEO
        media_group.medias.push({
            message_id: message.message_id,
            file_id: message.video.file_id,
            caption: message.caption,
            caption_entities: message.caption_entities
        })
    }

    return await setObject<MediaGroup>(`mg:${message.chat.id}:${media_group.id}`, media_group, DEFAULT_EXPIRE)
}

export async function createSingleMediaShortcut(message: Message) {

    const shortcut_str = generateRandomString()

    await saveMediaMessages(message)
    await saveMediaShortCut(shortcut_str, message.chat.id, message.message_id.toString(), message.from!.id)

    return shortcut_str
}

export async function createSingleTextShortcut(message: Message) {

    const shortcut_str = generateRandomString()

    if(!message.text) throw new Error('The message has no text.')

    let text: PlainText = {
        text: message.text,
        entities: message.entities,
    }

    await savePlainText(message.chat.id, message.message_id, text)
    const result = await saveTextShortcut(shortcut_str, message.chat.id, message.message_id, message.from!.id)

    if(!result) throw new Error('Failed to save shortcut.')

    return shortcut_str
}

export async function createMediaGroupShortcut(chat_id: number, media_group_id: string, owner_id: number) {
    const shortcut_str = generateRandomString()

    const result = await saveMediaShortCut(shortcut_str, chat_id, media_group_id, owner_id)
    if(!result) throw new Error('Failed to save shortcut.')

    return shortcut_str
}