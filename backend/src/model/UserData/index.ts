import mongoose from "mongoose";

/**
 * UserData Schema
 * 
 * Defines the structure for storing user-related data in MongoDB.
 * This schema tracks user addresses, their associated counts, and transaction IDs.
 */
const UserData = new mongoose.Schema({
  /**
   * User's blockchain address
   * @type {string}
   * @required
   * @index - Creates an index for faster queries
   */
  userAddress: { 
    type: String, 
    required: true,
    index: true
  },
  
  /**
   * Counter for tracking user-specific metrics (e.g., number of mints)
   * @type {number}
   * @required
   * @default 0
   */
  cnt: { 
    type: Number, 
    required: true,
    default: 0
  },
  
  /**
   * Transaction ID associated with the user's last operation
   * @type {string}
   * @optional
   */
  txid: { 
    type: String, 
    required: false 
  },
}, {
  // Enable automatic timestamps for document creation and updates
  timestamps: true
});

// Create and export the UserData model
const UserDataModel = mongoose.model("UserData", UserData);

export default UserDataModel;
