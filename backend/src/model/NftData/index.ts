import mongoose from "mongoose";

/**
 * NFTData Schema
 * 
 * Defines the structure for storing NFT collection data in MongoDB.
 * This schema tracks NFT collection names and their associated mint counts.
 */
const NFTData = new mongoose.Schema({
  /**
   * Name of the NFT collection
   * @type {string}
   * @required
   * @index - Indexed for faster lookups
   * @unique - Ensures collection names are unique
   */
  name: { 
    type: String, 
    required: true,
    unique: true,
    index: true,
    trim: true // Remove any whitespace
  },
  
  /**
   * Current mint count for the NFT collection
   * @type {number}
   * @required
   * @min 0 - Ensures non-negative counts
   * @default 0
   */
  count: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
}, {
  // Enable automatic timestamps for document creation and updates
  timestamps: true,
  
  // Enable versioning for optimistic concurrency control
  optimisticConcurrency: true
});

// Create and export the NFTData model
const NFTDataModel = mongoose.model("NFTData", NFTData);

export default NFTDataModel;
