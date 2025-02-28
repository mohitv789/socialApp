import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateProfileCreateComponent } from './private-profile-create.component';

describe('PrivateProfileCreateComponent', () => {
  let component: PrivateProfileCreateComponent;
  let fixture: ComponentFixture<PrivateProfileCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivateProfileCreateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivateProfileCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
