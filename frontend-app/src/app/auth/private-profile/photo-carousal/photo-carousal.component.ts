import { Component, OnInit, ViewChild } from '@angular/core';
import { ReelsHTTPService } from 'src/app/stories/services/reels.service';
import { StoryHTTPService } from 'src/app/stories/services/stories.service';
import { ProfileHTTPService } from '../../services/profile.service';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-photo-carousal',
  templateUrl: './photo-carousal.component.html',
  styleUrls: ['./photo-carousal.component.css'],
})
export class PhotoCarousalComponent implements OnInit{
  photo_activity:any = []
  @ViewChild("photoCarousel") carousel!: NgbCarousel;
  constructor(private pService: ProfileHTTPService, private sService: StoryHTTPService, private rService: ReelsHTTPService) {}

  ngOnInit() {
    this.showPhotos();
    setTimeout(() => {
      console.log(this.photo_activity);
    }, 200);
  }

  showPhotos() {
    this.pService.fetchPhotos().subscribe((data:any) => {
      if (data["storyphotos"].length > 0) {
        data["storyphotos"].forEach((sPhotoItem: any) => {

          this.photo_activity.push({
            image: sPhotoItem.story_image,
            title: sPhotoItem.story_title,
            likes: sPhotoItem.story_likes,
            loves: sPhotoItem.story_loves,
            celebrates: sPhotoItem.story_celebrates,
            comments:sPhotoItem.story_comments
          })

        })
      }
      if (data["reelphotos"].length > 0) {
        data["reelphotos"].forEach((rPhotoItem: any) => {

          this.photo_activity.push({
            image: rPhotoItem.reel_image,
            title: rPhotoItem.reel_caption,
            likes: rPhotoItem.reel_likes,
            loves: rPhotoItem.reel_loves,
            celebrates: rPhotoItem.reel_celebrates,
            comments:rPhotoItem.reel_comments
          })

        })
      }
    })
  }

}
