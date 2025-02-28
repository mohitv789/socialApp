import { Component, OnInit } from '@angular/core';
import { Observable, merge } from 'rxjs';
import { Story } from '../models/Story';
import { StoryHTTPService } from '../services/stories.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-story-pushed',
  templateUrl: './story-pushed.component.html',
  styleUrls: ['./story-pushed.component.css']
})
export class StoryPushedComponent implements OnInit {
  story_stories$!: Observable<any>;
  reel_stories$! : Observable<any>;
  stories$! : Observable<any>;
  constructor(private sService: StoryHTTPService) {}
  ngOnInit(): void {
    setTimeout(() => {
      this.story_stories$ = this.sService.fetchPushedStories();
      this.reel_stories$ = this.sService.fetchPushedReelStories();
      this.stories$ = merge(this.story_stories$,this.reel_stories$);
    }, 100);

  }


}
