import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Story } from '../models/Story';
import { StoryHTTPService } from '../services/stories.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Tile } from '../models/Tile';

@Component({
  selector: 'app-story-list',
  templateUrl: './story-list.component.html',
  styleUrls: ['./story-list.component.css']
})
export class StoryListComponent implements OnInit{
  stories$!: Observable<Story[]>;
  isAuth : boolean = false;
  constructor(private sService: StoryHTTPService,
    private router: Router) {}
  ngOnInit(): void {
    this.isAuth = !!AuthService.authEmitter;
    setTimeout(() => {
      this.stories$ = this.sService.fetchStories();
    }, 200);
  }

  onAddStory() {
    this.router.navigate(['story/new']);
  }

}
