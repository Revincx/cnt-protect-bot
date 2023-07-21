import { Composer } from "grammy"
import createCommand from "./create"
import incoming from "./incoming"
import callback from "./callback"
import sendCommand from "./send"

const combined = new Composer()

combined.use(createCommand)
combined.use(sendCommand)
combined.use(incoming)
combined.use(callback)

export default combined