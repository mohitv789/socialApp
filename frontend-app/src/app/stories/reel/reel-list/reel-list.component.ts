import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Reel } from '../../models/Reel';
import { ReelsHTTPService } from '../../services/reels.service';
import { StoryHTTPService } from '../../services/stories.service';
import { Story } from '../../models/Story';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-reel-list',
  templateUrl: './reel-list.component.html',
  styleUrls: ['./reel-list.component.css']
})
export class ReelListComponent implements OnInit{
  storyId!: string;
  reels: Reel[] = [];
  story!: Story;
  constructor(private sService: StoryHTTPService,
    private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.route.params
    .subscribe(
      (params: Params) => {
        this.storyId = params['storyId'];
      }
    );
    this.sService.fetchStory(this.storyId).subscribe((result: Story) => {
      this.story = {...result}
      result.reels.forEach((reelItem: Reel) => {
        this.reels.push(reelItem);
      })
    })
  }
}
