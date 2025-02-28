import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushedReelDetailComponent } from './pushed-reel-detail.component';

describe('PushedReelDetailComponent', () => {
  let component: PushedReelDetailComponent;
  let fixture: ComponentFixture<PushedReelDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PushedReelDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PushedReelDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
