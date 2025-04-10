# Chat em Tempo Real com Angular + Node.js + AWS

Um sistema de chat realtime com upload de imagens, baseado em:

- ✅ Frontend Angular (Socket.IO + Upload com Presigned URL)
- ✅ Backend Node.js (WebSocket + REST + AWS SDK)
- ✅ AWS SQS (mensageria FIFO)
- ✅ AWS DynamoDB (histórico de mensagens)
- ✅ AWS S3 (upload de imagens)
- ✅ AWS EC2 (deploy do backend)
- ✅ S3 Hosting ou CloudFront (para frontend)

---

## 🚀 Funcionalidades

- Envio de mensagens de texto e imagem em tempo real
- Persistência de mensagens no DynamoDB
- Upload de arquivos direto do navegador para o S3
- WebSocket para transmissão imediata via Socket.IO
- Histórico visível ao carregar o chat

---

## ⚙️ Arquitetura

```plaintext
[Frontend Angular]
     |
     | 1. Conexão WebSocket (Socket.IO)
     | 2. HTTP: /historic (GET)
     | 3. HTTP: /upload-url?filename=xyz.png (GET)
     |
[Backend Node.js + Express + Socket.IO]
     |
     | 4. Recebe mensagens via WebSocket
     | 5. Envia para SQS + salva no DynamoDB
     | 6. Gera Presigned URL para uploads
     | 7. Periodicamente lê da SQS e emite para todos os sockets
     |
[AWS]
 ├── SQS (chat.fifo)
 ├── DynamoDB
 └── S3
```

## 🔁 Fluxo detalhado

### ✅ Texto

1. Usuário envia uma mensagem → `socket.emit('sendMessage', msg)`
2. Backend:
   - Enfileira no SQS
   - Salva no DynamoDB
3. Daemon do backend lê do SQS e faz `io.emit('newMessage', msg)`
4. Todas as abas/clientes recebem instantaneamente

---

### 🖼️ Imagem

1. Usuário seleciona imagem → Angular solicita `GET /upload-url`
2. Backend gera uma **Presigned URL** para o S3
3. Angular faz `PUT` diretamente no S3 usando a URL
4. Angular envia mensagem no formato: `[img]https://...s3.amazonaws.com/...`
5. Backend trata como mensagem normal, SQS + DynamoDB
6. Frontend exibe como `<img>` ao detectar `[img]` no começo

---

## 📁 Estrutura do Backend

```
backend/
├── backend.js
├── package.json
├── .env
```

## 🙌 Créditos

Esse projeto foi criado como uma POC (prova de conceito) de integração entre Angular, Node.js e serviços da AWS com foco em escalabilidade, desempenho e tempo real.
