import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CowFormComponent } from './cow-form.component';

describe('CowFormComponent', () => {
  let component: CowFormComponent;
  let fixture: ComponentFixture<CowFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CowFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CowFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
