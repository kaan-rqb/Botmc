const mineflayer = require('mineflayer')
const readline = require('readline')

/* ===== AYARLAR ===== */
const HOST = 'vireno-smp.aternos.me'
const PORT = 25565
const VERSION = '1.20.1'
const BOT_COUNT = 10
const JOIN_DELAY = 20000   // 🔥 20 sn (Aternos için şart)
const PASSWORD = 'test12345'
/* =================== */

const bots = []
let throttled = false

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function randomName() {
  return Math.random().toString(36).slice(2, 8)
}

async function startBots() {
  for (let i = 0; i < BOT_COUNT; i++) {
    if (throttled) break

    const id = i + 1
    console.log(`➡️ Bot ${id} bağlanıyor...`)

    const bot = mineflayer.createBot({
      host: HOST,
      port: PORT,
      version: VERSION,
      username: randomName(),
      hideErrors: true
    })

    bot.id = id
    bot.ready = false
    bot.authed = false
    bot.alive = true

    bot.once('login', () => {
      console.log(`[${id}] Girdi: ${bot.username}`)
    })

    bot.once('spawn', async () => {
      console.log(`[${id}] ✅ Spawn oldu`)
      await sleep(3000) // ⛔ kritik: ilk 3 sn dokunma
      bot.ready = true
    })

    bot.on('message', (msg) => {
      const text = msg.toString().toLowerCase()
      console.log(`[${id}] SERVER: ${text}`)

      if (!bot.authed && text.includes('register')) {
        bot.chat(`/register ${PASSWORD} ${PASSWORD}`)
      }

      if (!bot.authed && text.includes('login')) {
        bot.chat(`/login ${PASSWORD}`)
      }

      if (
        text.includes('başar') ||
        text.includes('logged') ||
        text.includes('success')
      ) {
        bot.authed = true
        console.log(`[${id}] 🔓 AUTH TAMAM`)
      }
    })

    bot.on('kicked', (reason) => {
      const msg = String(reason)
      console.log(`[${id}] KICK: ${msg}`)
      if (msg.toLowerCase().includes('throttle')) {
        throttled = true
      }
    })

    bot.on('error', (err) => {
      console.log(`[${id}] HATA: ${err.code || err.message}`)
      // ❌ PROGRAMI KAPATMIYORUZ
    })

    bot.on('end', () => {
      bot.alive = false
      console.log(`[${id}] ❌ Bağlantı kapandı`)
    })

    bots.push(bot)
    await sleep(JOIN_DELAY)
  }
}

startBots()

/* ===== CHAT CONTROLLER ===== */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log(`
=== CHAT CONTROLLER ===
say <mesaj>
say1 <id> <mesaj>
list
quit
`)

rl.on('line', (line) => {
  const args = line.split(' ')
  const cmd = args.shift()

  if (cmd === 'quit') process.exit(0)

  if (cmd === 'list') {
    bots.forEach(b =>
      console.log(
        `[${b.id}] ${b.username} | ${b.alive ? 'AKTİF' : 'KAPALI'} | ` +
        `${b.ready ? 'READY' : 'WAIT'} | ${b.authed ? 'AUTH' : 'NO-AUTH'}`
      )
    )
  }

  if (cmd === 'say') {
    const msg = args.join(' ')
    bots.forEach(b => {
      if (b.alive && b.ready && b.authed) {
        b.chat(msg)
        console.log(`[${b.id}] 💬 ${msg}`)
      }
    })
  }

  if (cmd === 'say1') {
    const id = Number(args.shift())
    const msg = args.join(' ')
    const b = bots.find(x => x.id === id)
    if (b && b.alive && b.ready && b.authed) {
      b.chat(msg)
      console.log(`[${id}] 💬 ${msg}`)
    }
  }
})
