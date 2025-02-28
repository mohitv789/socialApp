import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReelListComponent } from './reel-list.component';

describe('ReelListComponent', () => {
  let component: ReelListComponent;
  let fixture: ComponentFixture<ReelListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReelListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReelListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
