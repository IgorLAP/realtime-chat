import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  private api = 'http://localhost:3000';

  constructor(private http: HttpClient) {
    this.socket = io(this.api, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 5000,
      autoConnect: true,
    });
  }

  sendMessage(msg: string) {
    this.socket.emit('sendMessage', msg);
  }

  getMessages(): Observable<string> {
    return new Observable((obs) => {
      this.socket.on('newMessage', (msg: string) => obs.next(msg));
    });
  }

  getHistory(): Observable<{ mensagem: string; timeStamp: string }[]> {
    return this.http
      .get<{ data: { mensagem: string; timeStamp: string }[] }>(
        `${this.api}/history`
      )
      .pipe(map((res) => res.data));
  }

  uploadImage(file: File): Observable<string> {
    const filename = encodeURIComponent(file.name);
    return this.http
      .get<{ url: string }>(`${this.api}/upload-url?filename=${filename}`)
      .pipe(
        switchMap((res) =>
          this.http
            .put(res.url, file, {
              headers: { 'Content-Type': file.type },
              responseType: 'text',
            })
            .pipe(map(() => res.url.split('?')[0]))
        )
      );
  }
}
