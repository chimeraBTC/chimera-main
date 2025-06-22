import mongoose from "mongoose";

const RuneData = new mongoose.Schema({
    runeID: { type: String, required: true },
    runeAmount: { type: Number, required: true },
    txid: { type: String, required: true },
    vout: { type: Number, required: true }
});

const RuneDataModal = mongoose.model("RuneData", RuneData);

export default RuneDataModal;