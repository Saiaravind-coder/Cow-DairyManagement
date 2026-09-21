import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthService, HealthPagedResult } from '../../../core/services/health.service';
import { CowService } from '../../../core/services/cow.service';
import { ThemeService } from '../../../core/services/theme.service';
import { HealthRecord, Cow } from '../../../core/models/models';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-health-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './health-list.component.html'
})
export class HealthListComponent implements OnInit, OnDestroy {

  records: HealthRecord[] = [];
  cows: Cow[] = [];
  loading = false;
  showForm = false;
  showDetail = false;
  detailRecord: HealthRecord | null = null;
  error = '';
  isDark = false;
  private themeSub!: Subscription;
  private searchSubject = new Subject<string>();

  diseases = [
    { en: 'Mastitis', ta: 'மடிவீக்கம்' },
    { en: 'Foot and Mouth Disease', ta: 'கால் வாய் நோய்' },
    { en: 'Brucellosis', ta: 'புருசெல்லோசிஸ்' },
    { en: 'Bovine Tuberculosis', ta: 'மாட்டு காசநோய்' },
    { en: 'Blackleg', ta: 'கருங்கால் நோய்' },
    { en: 'Bloat', ta: 'வயிறு உப்புசம்' },
    { en: 'Milk Fever', ta: 'பால் காய்ச்சல்' },
    { en: 'Ketosis', ta: 'கீட்டோசிஸ்' },
    { en: 'Diarrhea', ta: 'வயிற்றுப்போக்கு' },
    { en: 'Pneumonia', ta: 'நிமோனியா' },
    { en: 'Ringworm', ta: 'படர்தாமரை' },
    { en: 'Tick Fever', ta: 'உண்ணி காய்ச்சல்' },
    { en: 'Lumpy Skin Disease', ta: 'கட்டி தோல் நோய்' },
    { en: 'Retained Placenta', ta: 'நஞ்சுக்கொடி தங்குதல்' },
    { en: 'Dystocia', ta: 'கஷ்டமான பிரசவம்' },
    { en: 'Conjunctivitis', ta: 'கண் வீக்கம்' },
    { en: 'Wound / Injury', ta: 'காயம்' },
    { en: 'Other', ta: 'மற்றவை' }
  ];

  searchCow = '';
  searchDisease = '';
  searchPregnancy = '';
  searchFromDate = '';
  searchToDate = '';
  filterDisease = '';
  filterPregnancy = '';
  filterFromDate = '';
  filterToDate = '';
  filtersApplied = false;
  tableSearch = '';

  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  form = {
    cowId: null as number | null,
    checkupDate: new Date().toISOString().split('T')[0],
    pregnancyMonth: null as number | null,
    diseaseName: '',
    medicationGiven: false,
    medicalCost: null as number | null,
    notes: ''
  };

  constructor(
    private healthService: HealthService,
    private cowService: CowService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.isDark = this.themeService.isDark();
    this.themeSub = this.themeService.isDark$.subscribe(dark => {
      this.isDark = dark;
    });
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
    this.loadCows();
    this.loadData();
  }

  ngOnDestroy() {
    this.themeSub?.unsubscribe();
    this.searchSubject.complete();
  }

  loadCows() {
    this.cowService.getAll().subscribe(cows => {
      this.cows = cows;
    });
  }

  loadData() {
    this.loading = true;
    this.healthService.getPaged(
      this.currentPage,
      this.pageSize,
      this.tableSearch || undefined,
      this.filterDisease || undefined,
      this.filterPregnancy || undefined,
      this.filterFromDate || undefined,
      this.filterToDate || undefined
    ).subscribe({
      next: (result: HealthPagedResult) => {
        this.records = result.data;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getCowName(cowId: number): string {
    return this.cows.find(c => c.id === cowId)?.name ?? '-';
  }

  getCow(cowId: number): Cow | undefined {
    return this.cows.find(c => c.id === cowId);
  }

  getDiseaseTamil(diseaseName: string): string {
    return this.diseases.find(d => d.en === diseaseName)?.ta ?? '';
  }

  get filteredPregnantCows(): number {
    return this.records.filter(r => r.pregnancyMonth != null).length;
  }

  get filteredMedicalCost(): number {
    return this.records.reduce((s, r) => s + (r.medicalCost ?? 0), 0);
  }

  onTableSearch() {
    this.searchSubject.next(this.tableSearch);
  }

  applyFilters() {
    this.currentPage = 1;
    this.filterDisease = this.searchDisease;
    this.filterPregnancy = this.searchPregnancy;
    this.filterFromDate = this.searchFromDate;
    this.filterToDate = this.searchToDate;
    this.filtersApplied = true;
    this.tableSearch = '';
    this.loadData();
  }

  resetFilters() {
    this.currentPage = 1;
    this.searchCow = '';
    this.searchDisease = '';
    this.searchPregnancy = '';
    this.searchFromDate = '';
    this.searchToDate = '';
    this.filterDisease = '';
    this.filterPregnancy = '';
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filtersApplied = false;
    this.tableSearch = '';
    this.loadData();
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadData();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getShowingFrom(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getShowingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  openDetail(record: HealthRecord) {
    this.detailRecord = record;
    this.showDetail = true;
  }

  resetForm() {
    this.form = {
      cowId: null,
      checkupDate: new Date().toISOString().split('T')[0],
      pregnancyMonth: null,
      diseaseName: '',
      medicationGiven: false,
      medicalCost: null,
      notes: ''
    };
    this.error = '';
  }

  onSubmit() {
    if (!this.form.cowId) {
      this.error = 'Please select a cow.';
      return;
    }
    this.error = '';
    this.healthService.add(this.form as any).subscribe({
      next: () => {
        this.showForm = false;
        this.resetForm();
        Swal.fire({
          title: 'Saved!',
          text: 'Health record saved successfully.',
          icon: 'success',
          confirmButtonColor: '#6FA83E',
          timer: 1500,
          showConfirmButton: false
        });
        this.loadData();
      },
      error: () => {
        this.error = 'Something went wrong. Please try again.';
      }
    });
  }

  async delete(id: number, event?: Event) {
    if (event) event.stopPropagation();
    const result = await Swal.fire({
      title: 'Delete health record?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6FA83E',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      this.healthService.delete(id).subscribe({
        next: () => {
          Swal.fire({
            title: 'Deleted!',
            text: 'Health record deleted.',
            icon: 'success',
            confirmButtonColor: '#6FA83E',
            timer: 1500,
            showConfirmButton: false
          });
          this.showDetail = false;
          this.loadData();
        },
        error: () => Swal.fire({
          title: 'Error!',
          text: 'Could not delete record.',
          icon: 'error',
          confirmButtonColor: '#6FA83E'
        })
      });
    }
  }
}