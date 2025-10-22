import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ReelImage {
  image: string;
  thumbImage?: string;
  caption?: string;
  // optional runtime flag:
  __loaded?: boolean;
}

export interface ReelDialogData {
  images: ReelImage[];
  startIndex?: number;
  fromComponent?: string;
}

@Component({
  selector: 'app-reel-dialog',
  templateUrl: './reel-dialog.component.html',
  styleUrls: ['./reel-dialog.component.css'],
})
export class ReelDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  // the normalized list used by template
  reelimages: ReelImage[] = [];
  currentIndex = 0;

  // autoplay config
  private autoplayMs = 3000;
  private autoplayTimer: any = null;
  private isPaused = false;

  // preload / load tracking
  private loadedCount = 0;
  private autoplayStarted = false;

  // swipe tracking
  private touchStartX = 0;
  private touchCurrentX = 0;
  private swipeThreshold = 40; // px

  // passive listener refs for cleanup
  private touchStartHandler = (e: TouchEvent) => this.onTouchStart(e);
  private touchMoveHandler = (e: TouchEvent) => this.onTouchMove(e);
  private touchEndHandler = (e: TouchEvent) => this.onTouchEnd(e);

  // optional small visual flag to avoid ExpressionChangedAfterItHasBeenCheckedError
  show = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReelDialogData | ReelImage[] | any,
    private dialogRef: MatDialogRef<ReelDialogComponent>,
    private elRef: ElementRef<HTMLElement>,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Normalize injected data:
    const raw = this.data;
    console.log('ReelDialog: raw injected data:', raw);

    if (Array.isArray(raw)) {
      this.reelimages = raw as ReelImage[];
    } else if (raw && Array.isArray(raw.images)) {
      this.reelimages = raw.images as ReelImage[];
      this.currentIndex = Number.isFinite(raw.startIndex) ? raw.startIndex : 0;
    } else {
      this.reelimages = [];
    }

    // clamp start index
    if (this.currentIndex < 0) this.currentIndex = 0;
    if (this.currentIndex >= this.reelimages.length) this.currentIndex = 0;

    if (!this.reelimages.length) {
      console.warn('ReelDialog opened with no images.');
    }
  }

  ngAfterViewInit(): void {
    // Avoid ExpressionChangedAfterItHasBeenCheckedError by toggling show in next tick
    setTimeout(() => {
      this.show = true;
      this.cdr.detectChanges();
    }, 0);

    // Attach passive touch listeners on the component root to avoid console warnings
    const root = this.elRef.nativeElement;
    root.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    root.addEventListener('touchmove', this.touchMoveHandler, { passive: true });
    root.addEventListener('touchend', this.touchEndHandler, { passive: true });

    // If images are already cached and we want autoplay immediately, we can start.
    // But we prefer to start autoplay only after first image load to avoid flickers.
    // If you want immediate autoplay despite loads, uncomment below:
    // if (this.reelimages.length && !this.autoplayStarted) { this.startAutoplay(); this.autoplayStarted = true; }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    const root = this.elRef.nativeElement;
    try {
      root.removeEventListener('touchstart', this.touchStartHandler as EventListener);
      root.removeEventListener('touchmove', this.touchMoveHandler as EventListener);
      root.removeEventListener('touchend', this.touchEndHandler as EventListener);
    } catch (e) {
      // ignore
    }
  }

  // ---------- onImageLoad called from template <img (load)="onImageLoad(i)"> ----------
  onImageLoad(index: number): void {
    this.loadedCount++;
    if (this.reelimages[index]) {
      this.reelimages[index].__loaded = true;
    }

    // start autoplay only after first image load (prevents flicker)
    if (!this.autoplayStarted) {
      this.autoplayStarted = true;
      // ensure any previous timer is cleared
      this.stopAutoplay();
      this.startAutoplay();
    }
    // debug:
    // console.log(`image ${index} loaded (${this.loadedCount}/${this.reelimages.length})`);
  }

  // ---------- Autoplay control ----------
  private startAutoplay() {
    if (this.autoplayTimer) return;
    this.ngZone.runOutsideAngular(() => {
      this.autoplayTimer = setInterval(() => {
        if (!this.isPaused && this.reelimages.length > 0) {
          this.ngZone.run(() => {
            this.nextSlide();
            this.cdr.markForCheck();
          });
        }
      }, this.autoplayMs);
    });
  }

  private stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  pauseAutoplay() {
    this.isPaused = true;
  }

  resumeAutoplay() {
    this.isPaused = false;
  }

  // ---------- Slide navigation ----------
  prevSlide() {
    if (!this.reelimages.length) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.reelimages.length) % this.reelimages.length;
  }

  nextSlide() {
    if (!this.reelimages.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.reelimages.length;
  }

  goToSlide(index: number) {
    if (index >= 0 && index < this.reelimages.length) {
      this.currentIndex = index;
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  // ---------- Keyboard navigation ----------
  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.pauseAutoplay();
      this.nextSlide();
    } else if (event.key === 'ArrowLeft') {
      this.pauseAutoplay();
      this.prevSlide();
    } else if (event.key === 'Escape') {
      this.onClose();
    }
  }

  // ---------- Touch swipe handlers ----------
  onTouchStart(ev: TouchEvent) {
    if (!ev.touches || !ev.touches.length) return;
    this.touchStartX = ev.touches[0].clientX;
    this.touchCurrentX = this.touchStartX;
    this.pauseAutoplay();
  }

  onTouchMove(ev: TouchEvent) {
    if (!ev.touches || !ev.touches.length) return;
    this.touchCurrentX = ev.touches[0].clientX;
    // optional: add drag transform for preview
  }

  onTouchEnd(_ev: TouchEvent) {
    const delta = this.touchCurrentX - this.touchStartX;
    if (Math.abs(delta) >= this.swipeThreshold) {
      if (delta < 0) {
        // swipe left => next
        this.nextSlide();
      } else {
        // swipe right => prev
        this.prevSlide();
      }
    }
    this.touchStartX = 0;
    this.touchCurrentX = 0;
    this.resumeAutoplay();
  }
}
