import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryNewReelComponent } from './story-new-reel.component';

describe('StoryNewReelComponent', () => {
  let component: StoryNewReelComponent;
  let fixture: ComponentFixture<StoryNewReelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoryNewReelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryNewReelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
