import axios from "axios";

const ax = axios.create({
  baseURL: "/api",
  timeout: 3000,
});

export async function getFavourites() {
  const res = await ax.get("/favourites");
}