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
        client.send("kickMessage", { message: "You have died, please rejoin." });
        return;
      }

      // change angle
      const dst = Entity.distance(entity, message as Entity);
      entity.speed = (dst < 20) ? 0 : Math.min(dst / 15, 4);
      entity.angle = Math.atan2(entity.y - message.y, entity.x - message.x);
    });

    this.onMessage("kick", (client, message) => {
      // Gửi message "kick" cho client trước khi disconnect
      this.sendKickMessage(client, message );

      // Sau đó, ngắt kết nối client
      this.kickClient(client);
    });
    this.onMessage("kickUser" , (client, options) => {
      // Tìm client theo username
      const clientNeedKick = this.clients.find(c => c.userData === options.userName);
      if (clientNeedKick) {
        // Gửi message "kick" cho client trước khi disconnect
        this.sendKickMessage(clientNeedKick, "You have been kicked by the host.");

        // Sau đó, ngắt kết nối client
        this.kickClient(clientNeedKick);
      }
    })

    

    this.setSimulationInterval(() => this.state.update());
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "JOINED");
    const userName = options.username || client.sessionId;
    client.userData = userName;

    // Lấy username từ options (client gửi đến khi tham gia phòng)
    const username = userName  // Nếu không có username, sử dụng sessionId

    this.state.createPlayer(client.sessionId, username);  // Tạo người chơi trong state với username

    // Gửi thông tin player mới cho tất cả các client
    const newPlayer = {
      id: client.id,
      name: username,  // Gửi tên người chơi
      status: "joined"
    };

    const listCurrentPlayers = this.clients.map(client => {
      return {
        id: client.id,
        name: client.userData,  // Lấy sessionId làm tên tạm thời (có thể được thay thế bởi username)
        status: "joined"
      };
    });

    this.broadcast("newPlayer", { newPlayer, listCurrentPlayers });
  }

  onLeave(client: Client) {
    console.log(client.userData, "LEFT!");
    const player = {
      id: client.id,
      name: client.userData,
      status: "left"
    };
    this.broadcast("removePlayer", player);

    // entity may be already dead.
    const entity = this.state.entities[client.sessionId];
    if (entity) { entity.dead = true; }
  }

  kickClient(client: Client) {
    // Disconnect the client from the room
    const entity = this.state.entities[client.sessionId];
    if (entity) { entity.dead = true; }
    console.log(`Client ${client.sessionId} has been kicked from the room.`);
  }

  sendKickMessage(client: Client, message: string) {
    client.send("kickMessage", { message});
  }
}
