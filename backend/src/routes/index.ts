/**
 * Main routes index file for the CHIMERA backend API
 * 
 * This file serves as the central export point for all route modules in the application.
 * It aggregates and re-exports route handlers from their respective modules,
 * making them easily importable from a single location.
 */

// Import route handlers from their respective modules
import GeneratePSBTRoute from "./generatePSBT";  // Handles PSBT generation for token swaps
import UserRoute from "./user";                     // Handles user-related endpoints
import ETFRoute from "./ETFswap";                   // Handles ETF swap operations

// Export all route handlers as named exports
export { 
  GeneratePSBTRoute,  // Route handler for generating PSBTs for token swaps
  UserRoute,          // Route handler for user management operations
  ETFRoute           // Route handler for ETF swap functionality
};
