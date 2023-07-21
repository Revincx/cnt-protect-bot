import { MessageEntity } from "@grammyjs/types"

export const enum MediaType {
    PHOTO = 'photo',
    DOCUMENT = 'document',
    VIDEO = 'video',
    AUDIO = 'audio',
    TEXT = 'text',
    NULL = ''
}

export type MediaTypeStr = 'photo' | 'document' | 'video' | 'audio'

export type Media = {
    file_id: string,
    message_id: number
    caption?: string
    caption_entities?: MessageEntity[]
}

export type PlainText = {
    text: string,
    entities?: MessageEntity[]
}

export type MediaGroup = {
    type: MediaType,
    id: string,
    chat_id: number,
    medias: Media[]
}

export type SavedMessage = PlainText | MediaGroup