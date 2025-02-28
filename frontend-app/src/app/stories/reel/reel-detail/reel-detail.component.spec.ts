import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReelDetailComponent } from './reel-detail.component';

describe('ReelDetailComponent', () => {
  let component: ReelDetailComponent;
  let fixture: ComponentFixture<ReelDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReelDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReelDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
