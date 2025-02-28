import { Component } from '@angular/core';
import { Reel } from '../../models/Reel';
import { StoryHTTPService } from '../../services/stories.service';
import { ActivatedRoute, Params } from '@angular/router';
import { ReelsHTTPService } from '../../services/reels.service';

@Component({
  selector: 'app-reel-personal',
  templateUrl: './reel-personal.component.html',
  styleUrls: ['./reel-personal.component.css']
})
export class ReelPersonalComponent {
  userId!: number;
  persReels: Reel[] = [];

  constructor(private rService: ReelsHTTPService,
    private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.route.params
    .subscribe(
      (params: Params) => {
        this.userId = +params['userId'];
      }
    );
    this.rService.fetchReelPersonal(this.userId).subscribe((result: Reel[]) => {
      result.forEach((reelItem: Reel) => {
        this.persReels.push(reelItem);
      })
    })
  }
}
