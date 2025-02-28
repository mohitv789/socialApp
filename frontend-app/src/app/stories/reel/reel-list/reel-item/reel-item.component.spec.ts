import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReelItemComponent } from './reel-item.component';

describe('ReelItemComponent', () => {
  let component: ReelItemComponent;
  let fixture: ComponentFixture<ReelItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReelItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReelItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
