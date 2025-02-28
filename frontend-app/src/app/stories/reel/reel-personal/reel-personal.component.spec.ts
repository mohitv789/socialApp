import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReelPersonalComponent } from './reel-personal.component';

describe('ReelPersonalComponent', () => {
  let component: ReelPersonalComponent;
  let fixture: ComponentFixture<ReelPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReelPersonalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReelPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
