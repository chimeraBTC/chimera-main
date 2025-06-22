import mongoose from "mongoose";

const NFTData = new mongoose.Schema({
  name: { type: String, required: true },
  count: { type: Number, required: true },
});

const NFTDataModel = mongoose.model("NFTData", NFTData);

export default NFTDataModel;
