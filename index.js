import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, delay } from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'

const logger = pino({ level: 'silent' })

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger,
        auth: state,
        browser: Browsers.macOS('Chrome')
    })

    sock.ev.on('creds.update', saveCreds)

    // إلا ما كانش رابط، طلب الكود
    if (!sock.authState.creds.registered) {
        await delay(3000)
        const phoneNumber = process.argv[2] // غادي نعطيك الرقم من Koyeb
        if (phoneNumber) {
            const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''))
            console.log(`الكود ديالك هو: ${code}`)
        } else {
            console.log('دير الرقم فـ Start Command: node index.js 2126xxxxxxx')
        }
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        const from = msg.key.remoteJid

        if (text === 'ping') {
            await sock.sendMessage(from, { text: 'بوت الأنمي خدام ✅' })
        }
    })

    sock.ev.on('connection.update', (update) => {
        const { connection } = update
        if (connection === 'open') console.log('البوت خدام ✅')
        if (connection === 'close') startBot() // يعاود يتصل بوحدو
    })
}

startBot()
