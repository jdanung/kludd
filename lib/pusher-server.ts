import Pusher from 'pusher'

function cleanEnv(val: string | undefined): string {
  if (!val) return ''
  // Ta bort ALLA radbrytningar, mellanslag i början/slutet och andra skräptecken
  return val
    .replace(/[\r\n\t]/g, '') // Ta bort radbrytningar, tabbar
    .replace(/\s+$/g, '') // Ta bort whitespace i slutet
    .replace(/^\s+/g, '') // Ta bort whitespace i början
    .trim()
}

let pusherServer: Pusher | null = null

export function getPusherServer(): Pusher {
  const appId = cleanEnv(process.env.PUSHER_APP_ID) || 'placeholder'
  const key = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_KEY) || 'placeholder'
  const secret = cleanEnv(process.env.PUSHER_SECRET) || 'placeholder'
  const cluster = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_CLUSTER) || 'eu'

  if (!pusherServer) {
    pusherServer = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    })
  }
  return pusherServer
}
