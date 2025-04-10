require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());

const sqs = new SQSClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: "us-east-1" })
);
const s3 = new S3Client({ region: "us-east-1" });

const QUEUE_URL = process.env.SQS_QUEUE_URL;
const TABLE_NAME = process.env.DYNAMODB_TABLE;
const BUCKET_NAME = process.env.S3_BUCKET;

// WebSocket
io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("sendMessage", async (mensagem) => {
    const timestamp = Date.now();
    const chatId = "global";

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: mensagem,
        MessageGroupId: "chat-group",
        MessageDeduplicationId: timestamp.toString(),
      })
    );

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { chatId, timestamp, mensagem },
      })
    );
  });
});

// Histórico
app.get("/history", async (req, res) => {
  const chatId = "global";
  try {
    const data = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "chatId = :c",
        ExpressionAttributeValues: { ":c": chatId },
        ScanIndexForward: true,
      })
    );
    res.json({
      data: data.Items.map((content) => ({
        mensagem: content.mensagem,
        timeStamp: new Date(content.timestamp),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Presigned URL para upload
app.get("/upload-url", async (req, res) => {
  const { filename } = req.query;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `uploads/${filename}`,
    ContentType: "image/png",
  });
  const url = await getSignedUrl(s3, command, {
    expiresIn: 60,
  });
  res.json({ url });
});

// Daemon para SQS → WebSocket
setInterval(async () => {
  const data = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 1,
    })
  );

  if (data.Messages) {
    for (const msg of data.Messages) {
      io.emit("newMessage", msg.Body);
      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: msg.ReceiptHandle,
        })
      );
    }
  }
}, 2000);

server.listen(3000, () => {
  console.log("Listening on port 3000");
});
