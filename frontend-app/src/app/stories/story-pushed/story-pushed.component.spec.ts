import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryPushedComponent } from './story-pushed.component';

describe('StoryPushedComponent', () => {
  let component: StoryPushedComponent;
  let fixture: ComponentFixture<StoryPushedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoryPushedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryPushedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
