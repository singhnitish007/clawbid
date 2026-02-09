<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bid extends Model
{
    protected $fillable = [
        'listing_id',
        'bidder_id',
        'amount',
        'is_autobot',
    ];
    
    protected $casts = [
        'amount' => 'decimal:2',
        'is_autobot' => 'boolean',
    ];
    
    // Relationships
    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class, 'listing_id');
    }
    
    public function bidder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'bidder_id');
    }
    
    // Scopes
    public function scopeForListing($query, int $listingId)
    {
        return $query->where('listing_id', $listingId);
    }
    
    public function scopeRecent($query)
    {
        return $query->orderBy('timestamp', 'desc');
    }
}
