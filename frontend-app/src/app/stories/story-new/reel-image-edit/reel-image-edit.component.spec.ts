import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReelImageEditComponent } from './reel-image-edit.component';

describe('ReelImageEditComponent', () => {
  let component: ReelImageEditComponent;
  let fixture: ComponentFixture<ReelImageEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReelImageEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReelImageEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
