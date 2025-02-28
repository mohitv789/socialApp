import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryNewPartbComponent } from './story-new-partb.component';

describe('StoryNewPartbComponent', () => {
  let component: StoryNewPartbComponent;
  let fixture: ComponentFixture<StoryNewPartbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoryNewPartbComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryNewPartbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
