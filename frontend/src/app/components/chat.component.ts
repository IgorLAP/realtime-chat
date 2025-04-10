import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../services/socket.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  styleUrl: './chat.component.scss',
  templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit {
  mensagem = '';
  mensagens: { mensagem: string; timeStamp: string }[] = [];

  constructor(private socket: SocketService) {}

  ngOnInit() {
    this.socket.getHistory().subscribe((res) => {
      this.mensagens = res.map((msg) => msg);
    });

    this.socket.getMessages().subscribe((msg) => {
      this.mensagens.push({
        mensagem: msg,
        timeStamp: new Date().toISOString(),
      });
    });
  }

  enviar() {
    if (this.mensagem.trim()) {
      this.socket.sendMessage(this.mensagem);
      this.mensagem = '';
    }
  }

  upload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.socket.uploadImage(file).subscribe((url) => {
        this.socket.sendMessage(`[img]${url}`);
      });
    }
  }

  getTimestamp(msg: string): string {
    return new Date(msg).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getImagem(msg: string): string {
    return msg.replace('[img]', '').split('|')[0];
  }
}
