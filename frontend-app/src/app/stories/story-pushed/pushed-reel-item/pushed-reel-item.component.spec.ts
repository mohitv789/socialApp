import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushedReelItemComponent } from './pushed-reel-item.component';

describe('PushedReelItemComponent', () => {
  let component: PushedReelItemComponent;
  let fixture: ComponentFixture<PushedReelItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PushedReelItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PushedReelItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
