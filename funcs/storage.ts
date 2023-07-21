import { kv } from '@vercel/kv'
import { MediaGroup, PlainText, SavedMessage } from '../types/Media'

export const DEFAULT_EXPIRE = process.env.EXPIRE_HOURS ? parseInt(process.env.EXPIRE_HOURS) * 60 * 60 : 12 * 60 * 60

export async function getObject<T>(key: string) {
    const value = await kv.get<string>(key)
    
    return value ? value as T : undefined
}

export async function setObject<T>(key: string, value: T, expire?: number) {
    if(expire) {
        return await kv.set(key, JSON.stringify(value), {
            ex: expire
        })
    }
    else {
        return await kv.set(key, JSON.stringify(value))
    }
}

export async function saveMediaGroup(chat_id: number, media_group: MediaGroup) {
    return await setObject<MediaGroup>(
        `mg:${chat_id}:${media_group.id}`, 
        media_group, 
        60 * 60
    )
}

export async function savePlainText(chat_id: number, message_id: number, text: PlainText) {
    return await setObject<PlainText>(
        `text:${chat_id}:${message_id}`, 
        text, 
        60 * 60
    )
}

export async function getMediaGroup(chat_id: number, media_group_id: string) {
    return await getObject<MediaGroup>(`mg:${chat_id}:${media_group_id}`)
}
 
export async function getPlainText(chat_id: number, message_id: number) {
    return await getObject<PlainText>(`text:${chat_id}:${message_id}`)
}

export async function saveMediaShortCut(shortcut: string, chat_id: number, media_group_id: string, owner_id: number): Promise<boolean>{
    const media_group = await getMediaGroup(chat_id, media_group_id)
    if(!media_group) return false

    await kv.expire(`mg:${chat_id}:${media_group_id}`, DEFAULT_EXPIRE)
    await kv.set<string>(`s:${shortcut}:${owner_id}`, `mg:${chat_id}:${media_group_id}`, { ex: DEFAULT_EXPIRE })

    return true
}

export async function saveTextShortcut(shortcut: string, chat_id: number, message_id: number , owner_id: number): Promise<boolean>{
    const text = await getPlainText(chat_id, message_id)
    if(!text) return false

    await kv.expire(`text:${chat_id}:${message_id}`, DEFAULT_EXPIRE)
    await kv.set<string>(`s:${shortcut}:${owner_id}`, `text:${chat_id}:${message_id}`, { ex: DEFAULT_EXPIRE })

    return true
}

export async function getMessagesByShortcut(shortcut: string, owner_id: number): Promise<SavedMessage & { ref_name: string } | undefined>{
    const ref_name = await kv.get<string>(`s:${shortcut}:${owner_id}`)
    if(!ref_name) return undefined

    const [ object_type ] = ref_name.split(':')

    if(object_type === 'mg') {
        const media_group = await getObject<MediaGroup>(ref_name)
        if(!media_group) return undefined
        return { ...media_group, ref_name }
    }

    if(object_type === 'text') {
        const text = await getObject<PlainText>(ref_name)
        if(!text) return undefined
        return { ...text, ref_name }
    }

    return undefined
}

export async function deleteShourtcut(shortcut:string, owner_id: number) {
    const ref_name = await kv.get<string>(`s:${shortcut}:${owner_id}`)

    if(!ref_name) return false
    
    await kv.del(ref_name)
    await kv.del(`s:${shortcut}:${owner_id}`)

    return true
}