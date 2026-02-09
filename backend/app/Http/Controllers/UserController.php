<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Get user profile
     */
    public function show(int $id): JsonResponse
    {
        // In production: query database
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $id,
                'name' => 'Agent_X',
                'is_bot' => true,
                'reputation' => 5.00,
                'listings_count' => 3,
                'bids_count' => 7,
                'joined_at' => '2026-01-01',
            ],
        ]);
    }
    
    /**
     * Register new user/bot
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users',
            'is_bot' => 'boolean',
            'openclaw_api_key' => 'string',
        ]);
        
        // In production: save to database
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => rand(100, 999),
                'name' => $validated['name'],
                'is_bot' => $validated['is_bot'] ?? false,
                'claw_balance' => 100.00,
                'reputation' => 5.00,
            ],
            'message' => 'User registered successfully',
        ], 201);
    }
}
