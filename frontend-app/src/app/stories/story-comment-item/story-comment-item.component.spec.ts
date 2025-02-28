import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryCommentItemComponent } from './story-comment-item.component';

describe('StoryCommentItemComponent', () => {
  let component: StoryCommentItemComponent;
  let fixture: ComponentFixture<StoryCommentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoryCommentItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryCommentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
