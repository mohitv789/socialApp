import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-fast-thumbnail',
  templateUrl: './thumbnail-video.component.html',
  styleUrls: ['./thumbnail-video.component.css']
})
export class ThumbnailVideoComponent implements OnInit, OnDestroy {
  @Input() images: string[] = [];          // list of image URLs to cycle through
  @Input() fps = 2;                        // frames per second (2 = 2 images / sec)
  @Input() loop = true;                    // loop playback
  @Input() preload = true;                 // preload images for smooth playback
  @Output() clicked = new EventEmitter<void>();

  activeIndex = 0;
  playing = true;
  private sub?: Subscription;
  private imgObjs: HTMLImageElement[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.preload) this.preloadImages();
    this.start();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private preloadImages() {
    this.imgObjs = this.images.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }

  private start() {
    this.stop();
    if (!this.images || this.images.length <= 1) return;
    const delayMs = Math.max(50, Math.round(1000 / this.fps)); // lower cap 50ms
    this.playing = true;
    this.sub = interval(delayMs).subscribe(() => {
      if (!this.playing) return;
      this.activeIndex++;
      if (this.activeIndex >= this.images.length) {
        if (this.loop) this.activeIndex = 0;
        else {
          this.activeIndex = this.images.length - 1;
          this.stop();
        }
      }
      this.cdr.markForCheck();
    });
  }

  private stop() {
    if (this.sub) { this.sub.unsubscribe(); this.sub = undefined; }
    this.playing = false;
  }

  // Pause on hover
  @HostListener('mouseenter')
  onMouseEnter() { this.playing = false; }

  @HostListener('mouseleave')
  onMouseLeave() { this.playing = true; }

  // expose simple controls
  pause() { this.playing = false; }
  play() { this.playing = true; }
  reset() { this.activeIndex = 0; this.cdr.markForCheck(); }

  onClick() {
    this.clicked.emit();
  }

  private errorRetries = new Set<string>();

onImgError(ev: Event) {
  const img = ev.target as HTMLImageElement;
  const failedSrc = img.src;

  // avoid infinite retry loops
  if (this.errorRetries.has(failedSrc)) {
    img.src = 'assets/placeholder.png';
    return;
  }

  // Try to derive an original (non-thumb) URL by removing '/thumbs' from path
  try {
    const url = new URL(failedSrc, window.location.origin);
    const newPath = url.pathname.replace(/\/thumbs\/?/, '/');
    const fallback = url.origin + newPath + (url.search || '');

    // if fallback is the same as failedSrc, avoid retry
    if (fallback && fallback !== failedSrc) {
      this.errorRetries.add(failedSrc);
      img.src = fallback; // browser will try to load this now
      return;
    }
  } catch (e) {
    // ignore URL parsing errors
  }

  // final fallback
  img.src = 'assets/placeholder.png';
}
}
