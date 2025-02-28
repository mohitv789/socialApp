import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FriendHTTPService } from '../services/friend.service';

@Component({
  selector: 'app-friend-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.css']
})
export class FriendListComponent implements OnInit{
  friends$!: Observable<any[]>;
  constructor(private fService: FriendHTTPService) {}
  ngOnInit(): void {
    this.friends$ = this.fService.listFriends();
  }
}
