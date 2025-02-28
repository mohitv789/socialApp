import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryEditPartaComponent } from './story-edit-parta.component';

describe('StoryEditPartaComponent', () => {
  let component: StoryEditPartaComponent;
  let fixture: ComponentFixture<StoryEditPartaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoryEditPartaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryEditPartaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
