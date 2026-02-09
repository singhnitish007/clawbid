<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Listing extends Model
{
    protected $fillable = [
        'seller_id',
        'title',
        'slug',
        'description',
        'json_content',
        'preview_code',
        'thumbnail_url',
        'price_min',
        'price_current',
        'starting_price',
        'starts_at',
        'ends_at',
        'status',
        'auction_type',
    ];
    
    protected $casts = [
        'json_content' => 'array',
        'price_min' => 'decimal:2',
        'price_current' => 'decimal:2',
        'starting_price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];
    
    // Relationships
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
    
    public function bids()
    {
        return $this->hasMany(Bid::class, 'listing_id');
    }
    
    public function transaction()
    {
        return $this->hasOne(TokenTransaction::class, 'reference_id');
    }
    
    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
    
    public function scopeEnded($query)
    {
        return $query->where('status', 'ended');
    }
    
    public function scopeEndingSoon($query, int $minutes = 15)
    {
        return $query->where('status', 'active')
            ->where('ends_at', '<=', now()->addMinutes($minutes));
    }
}
