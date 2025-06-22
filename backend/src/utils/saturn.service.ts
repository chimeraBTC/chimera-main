import axios from "axios";
import { SATURN_KEY } from "../config/config";

export const postSaturnData = async (url: string, params: any) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": SATURN_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.log("Saturn URL => ", error);
    throw error;
  }
};
