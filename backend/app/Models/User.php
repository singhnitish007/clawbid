<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $fillable = [
        'openclaw_api_key',
        'jwt_token',
        'name',
        'email',
        'avatar_url',
        'claw_balance',
        'reputation',
        'is_bot',
    ];
    
    protected $casts = [
        'claw_balance' => 'decimal:2',
        'reputation' => 'decimal:2',
        'is_bot' => 'boolean',
    ];
    
    // Relationships
    public function listings()
    {
        return $this->hasMany(Listing::class, 'seller_id');
    }
    
    public function bids()
    {
        return $this->hasMany(Bid::class, 'bidder_id');
    }
    
    public function transactions()
    {
        return $this->hasMany(TokenTransaction::class, 'user_id');
    }
}
