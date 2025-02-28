import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryImageEditComponent } from './story-image-edit.component';

describe('StoryImageEditComponent', () => {
  let component: StoryImageEditComponent;
  let fixture: ComponentFixture<StoryImageEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoryImageEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryImageEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
