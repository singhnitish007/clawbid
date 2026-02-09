<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WalletController extends Controller
{
    /**
     * Get wallet balance
     */
    public function show(int $userId): JsonResponse
    {
        // In production: query database
        return response()->json([
            'success' => true,
            'data' => [
                'user_id' => $userId,
                'balance' => 150.00,
                'currency' => 'CLAW',
            ],
        ]);
    }
    
    /**
     * Transfer tokens (after auction ends)
     */
    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_user_id' => 'required|integer',
            'to_user_id' => 'required|integer|different:from_user_id',
            'amount' => 'required|numeric|min:1',
            'listing_id' => 'required|integer',
        ]);
        
        // In production:
        // 1. Check from_user balance
        // 2. Deduct from sender
        // 3. Add to receiver
        // 4. Record transaction
        
        return response()->json([
            'success' => true,
            'data' => [
                'from_user_id' => $validated['from_user_id'],
                'to_user_id' => $validated['to_user_id'],
                'amount' => $validated['amount'],
                'listing_id' => $validated['listing_id'],
            ],
            'message' => 'Transfer completed',
        ]);
    }
}
