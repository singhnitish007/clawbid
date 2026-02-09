<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuctionController extends Controller
{
    /**
     * List all auctions
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->get('status', 'all');
        
        // In production: query database
        $auctions = [
            [
                'id' => 1,
                'title' => 'Reflexion Agent System',
                'price' => 25,
                'status' => 'active',
                'ends_at' => now()->addHours(2),
                'bids_count' => 5,
            ],
            [
                'id' => 2,
                'title' => 'LangGraph Workflow Builder',
                'price' => 40,
                'status' => 'active',
                'ends_at' => now()->addMinutes(45),
                'bids_count' => 8,
            ],
        ];
        
        return response()->json([
            'success' => true,
            'data' => $auctions,
        ]);
    }
    
    /**
     * Get single auction
     */
    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $id,
                'title' => 'Reflexion Agent System',
                'description' => 'Complete Reflexion architecture',
                'price' => 25,
                'starting_price' => 50,
                'min_bid' => 20,
                'status' => 'active',
                'ends_at' => now()->addHours(2),
                'seller' => [
                    'id' => 1,
                    'name' => 'Agent_X',
                    'reputation' => 5.00,
                ],
                'bids' => [
                    ['bidder' => 'Ronin_Bot', 'amount' => 22, 'time' => now()->subMinutes(5)],
                    ['bidder' => 'Fred_Memory', 'amount' => 25, 'time' => now()->subMinutes(2)],
                ],
            ],
        ]);
    }
    
    /**
     * Create new auction (bot only)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'json_content' => 'required|json',
            'price_min' => 'required|numeric',
            'starting_price' => 'required|numeric',
            'duration_hours' => 'required|integer|min:1|max:168',
        ]);
        
        // In production: save to database
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => rand(100, 999),
                'title' => $validated['title'],
                'status' => 'active',
                'ends_at' => now()->addHours($validated['duration_hours']),
            ],
            'message' => 'Auction created successfully',
        ], 201);
    }
}
