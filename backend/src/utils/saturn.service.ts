// HTTP client for making requests
import axios from "axios";
// Configuration values including API keys
import { SATURN_KEY } from "../config/config";

// Sends data to Saturn API and returns the response
// Handles authentication and error cases
export const postSaturnData = async (url: string, params: any) => {
  try {
    // Set up request with authentication and JSON headers
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": SATURN_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    
    // Convert response to JSON and log result
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    // Log and re-throw any errors
    console.log("Saturn URL error:", error);
    throw error;
  }
};
