import { Injectable, OnDestroy } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Observable, Subject } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {


  constructor(){}
  private unsubscribe$ = new Subject<void>();
  private socket: WebSocketSubject<any> | undefined;
  private messageSubject = new Subject<any>();
  startWebSocket(chatroom_id: any): void {
    const url = `ws://localhost:8080/ws/${chatroom_id}/`;
    this.socket = webSocket({
      url: url,
      openObserver: {
        next: (res) => {
          console.log('Connection ok');
          console.log(url);
        }
      },
      closeObserver: {
        next(closeEvent) {

          if (closeEvent.code === 4001) {
            console.log("Connection closed due to unauthenticated response from backend!");
          }
        }
      }
    });

    this.socket.subscribe({
      next: (msg) => {
        console.log('message received from: ' + msg["new_message"]["sender"]);
        this.messageSubject.next(msg);
      }, // Called whenever there is a message from the server.
      error: (err) => {
        console.log(err);
      }, // Called if at any point WebSocket API signals some kind of error.
      complete: () => {
        console.log('socket connection complete');
      } // Called when connection is closed (for whatever reason).
     });
  }

  sendMSG(content: any): void {
    if (this.socket && !this.socket.closed) {
      this.socket.next({ content });
      console.log(content);

    } else {
      console.error('WebSocket is not open');
    }
  }

  closeWebSocket(): void {
    this.unsubscribe$.next(); // Unsubscribe from the WebSocketSubject
    this.unsubscribe$.complete();
    if (this.socket && !this.socket.closed) {
      this.socket.complete(); // Close the WebSocketSubject
    }
  }

  getMessageObservable(): Observable<any> {
    return this.messageSubject.asObservable();
  }


  ngOnDestroy(): void {
    this.messageSubject.complete();
    this.closeWebSocket(); // Close WebSocket connection on component destroy
  }
}
