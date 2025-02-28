import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-friend-item',
  templateUrl: './friend-item.component.html',
  styleUrls: ['./friend-item.component.css']
})
export class FriendItemComponent implements OnInit{
  @Input() friend!: any;
  @Input() index!: number;
  constructor(private router: Router) {}
  ngOnInit(): void {

  }

  goToFriendDetail(friendId:number) {
    this.router.navigateByUrl('/friends/' + friendId);
  }
}
