// Edge API route that runs on Cloudflare's edge network
// For more information see: https://nextjs.org/docs/api-routes/edge-api-routes

import type { NextRequest } from 'next/server'

// Declare this is an edge runtime
export const runtime = 'edge'

// Define response type for better type safety
interface ApiResponse {
  name: string
  timestamp: number
}

/**
 * Edge API handler that returns a simple response
 * Running on the edge provides lower latency and better performance
 */
export default async function handler(
  req: NextRequest
) {
  try {
    // Return JSON response
    return new Response(
      JSON.stringify({
        name: "John Doe",
        timestamp: Date.now()
      } as ApiResponse),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, s-maxage=1200, stale-while-revalidate=600'
        }
      }
    )
  } catch (error) {
    // Handle any errors
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json'
        }
      }
    )
  }
}
