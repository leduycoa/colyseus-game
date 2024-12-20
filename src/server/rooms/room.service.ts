import { matchMaker } from "colyseus";

export async function getRooms() {
  const rooms = await matchMaker.query({ name: "my_room" });
  return rooms;
}