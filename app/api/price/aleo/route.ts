import { NextResponse } from 'next/server';

// In-memory cache for ALEO price
let cachedPrice: { price: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * GET /api/price/aleo
 * Fetches ALEO price from CoinGecko API with aggressive caching
 */
export async function GET() {
  try {
    // Check if we have a valid cached price
    if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        price: cachedPrice.price,
        source: 'cache',
        timestamp: cachedPrice.timestamp
      });
    }

    // Fetch from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=aleo&vs_currencies=usd',
      {
        headers: {
          'Accept': 'application/json'
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      // If we have old cached data, use it even if expired
      if (cachedPrice) {
        console.warn('CoinGecko API error, using stale cache');
        return NextResponse.json({
          price: cachedPrice.price,
          source: 'stale-cache',
          timestamp: cachedPrice.timestamp
        });
      }
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.aleo && data.aleo.usd) {
      // Update cache
      cachedPrice = {
        price: data.aleo.usd,
        timestamp: Date.now()
      };
      
      return NextResponse.json({
        price: cachedPrice.price,
        source: 'coingecko',
        timestamp: cachedPrice.timestamp
      });
    }

    // Fallback to stable price if no data
    return NextResponse.json({
      price: 0.50,
      source: 'fallback',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching ALEO price:', error);
    
    // If we have cached data, use it
    if (cachedPrice) {
      return NextResponse.json({
        price: cachedPrice.price,
        source: 'error-cache',
        timestamp: cachedPrice.timestamp
      });
    }
    
    // Return fallback price on error
    return NextResponse.json({
      price: 0.50,
      source: 'fallback',
      timestamp: Date.now()
    });
  }
}
