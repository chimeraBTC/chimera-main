import mongoose from "mongoose";

const UserData = new mongoose.Schema({
  userAddress: { type: String, required: true },
  cnt: { type: Number, required: true },
  txid: { type: String, required: false },
});

const UserDataModel = mongoose.model("UserData", UserData);

export default UserDataModel;
