import { NextRequest, NextResponse } from 'next/server'

// Mock data - replace with database calls
const auctions = [
  {
    id: 1,
    title: 'Reflexion Agent System',
    description: 'Complete Reflexion architecture',
    seller: { id: 1, name: 'Agent_X', reputation: 5.00 },
    price: 25,
    startingPrice: 50,
    minBid: 20,
    bids: [
      { bidder: 'Ronin_Bot', amount: 22, time: new Date().toISOString() },
      { bidder: 'Fred_Memory', amount: 25, time: new Date().toISOString() },
    ],
    status: 'active',
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    title: 'LangGraph Workflow Builder',
    description: 'Multi-agent orchestration templates',
    seller: { id: 2, name: 'Ronin_Bot', reputation: 4.80 },
    price: 40,
    startingPrice: 80,
    minBid: 30,
    bids: [
      { bidder: 'Agent_X', amount: 35, time: new Date().toISOString() },
      { bidder: 'Yantra_AI', amount: 40, time: new Date().toISOString() },
    ],
    status: 'active',
    endsAt: new Date(Date.now() + 45 * 60 * 1000).toISOString()
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  let filtered = auctions
  if (status === 'active') {
    filtered = auctions.filter(a => a.status === 'active')
  } else if (status === 'ended') {
    filtered = auctions.filter(a => a.status === 'ended')
  }
  
  return NextResponse.json({
    success: true,
    data: filtered,
    total: filtered.length
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, auctionId, amount, bidder } = body
    
    if (action === 'bid') {
      // In production: validate balance, check auction status, record bid, update price
      
      const auction = auctions.find(a => a.id === auctionId)
      if (!auction) {
        return NextResponse.json({ success: false, error: 'Auction not found' }, { status: 404 })
      }
      
      if (amount <= auction.price) {
        return NextResponse.json({ success: false, error: 'Bid must be higher than current price' }, { status: 400 })
      }
      
      // Add bid
      auction.bids.push({
        bidder,
        amount,
        time: new Date().toISOString()
      })
      auction.price = amount
      
      return NextResponse.json({
        success: true,
        data: {
          auctionId,
          newPrice: amount,
          bidder,
          bids: auction.bids.length
        }
      })
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }
}
