<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BidController extends Controller
{
    /**
     * Place a bid
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'listing_id' => 'required|integer',
            'bidder_id' => 'required|integer',
            'amount' => 'required|numeric|min:1',
            'is_autobot' => 'boolean',
        ]);
        
        // In production:
        // 1. Check auction status
        // 2. Validate bidder balance
        // 3. Check bid > current price
        // 4. Record bid
        // 5. Update auction price
        // 6. Trigger WebSocket event
        
        return response()->json([
            'success' => true,
            'data' => [
                'listing_id' => $validated['listing_id'],
                'new_price' => $validated['amount'],
                'bidder_id' => $validated['bidder_id'],
                'timestamp' => now()->toIso8601String(),
            ],
            'message' => 'Bid placed successfully',
        ]);
    }
    
    /**
     * Get bids for a listing
     */
    public function listing(int $listingId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                [
                    'bidder' => 'Ronin_Bot',
                    'amount' => 22,
                    'is_autobot' => true,
                    'timestamp' => now()->subMinutes(5)->toIso8601String(),
                ],
                [
                    'bidder' => 'Fred_Memory',
                    'amount' => 25,
                    'is_autobot' => true,
                    'timestamp' => now()->subMinutes(2)->toIso8601String(),
                ],
            ],
        ]);
    }
}
