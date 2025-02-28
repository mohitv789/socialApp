import { Component, Input, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Reel } from 'src/app/stories/models/Reel';
import { ReelComment } from 'src/app/stories/models/ReelComment';
import { ReelsHTTPService } from 'src/app/stories/services/reels.service';

@Component({
  selector: 'app-reel-item',
  templateUrl: './reel-item.component.html',
  styleUrls: ['./reel-item.component.css']
})
export class ReelItemComponent implements OnInit{
  @Input() reel!: Reel;
  @Input() index!: number;
  @Input() storyId!: string;
  commentNumbers: number = 0;
  totalLikes: number = 0;
  totalLoves: number = 0;
  totalCelebrates: number = 0;
  constructor(private router: Router, private rService: ReelsHTTPService) {}

  ngOnInit(): void {
    this.totalLikes = this.reel.likes?.length || 0;
    this.totalLoves = this.reel.loves?.length || 0;
    this.totalCelebrates = this.reel.celebrates?.length || 0;
    this.rService.fetchReelComments(this.reel.id).subscribe((res: ReelComment[]) => {
      this.commentNumbers = res.length;
    })
  }

  goToReelDetail(reelId: string) {
    const navigationExtras: NavigationExtras = {state: {example: this.storyId}};
    this.router.navigateByUrl('/reel/detail/' + reelId, navigationExtras);
  }
}
