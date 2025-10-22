import { Component } from '@angular/core';
import { FeedService } from './feed.service';

@Component({
  selector: 'app-feed-app',
  templateUrl: './feed-app.component.html',
  styleUrls: ['./feed-app.component.css']
})
export class FeedAppComponent {

  activities: any[] = [];
  stories: any[] = [];
  reels: any[] = [];
  friendActivities: any[] = [];

  page = 1;
  perPage = 20;
  hasNext = false;
  loading = false;
  error: string | null = null;

  constructor(private feedService: FeedService) {}

  ngOnInit(): void {
    this.load();
  }

  load(more = false) {
    if (this.loading) return;
    this.loading = true;
    this.error = null;
    const pageToLoad = more ? this.page + 1 : 1;
    this.feedService.getCombinedFeed(pageToLoad, this.perPage).subscribe({
      next: (res) => {
        if (more) {
          this.activities = this.activities.concat(res.activities || []);
          this.page = res.activities_page || this.page + 1;
        } else {
          this.activities = res.activities || [];
          this.page = res.activities_page || 1;
          this.stories = res.stories || [];
          this.reels = res.reels || [];
          this.friendActivities = res.friend_activities || [];
        }
        this.hasNext = !!res.activities_has_next;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load feed';
        this.loading = false;
      }
    });
  }

  loadMore() {
    if (!this.hasNext) return;
    this.load(true);
  }

  trackByActivityId(index: number, item: any) {
    return item?.id || index;
  }

}
