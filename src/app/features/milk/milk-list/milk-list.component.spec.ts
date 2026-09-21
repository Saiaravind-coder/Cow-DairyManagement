import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MilkListComponent } from './milk-list.component';

describe('MilkListComponent', () => {
  let component: MilkListComponent;
  let fixture: ComponentFixture<MilkListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MilkListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MilkListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
