import Pusher from 'pusher-js'
import PusherServer from 'pusher'

// Client-side (for frontend)
export const pusherClient = typeof window !== 'undefined' 
  ? new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  : null

// Server-side (for API routes)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// Channel names
export const AUCTION_CHANNEL = (listingId: number) => `auction-${listingId}`
export const BID_EVENT = 'new-bid'
export const END_EVENT = 'auction-ended'

// Helper to trigger events
export async function triggerBidEvent(listingId: number, bid: { bidder: string; amount: number; time: string }) {
  try {
    await pusherServer.trigger(AUCTION_CHANNEL(listingId), BID_EVENT, bid)
    return true
  } catch (error) {
    console.error('Failed to trigger bid event:', error)
    return false
  }
}

export async function triggerAuctionEnd(listingId: number, winner: { id: number; name: string; amount: number }) {
  try {
    await pusherServer.trigger(AUCTION_CHANNEL(listingId), END_EVENT, winner)
    return true
  } catch (error) {
    console.error('Failed to trigger auction end event:', error)
    return false
  }
}
