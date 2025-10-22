import { Component, Input } from '@angular/core';
import { Story } from '../../models/Story';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { StoryHTTPService } from '../../services/stories.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Reel } from '../../models/Reel';
import { ReelDialogComponent } from '../../reel/reel-dialog/reel-dialog.component';
import { StoryComment } from '../../models/StoryComment';

@Component({
  selector: 'app-pushed-item',
  templateUrl: './pushed-item.component.html',
  styleUrls: ['./pushed-item.component.css']
})
export class PushedItemComponent {
  @Input() story!: Story;
  @Input() feed_stories_comments!: any;
  reels: object[] = [];
  likeNumbers!: number | undefined;
  loveNumbers!: number| undefined;
  celebrateNumbers!: number| undefined;
  commentNumbers!: number| undefined;
  constructor(private route: ActivatedRoute,private sService: StoryHTTPService,private router: Router,
    private dialog: MatDialog) {}

  ngOnInit(): void {


    this.story.reels.forEach((reelItem: Reel) => {
      this.reels.push({
        image: 'http://localhost:4500' + reelItem.image,
        thumbImage: 'http://localhost:4500' + reelItem.image,
        title: reelItem.caption
      })
    })
    // this.sService.fetchComments(this.story.id).subscribe((res: StoryComment[]) => {
    //   this.commentNumbers = res.length;
    // })

    setTimeout(() => {
      if (!!this.story) {
        this.likeNumbers = this.story.likes?.length;
        this.loveNumbers = this.story.loves?.length;
        this.celebrateNumbers = this.story.celebrates?.length;
        this.feed_stories_comments.forEach((item:any)=>{
          if (item.story_id == this.story.id) {
            this.commentNumbers = item.num_comments;
          }
        })
      }
    }, 100);

  }


  goToFeedReelList() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.disableClose = true;
    
    dialogConfig.panelClass = ['custom-modalbox', 'center-dialog']
    dialogConfig.hasBackdrop = true;
    dialogConfig.backdropClass = 'custom-backdrop'; // ensure CSS targets overlay
    dialogConfig.width = '90vw';
    dialogConfig.height = '90vh';                       // set explicit height
    dialogConfig.maxWidth = '1100px';
    dialogConfig.maxHeight = '90vh';
    dialogConfig.data = {
      images: this.reels,       // array of ReelImage
      startIndex: 0,
      fromComponent: 'PushedItemComponent'
    }
    this.dialog.open(ReelDialogComponent, dialogConfig);
  }

  goToStoryDetail() {
    console.log(this.story.id);

    this.router.navigate(['/feed/' + this.story.id]);
  }


}
