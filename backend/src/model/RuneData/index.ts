import mongoose from "mongoose";

/**
 * RuneData Schema
 * 
 * Defines the structure for storing Rune token data in MongoDB.
 * This schema tracks Rune token transactions, their amounts, and associated UTXOs.
 */
const RuneData = new mongoose.Schema({
    /**
     * Unique identifier for the Rune token
     * @type {string}
     * @required
     * @index - Indexed for faster lookups
     */
    runeID: { 
        type: String, 
        required: true,
        index: true 
    },
    
    /**
     * Amount of Rune tokens in this transaction
     * @type {number}
     * @required
     * @min 0 - Ensures non-negative amounts
     */
    runeAmount: { 
        type: Number, 
        required: true,
        min: 0
    },
    
    /**
     * Transaction ID where these Runes were created or transferred
     * @type {string}
     * @required
     * @index - Indexed for faster lookups
     */
    txid: { 
        type: String, 
        required: true,
        index: true 
    },
    
    /**
     * Output index in the transaction (vout)
     * @type {number}
     * @required
     * @min 0 - Output index is always non-negative
     */
    vout: { 
        type: Number, 
        required: true,
        min: 0
    }
}, {
    // Enable automatic timestamps for document creation and updates
    timestamps: true,
    
    // Enable versioning for optimistic concurrency control
    optimisticConcurrency: true
});

// Create and export the RuneData model
const RuneDataModel = mongoose.model("RuneData", RuneData);

export default RuneDataModel;