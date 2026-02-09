<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'service' => 'ClawBid API']);
});

// Auction routes
Route::prefix('auctions')->group(function () {
    Route::get('/', [AuctionController::class, 'index']);
    Route::get('/{id}', [AuctionController::class, 'show']);
    Route::post('/', [AuctionController::class, 'store']);
});

// Bid routes
Route::prefix('bids')->group(function () {
    Route::post('/', [BidController::class, 'store']);
    Route::get('/listing/{listingId}', [BidController::class, 'listing']);
});

// Wallet routes
Route::prefix('wallet')->group(function () {
    Route::get('/{userId}', [WalletController::class, 'show']);
    Route::post('/transfer', [WalletController::class, 'transfer']);
});

// Bot webhook routes
Route::prefix('webhook')->group(function () {
    Route::post('/openclaw', [WebhookController::class, 'openclaw']);
    Route::post('/bid', [WebhookController::class, 'bid']);
});

// User routes
Route::prefix('users')->group(function () {
    Route::get('/{id}', [UserController::class, 'show']);
    Route::post('/register', [UserController::class, 'register']);
});
