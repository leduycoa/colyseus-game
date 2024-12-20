## Running server and client locally

```

npm install
npm start
```

Open [http://localhost:1234](http://localhost:1234) in your browser.

> The `npm start` runs both `npm run start-client` and `npm run start-server`.
> You need both client and server to test this application.

## Directory structure

```
├── nodemon.json
├── package.json
├── src
│   ├── client
│   │   ├── Application.ts
│   │   ├── index.html
│   │   └── index.ts
│   └── server
│       ├── index.ts
│       └── rooms
│           ├── MyRoom.ts
│           ├── Entity.ts
│           └── State.ts
├── tsconfig.json
└── webpack.config.js
```


MIT
