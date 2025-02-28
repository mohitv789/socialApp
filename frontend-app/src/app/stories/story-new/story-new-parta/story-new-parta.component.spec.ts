import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryNewPartaComponent } from './story-new-parta.component';

describe('StoryNewPartaComponent', () => {
  let component: StoryNewPartaComponent;
  let fixture: ComponentFixture<StoryNewPartaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoryNewPartaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryNewPartaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
