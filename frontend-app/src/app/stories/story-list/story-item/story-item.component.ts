import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Story } from '../../models/Story';
import { Router } from '@angular/router';
import { StoryHTTPService } from '../../services/stories.service';
import { StoryComment } from '../../models/StoryComment';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ReelDialogComponent } from '../../reel/reel-dialog/reel-dialog.component';
import { Reel } from '../../models/Reel';

interface ReelImage {
  image: string;
  thumbImage?: string;
  title?: string;
}

interface ReelDialogData {
  images: ReelImage[];
  startIndex?: number;
  fromComponent?: string;
}

@Component({
  selector: 'app-story-item',
  templateUrl: './story-item.component.html',
  styleUrls: ['./story-item.component.css']
})
export class StoryItemComponent implements OnInit, OnDestroy {
  @Input() story!: Story;
  @Input() index!: number;
  @Input() cols!: number;
  @Input() rows!: number;

  // normalized images used for dialog
  reels: ReelImage[] = [];

  // keep track of any created object URLs so we can revoke them later
  private createdObjectUrls: string[] = [];

  likeNumbers!: number | undefined;
  loveNumbers!: number| undefined;
  celebrateNumbers!: number| undefined;
  commentNumbers!: number| undefined;

  constructor(private router: Router, private sService: StoryHTTPService, private dialog: MatDialog) {}

  ngOnInit(): void {
    // fetch comments
    this.sService.fetchComments(this.story.id).subscribe((res: StoryComment[]) => {
      this.commentNumbers = res.length;
    });

    // Synchronously build the reels array in a normalized structure
    if (this.story?.reels && Array.isArray(this.story.reels)) {
      this.reels = this.story.reels.map((reel: Reel) => {
        let imgVal = reel.image as any;
        // If it's a File (local upload preview), convert to object URL
        if (imgVal instanceof File) {
          const url = URL.createObjectURL(imgVal);
          this.createdObjectUrls.push(url);
          return {
            image: url,
            thumbImage: url,
            title: reel.caption ?? undefined
          } as ReelImage;
        }

        // If it's already a string (URL or path), use it directly
        if (typeof imgVal === 'string' && imgVal.length) {
          return {
            image: imgVal,
            thumbImage: (reel as any).thumbImage ?? imgVal,
            title: reel.caption ?? undefined
          } as ReelImage;
        }

        // Fallback: empty url placeholder (so gallery won't break)
        return {
          image: '',
          thumbImage: '',
          title: reel.caption ?? undefined
        } as ReelImage;
      });
    } else {
      this.reels = [];
    }

    // likes / loves / celebrates counts
    this.likeNumbers = this.story?.likes?.length;
    this.loveNumbers = this.story?.loves?.length;
    this.celebrateNumbers = this.story?.celebrates?.length;
  }

  ngOnDestroy(): void {
    // revoke any created object URLs
    for (const u of this.createdObjectUrls) {
      try { URL.revokeObjectURL(u); } catch { /* ignore */ }
    }
    this.createdObjectUrls = [];
  }

  // in component class
  private reelDialogRef: MatDialogRef<ReelDialogComponent> | null = null;

  goToReelList(storyId: string, startIndex = 0) {
    // Close any leftover overlays (safe)
    this.dialog.closeAll();

    const dialogConfig = new MatDialogConfig<ReelDialogData>();
    dialogConfig.autoFocus = true;
    dialogConfig.disableClose = true;
    
    dialogConfig.panelClass = ['custom-modalbox', 'center-dialog']
    dialogConfig.hasBackdrop = true;
    dialogConfig.backdropClass = 'custom-backdrop';
    dialogConfig.width = '90vw';
    dialogConfig.maxWidth = '1100px';
    dialogConfig.height = '90vh';
    dialogConfig.maxHeight = '90vh';
    dialogConfig.position = { top: '5vh' };
    dialogConfig.data = { images: this.reels, startIndex, fromComponent: 'StoryItemComponent' };

    // open and keep reference
    this.reelDialogRef = this.dialog.open(ReelDialogComponent, dialogConfig);

    // cleanup ref on close so next open works reliably
    this.reelDialogRef.afterClosed().subscribe(() => {
      this.reelDialogRef = null;
    });
  }


  goToStoryDetail(storyId: string) {
    this.router.navigateByUrl('/story/' + storyId);
  }
}
