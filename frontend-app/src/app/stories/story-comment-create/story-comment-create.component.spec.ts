import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryCommentCreateComponent } from './story-comment-create.component';

describe('StoryCommentCreateComponent', () => {
  let component: StoryCommentCreateComponent;
  let fixture: ComponentFixture<StoryCommentCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoryCommentCreateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryCommentCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
