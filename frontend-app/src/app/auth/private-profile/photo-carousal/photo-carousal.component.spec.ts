import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoCarousalComponent } from './photo-carousal.component';

describe('PhotoCarousalComponent', () => {
  let component: PhotoCarousalComponent;
  let fixture: ComponentFixture<PhotoCarousalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhotoCarousalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoCarousalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
