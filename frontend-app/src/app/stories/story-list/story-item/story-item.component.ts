import { Component, Input, OnInit } from '@angular/core';
import { Story } from '../../models/Story';
import { Router } from '@angular/router';
import { StoryHTTPService } from '../../services/stories.service';
import { StoryComment } from '../../models/StoryComment';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ReelDialogComponent } from '../../reel/reel-dialog/reel-dialog.component';
import { Reel } from '../../models/Reel';

@Component({
  selector: 'app-story-item',
  templateUrl: './story-item.component.html',
  styleUrls: ['./story-item.component.css']
})
export class StoryItemComponent implements OnInit{
  @Input() story!: Story;
  @Input() index!: number;
  @Input() cols!: number;
  @Input() rows!: number;
  reels: object[] = [];
  likeNumbers!: number | undefined;
  loveNumbers!: number| undefined;
  celebrateNumbers!: number| undefined;
  commentNumbers!: number| undefined;
  constructor(private router: Router,private sService: StoryHTTPService,private dialog: MatDialog) {}

  ngOnInit(): void {
    this.sService.fetchComments(this.story.id).subscribe((res: StoryComment[]) => {
      this.commentNumbers = res.length;
    })
    setTimeout(() => {
      if (!!this.story) {
        this.likeNumbers = this.story.likes?.length;
        this.loveNumbers = this.story.loves?.length;
        this.celebrateNumbers = this.story.celebrates?.length;
        this.story.reels.forEach((reel: Reel) => {


          this.reels.push({
            image: reel.image,
          })
        })
      }
    }, 100);

  }

  goToReelList(storyId: string) {
    // this.router.navigateByUrl('/reel/story/' + storyId);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.data = this.reels;
    dialogConfig.backdropClass = 'backdropBackground';
    this.dialog.open(ReelDialogComponent, dialogConfig);
  }




  goToStoryDetail(storyId: string) {
    this.router.navigateByUrl('/story/' + storyId);
  }
}

