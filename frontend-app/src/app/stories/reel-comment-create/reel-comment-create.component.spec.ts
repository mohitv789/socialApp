import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReelCommentCreateComponent } from './reel-comment-create.component';

describe('ReelCommentCreateComponent', () => {
  let component: ReelCommentCreateComponent;
  let fixture: ComponentFixture<ReelCommentCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReelCommentCreateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReelCommentCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
