import axios from "axios";

const deepseekBaseUrl = "https://api.deepseek.com/v1";

const instance = axios.create({
  baseURL: deepseekBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.REACT_APP_DEEPSEEK_API_KEY}`,
  },
});

export default instance;