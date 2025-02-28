import { Component, Input, OnInit } from '@angular/core';
import { Reel } from '../../models/Reel';
import { Router } from '@angular/router';
import { ReelsHTTPService } from '../../services/reels.service';
import { ReelComment } from '../../models/ReelComment';

@Component({
  selector: 'app-pushed-reel-item',
  templateUrl: './pushed-reel-item.component.html',
  styleUrls: ['./pushed-reel-item.component.css']
})
export class PushedReelItemComponent implements OnInit{
  @Input() reel!: Reel;
  @Input() index!: number;
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
    this.router.navigateByUrl('feed/reel/' + reelId);
  }
}
