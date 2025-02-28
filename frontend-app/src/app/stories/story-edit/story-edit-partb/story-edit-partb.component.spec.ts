import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryEditPartbComponent } from './story-edit-partb.component';

describe('StoryEditPartbComponent', () => {
  let component: StoryEditPartbComponent;
  let fixture: ComponentFixture<StoryEditPartbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoryEditPartbComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryEditPartbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
