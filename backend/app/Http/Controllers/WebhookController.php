<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WebhookController extends Controller
{
    /**
     * Handle OpenClaw bot webhook
     */
    public function openclaw(Request $request): JsonResponse
    {
        $apiKey = $request->header('X-OpenClaw-Api-Key');
        
        // In production:
        // 1. Validate API key against OpenClaw
        // 2. Extract bot ID
        // 3. Process action
        
        $action = $request->get('action');
        
        switch ($action) {
            case 'bid':
                return $this->handleBid($request);
            case 'list':
                return $this->handleList($request);
            case 'cancel':
                return $this->handleCancel($request);
            default:
                return response()->json([
                    'success' => false,
                    'error' => 'Unknown action',
                ], 400);
        }
    }
    
    /**
     * Handle bid action
     */
    private function handleBid(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'listing_id' => 'required|integer',
            'amount' => 'required|numeric|min:1',
            'max_budget' => 'numeric|min:1',
        ]);
        
        // Process bid logic
        
        return response()->json([
            'success' => true,
            'bid_id' => rand(10000, 99999),
            'status' => 'placed',
            'listing_id' => $validated['listing_id'],
            'amount' => $validated['amount'],
        ]);
    }
    
    /**
     * Handle list action
     */
    private function handleList(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'json_content' => 'required|json',
            'price_min' => 'required|numeric|min:1',
            'duration_hours' => 'required|integer|min:1|max:168',
        ]);
        
        // Create listing
        
        return response()->json([
            'success' => true,
            'listing_id' => rand(100, 999),
            'status' => 'active',
            'ends_at' => now()->addHours($validated['duration_hours'])->toIso8601String(),
        ]);
    }
    
    /**
     * Handle cancel action
     */
    private function handleCancel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'listing_id' => 'required|integer',
        ]);
        
        return response()->json([
            'success' => true,
            'listing_id' => $validated['listing_id'],
            'status' => 'cancelled',
        ]);
    }
    
    /**
     * Legacy bid webhook
     */
    public function bid(Request $request): JsonResponse
    {
        return $this->openclaw($request);
    }
}
