import { Room, Client } from "colyseus";
import { Entity } from "./Entity";
import { State } from "./State";

interface MouseMessage {
  x: number;
  y: number;
}

export class MyRoom extends Room<State> {

  onCreate() {
    this.setState(new State());
    this.state.initialize();

    this.onMessage("mouse", (client, message: MouseMessage) => {
      const entity = this.state.entities[client.sessionId];
      
      // skip dead players
      if (!entity) {
        client.send("kickMessage", { message: "m đã chết, out ra chơi lại đê" })
        
        return;
      }

      // change angle
      const dst = Entity.distance(entity, message as Entity);
      entity.speed = (dst < 20) ? 0 : Math.min(dst / 15, 4);
      entity.angle = Math.atan2(entity.y - message.y, entity.x - message.x);
    });

    this.onMessage("kick", (client) => {
      // Gửi message "kick" cho client trước khi disconnect
      this.sendKickMessage(client);

      // Sau đó, ngắt kết nối client
      this.kickClient(client);
    });

    this.setSimulationInterval(() => this.state.update());
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "JOINED");
    this.state.createPlayer(client.sessionId);
    const newPlayer = {
      id: client.id,
      name: client.sessionId,
      status: "joined"
    }
    const listCurrentPlayers = this.clients.map(client => {
      return {
        id: client.id,
        name: client.sessionId,
        status: "joined"
      }
    })
    
    this.broadcast("newPlayer", { newPlayer, listCurrentPlayers });
  }

  onLeave(client: Client) {
    console.log(client.sessionId, "LEFT!");
    const entity = this.state.entities[client.sessionId];
    const player = {
      id: client.id,
      name: client.sessionId,
      status: "left"
    }
    this.broadcast("removePlayer", player);
    // entity may be already dead.
    if (entity) { entity.dead = true; }
  }

  kickClient(client) {
    // Disconnect the client from the room
    client
    console.log(`Client ${client.sessionId} has been kicked from the room.`);
  }
  sendKickMessage(client) {
    client.send("kickMessage", { message: "You have been kicked from the room." });
  }
}
