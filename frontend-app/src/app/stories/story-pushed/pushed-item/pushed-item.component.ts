import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Story } from '../../models/Story';
import { ActivatedRoute, Router } from '@angular/router';
import { StoryHTTPService } from '../../services/stories.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ReelDialogComponent } from '../../reel/reel-dialog/reel-dialog.component';
import { Reel } from '../../models/Reel';
import { ReelFileTransferService } from '../../services/reel-file-transfer.service';
import { StoryFileTransferService } from '../../services/story-file-transfer.service';
import { Overlay } from '@angular/cdk/overlay';
@Component({
  selector: 'app-pushed-item',
  templateUrl: './pushed-item.component.html',
  styleUrls: ['./pushed-item.component.css']
})
export class PushedItemComponent implements OnChanges, OnDestroy , OnChanges{

  // track object URLs we create so we can revoke them
  private objectUrls: string[] = [];
  BACKEND_BASE = 'http://localhost:4500';
  ngOnChanges(changes: SimpleChanges) {
    if (changes['story']) {
      // nothing else required here for now — getImageUrl handles the input types
    }
  }

  /**
   * Accepts either a backend path (string) or a File object (from file input).
   * Returns a usable URL for <img src="...">.
   */
  
  @Input() story!: Story;
  @Input() feed_stories_comments!: any;
  reels: object[] = [];
  likeNumbers!: number | undefined;
  loveNumbers!: number| undefined;
  celebrateNumbers!: number| undefined;
  commentNumbers!: number| undefined;
  constructor(private route: ActivatedRoute, private sService: StoryHTTPService, private router: Router,private rfileHttpService: ReelFileTransferService, private sfileHttpService: StoryFileTransferService, 
    private dialog: MatDialog, private overlay:Overlay) {}


  

    

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
    if (this.dialog.openDialogs.length > 0) {
      this.dialog.closeAll();
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['feed-reel-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = true;
    dialogConfig.disableClose = true;
    dialogConfig.backdropClass = 'feed-reel-backdrop';
    
    dialogConfig.scrollStrategy = this.overlay.scrollStrategies.reposition();  
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

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/img/placeholder.png';
  }

  ngOnDestroy() {
    // revoke any created object URLs to avoid memory leaks
    this.objectUrls.forEach(url => {
      try { URL.revokeObjectURL(url); } catch (e) { /* noop */ }
    });
    this.objectUrls = [];
  }

  

  getImageUrl(src?: string | File | null): string {
    const placeholder = 'assets/img/placeholder.png';
    if (!src) return placeholder;

    // If it's a File object (preview scenario)
    if (src instanceof File) {
      try { return URL.createObjectURL(src); } catch { return placeholder; }
    }

    if (typeof src !== 'string') return placeholder;

    // If already absolute URL
    if (/^https?:\/\//.test(src)) return src;

    // If it's like 'static/media/uploads/story/...' or 'uploads/story/...'
    // remove any leading slashes and prefix backend base:
    const cleaned = src.replace(/^\/+/, '');
    return `${this.BACKEND_BASE}/${cleaned}`;
  }

  private maybeThumb(url: string, useThumb: boolean): string {
    if (!useThumb || !url) return url;

    // If backend already gave a distinct field like /static/media/.../thumbs/..., keep it.
    // Otherwise we do not invent new paths blindly, we return the original URL.
    // The thumbnail fallback will be handled by the image error handler in the component.
    return url;
  }

  getAllImagesForStoryAndReel(options: { limit?: number; useThumb?: boolean } = {}): string[] {
    const limit = options.limit ?? 12;
    const useThumb = options.useThumb ?? true;
    const arr: string[] = [];

    if (!this.story) return [];

    // story thumbnail or image
    const sThumb = (this.story as any).thumbImage ?? this.story.image;
    if (sThumb) arr.push(this.getImageUrl(sThumb));

    // reels
    if (Array.isArray(this.story.reels)) {
      for (const r of this.story.reels) {
        const rThumb = (r as any).thumbImage ?? r.image;
        if (rThumb) arr.push(this.getImageUrl(rThumb));
      }
    }

    const unique = Array.from(new Set(arr.filter(Boolean)));
    return unique.slice(0, Math.max(1, limit));
  }

}


