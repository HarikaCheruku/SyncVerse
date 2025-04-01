import axios from "axios";

const judge0BaseUrl = "https://judge0-ce.p.rapidapi.com";

const instance = axios.create({
  baseURL: judge0BaseUrl,
  headers: {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": process.env.REACT_APP_JUDGE0_API_KEY,
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  },
});

export default instance;