import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReelCommentItemComponent } from './reel-comment-item.component';

describe('ReelCommentItemComponent', () => {
  let component: ReelCommentItemComponent;
  let fixture: ComponentFixture<ReelCommentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReelCommentItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReelCommentItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
