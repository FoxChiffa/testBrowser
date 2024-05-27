const express = require("express");
const http = require("http");
const nunjucks = require("nunjucks");
const cors = require('cors')
const { MongoClient, ObjectId } = require('mongodb')
const WebSocket = require("ws");
require('dotenv').config();

const app = express();
app.use(express.static("public"));
app.set("view engine", "njk");
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


const clientPromise = new MongoClient(process.env.DB_URI, {
  useUnifiedTopology: true
})

async function getTimer(db, active = false) {
  let data = {
    type: 'all_timers',
    data: '',
    user: "me"
  };

  if (!active) {
    data.data = await db.collection('timer').find({}).toArray();
  } else {
    data.data = await db.collection('timer').find({isActive : true }).toArray();
    data.type = 'active_timers';
    data.data.forEach((timer) => {
      timer.progress = Date.now() - new Date(timer.start);
    });
  }

  data.data.forEach((timer) => {
    timer.id = timer._id.toString();
  })

  return data;
}

wss.on("connection", async (ws) => {
  this.ws = ws;
  const client = await clientPromise.connect();
  const db = client.db('timer');

  let data = await getTimer(db);

  ws.send(JSON.stringify(data))

  ws.on("message", async (message) => {
    const _message = JSON.parse(message);
    if (_message.type === "create") {
      const description = _message.body;

      await db.collection('timer').insertOne({
        start: Date.now(),
        description: description,
        isActive: true,
        progress: 0
      });

      data = await getTimer(db);
      ws.send(JSON.stringify(data))
    }

    if (_message.type === "stop") {
      const id = _message.body;

      const timer = data.data.filter(function (val) {
        return val._id == id;
      });

      console.log(timer[0]['start']);
      console.log(timer);
      await db.collection('timer').updateOne({ _id: new ObjectId(id) }, {
        $set: {
          isActive: false,
          end: Date.now(),
          duration: Date.now() - new Date(timer[0]['start'])
        }
      })

      data = await getTimer(db);
      ws.send(JSON.stringify(data))
    }
  })

  setInterval(async () => {
    data = await getTimer(db, true);
    ws.send(JSON.stringify(data))
  }, 1000)
})

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

app.get("/", (req, res) => {
  res.render("index");
});

const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
