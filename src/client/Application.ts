import * as PIXI from "pixi.js";
import * as Viewport from "pixi-viewport";
import { Room, Client } from "colyseus.js";
import { State } from "../server/rooms/State";

const ENDPOINT = "http://localhost:2567";
const WORLD_SIZE = 2000;
export const lerp = (a: number, b: number, t: number) => (b - a) * t + a;
const listAddress: { [id: string]: { id: string; name: string } } = {};

export class Application extends PIXI.Application {
  entities: { [id: string]: PIXI.Graphics } = {};
  currentPlayerEntity: PIXI.Graphics;
  client = new Client(ENDPOINT);
  room: Room<State>;
  viewport: Viewport;
  _interpolation: boolean;

  constructor() {
    super({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x0c0c0c,
    });

    this.viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: WORLD_SIZE,
      worldHeight: WORLD_SIZE,
    });

    const boundaries = new PIXI.Graphics();
    boundaries.beginFill(0x000000);
    boundaries.drawRoundedRect(0, 0, WORLD_SIZE, WORLD_SIZE, 30);
    this.viewport.addChild(boundaries);

    this.stage.addChild(this.viewport);

    this.connect();
    this.interpolation = false;

    // Event to track the mouse movement and send data
    this.viewport.on("mousemove", (e) => {
      if (this.currentPlayerEntity) {
        const point = this.viewport.toLocal(e.data.global);
        this.room.send("mouse", { x: point.x, y: point.y });
      }
    });
  }

  async connect() {
    this.room = await this.client.joinOrCreate<State>("my_room");
    console.log("room", this.room);

    this.room.state.entities.onAdd((entity, sessionId: string) => {
      const color = entity.radius < 10 ? 0xff0000 : 0xffff0b;
      const graphics = new PIXI.Graphics();
      graphics.lineStyle(0);
      graphics.beginFill(color, 0.5);
      graphics.drawCircle(0, 0, entity.radius);
      graphics.endFill();
      graphics.x = entity.x;
      graphics.y = entity.y;
      this.viewport.addChild(graphics);
      this.entities[sessionId] = graphics;

      if (sessionId === this.room.sessionId) {
        this.currentPlayerEntity = graphics;
        this.viewport.follow(this.currentPlayerEntity);
      }

      entity.onChange(() => {
        const color = entity.radius < 10 ? 0xff0000 : 0xffff0b;
        const graphics = this.entities[sessionId];

        if (!this._interpolation) {
          graphics.x = entity.x;
          graphics.y = entity.y;
        }

        graphics.clear();
        graphics.lineStyle(0);
        graphics.beginFill(color, 0.5);
        graphics.drawCircle(0, 0, entity.radius);
        graphics.endFill();
      });
    });

    this.room.state.entities.onRemove((_, sessionId: string) => {
      this.viewport.removeChild(this.entities[sessionId]);
      this.entities[sessionId].destroy();
      delete this.entities[sessionId];
    });

    // Listen for the "playerList" message
    this.room.onMessage("newPlayer", ({newPlayer, listCurrentPlayers}) => {
      console.log("newPlayer", newPlayer);
      this.initUserList(listCurrentPlayers);
      this.updateUserList(newPlayer);
    });

    // Listen for the "playerList" message
    this.room.onMessage("removePlayer", (player) => {
      console.log("removePlayer", player);
      this.updateUserList(player);
    });

    // Listen for "kickMessage"
    this.room.onMessage("kickMessage", (data) => {
      alert(data.message);
    });
  }


    // Initialize the user list
    initUserList(listCurrentPlayers: any) {
        let userListElement: any = [];
        userListElement = document.getElementById("users");
        userListElement.innerHTML = "";
        listCurrentPlayers.forEach((player: { name: string; id: string; status: string }) => {
            let li = document.createElement("li");
            li.id = player.id;
            li.textContent = player.name;
            userListElement.appendChild(li);
        });
    }

  // Update the UI with the list of users
  updateUserList(player: { name: string; id: string; status: string }) {
    let userListElement: any = [];
    userListElement = document.getElementById("users");
    if (player.status === "joined") {
      // Kiểm tra nếu phần tử li đã tồn tại với id của người chơi
      let existingLi = document.getElementById(player.id);

      if (!existingLi) {
        // Người chơi chưa có trong danh sách, thêm mới vào
        existingLi = document.createElement("li");
        existingLi.id = player.id; // Gắn id để dễ dàng tìm và xóa sau này
        existingLi.textContent = player.name;
        userListElement.appendChild(existingLi);
      } else {
        // Nếu người chơi đã có trong danh sách, có thể cập nhật tên nếu cần
        existingLi.textContent = player.name;
      }
    } else {
      // Xóa người chơi khỏi danh sách
      let existingLi = document.getElementById(player.id);
      if (existingLi) {
        existingLi.remove();
      }
    }
  }

  set interpolation(bool: boolean) {
    this._interpolation = bool;
    if (this._interpolation) {
      this.loop();
    }
  }

  loop() {
    for (let id in this.entities) {
      this.entities[id].x = lerp(
        this.entities[id].x,
        this.room.state.entities[id]?.x,
        0.2
      );
      this.entities[id].y = lerp(
        this.entities[id].y,
        this.room.state.entities[id]?.y,
        0.2
      );
    }

    if (this._interpolation) {
      requestAnimationFrame(this.loop.bind(this));
    }
  }
}
