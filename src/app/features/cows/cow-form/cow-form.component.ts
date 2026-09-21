import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CowService } from '../../../core/services/cow.service';
import { Cow } from '../../../core/models/models';

@Component({
  selector: 'app-cow-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cow-form.component.html'
})
export class CowFormComponent implements OnInit {
  @Input() cow: Cow | null = null;
  @Input() cows: Cow[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  breeds = [
    { en: 'Holstein Friesian', ta: 'ஹோல்ஸ்டீன் பிரீசியன்' },
    { en: 'Jersey', ta: 'ஜெர்சி' },
    { en: 'Gir', ta: 'கிர்' },
    { en: 'Sahiwal', ta: 'சாஹிவால்' },
    { en: 'Red Sindhi', ta: 'சிவப்பு சிந்தி' },
    { en: 'Murrah Buffalo', ta: 'முர்ரா எருமை' },
    { en: 'Surti Buffalo', ta: 'சூர்த்தி எருமை' },
    { en: 'Mehsana Buffalo', ta: 'மேஹ்சானா எருமை' },
    { en: 'Nili-Ravi Buffalo', ta: 'நிலி-ரவி எருமை' },
    { en: 'Ongole', ta: 'ஒங்கோல்' },
    { en: 'Hariana', ta: 'ஹரியானா' },
    { en: 'Tharparkar', ta: 'தார்பார்கர்' },
    { en: 'Kankrej', ta: 'கன்க்ரேஜ்' },
    { en: 'Deoni', ta: 'தேவணி' },
    { en: 'Crossbreed (HF x Gir)', ta: 'கலப்பினம் (HF x கிர்)' },
    { en: 'Crossbreed (Jersey x Sahiwal)', ta: 'கலப்பினம் (ஜெர்சி x சாஹிவால்)' },
    { en: 'Other', ta: 'மற்றவை' }
  ];

  form = {
    name: '',
    tagId: '',
    breed: '',
    parentId: null as number | null,
    status: 'Active',
    hasLoan: false,
    hasInsurance: false,
    imageUrl: '',
    gender: '',
    dateOfBirth: '',
    weight: null as number | null,
    height: null as number | null
  };

  loading = false;
  error = '';

  constructor(private cowService: CowService) {}

  ngOnInit() {
    if (this.cow) {
      this.form = {
        name: this.cow.name ?? '',
        tagId: this.cow.tagId ?? '',
        breed: this.cow.breed ?? '',
        parentId: this.cow.parentId ?? null,
        status: this.cow.status,
        hasLoan: this.cow.hasLoan,
        hasInsurance: this.cow.hasInsurance,
        imageUrl: this.cow.imageUrl ?? '',
        gender: this.cow.gender ?? '',
        dateOfBirth: this.cow.dateOfBirth ?? '',
        weight: this.cow.weight ?? null,
        height: this.cow.height ?? null
      };
    }
  }

  // ✅ Only show female cows as mother options
  get availableParents(): Cow[] {
    return this.cows.filter(c =>
      c.id !== this.cow?.id &&
      (c.gender === 'Female' || c.gender === '' || c.gender == null)
    );
  }

  // ✅ Check if current cow is male
  get isMale(): boolean {
    return this.form.gender === 'Male';
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.form.imageUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onGenderChange() {
    // If male selected, clear mother field
    if (this.form.gender === 'Male') {
      this.form.parentId = null;
    }
  }

  onSubmit() {
    this.loading = true;
    this.error = '';

    const payload: any = {
      ...this.form,
      parentId: this.form.parentId || null
    };

    if (this.cow) {
      this.cowService.update(this.cow.id, payload).subscribe({
        next: () => {
          this.loading = false;
          this.saved.emit();
        },
        error: () => {
          this.error = 'Something went wrong. Please try again.';
          this.loading = false;
        }
      });
    } else {
      this.cowService.create(payload).subscribe({
        next: () => {
          this.loading = false;
          this.saved.emit();
        },
        error: () => {
          this.error = 'Something went wrong. Please try again.';
          this.loading = false;
        }
      });
    }
  }
}