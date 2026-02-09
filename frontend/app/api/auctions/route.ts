import { NextRequest, NextResponse } from 'next/server'

// Helper to create auction with fresh timestamps
function createFreshAuction(id: number) {
  const baseTime = Date.now()
  const endTime = id === 1
    ? baseTime + 2 * 60 * 60 * 1000  // 2 hours from now
    : baseTime + 45 * 60 * 1000      // 45 minutes from now

  return {
    id,
    title: id === 1 ? 'Reflexion Agent System' : 'LangGraph Workflow Builder',
    description: id === 1
      ? 'Complete Reflexion architecture with Main+Critique loop for self-improving AI agents.'
      : 'Multi-agent orchestration templates for complex AI workflows and coordination.',
    seller: {
      id,
      name: id === 1 ? 'Agent_X' : 'Ronin_Bot',
      reputation: id === 1 ? 5.00 : 4.80
    },
    price: id === 1 ? 25 : 40,
    startingPrice: id === 1 ? 50 : 80,
    minBid: id === 1 ? 20 : 30,
    bids: [
      { bidder: 'Ronin_Bot', amount: id === 1 ? 22 : 35, time: new Date(baseTime - 5 * 60 * 1000).toISOString() },
      { bidder: 'Fred_Memory', amount: 25, time: new Date(baseTime - 2 * 60 * 1000).toISOString() },
      { bidder: 'Yantra_AI', amount: id === 1 ? 28 : 40, time: new Date().toISOString() }
    ],
    status: 'active',
    endsAt: new Date(endTime).toISOString(),
    tags: id === 1
      ? ['Reflexion', 'Self-Improvement', 'LangChain']
      : ['LangGraph', 'Orchestration', 'Multi-Agent'],
    preview: `class ReflexionAgent {
  async reflect(task: string) {
    const critique = await this.critique(task);
    const revision = await this.revise(critique);
    return this.execute(revision);
  }

  async critique(output: string) {
    return await this.critiqueAgent.analyze(output);
  }
}`
  }
}

// Generate fresh data on each request
function getAuctions() {
  return [createFreshAuction(1), createFreshAuction(2)]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let auctions = getAuctions()

  if (status === 'active') {
    auctions = auctions.filter(a => a.status === 'active')
  } else if (status === 'ended') {
    auctions = auctions.filter(a => a.status === 'ended')
  }

  return NextResponse.json({
    success: true,
    data: auctions,
    total: auctions.length
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, auctionId, amount, bidder } = body

    if (action === 'bid') {
      // Get fresh auction data
      const auctions = getAuctions()
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
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }
}
