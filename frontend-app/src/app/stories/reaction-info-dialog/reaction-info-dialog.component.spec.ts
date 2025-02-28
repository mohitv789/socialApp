import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactionInfoDialogComponent } from './reaction-info-dialog.component';

describe('ReactionInfoDialogComponent', () => {
  let component: ReactionInfoDialogComponent;
  let fixture: ComponentFixture<ReactionInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReactionInfoDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactionInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
