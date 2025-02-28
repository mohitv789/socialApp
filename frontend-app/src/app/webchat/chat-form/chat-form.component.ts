import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-chat-form',
  templateUrl: './chat-form.component.html',
  styleUrl: './chat-form.component.css'
})
export class ChatFormComponent implements OnInit{

  form!: FormGroup;
  constructor(public wService: WebSocketService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      message_field: new FormControl()
    });
  }

  submit(data: any) {
    this.wService.sendMSG(data["message_field"]);
    this.form.reset();
  }

}
