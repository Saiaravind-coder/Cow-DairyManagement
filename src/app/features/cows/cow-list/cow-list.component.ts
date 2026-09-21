import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CowService, CowPagedResult } from '../../../core/services/cow.service';
import { MilkService } from '../../../core/services/milk.service';
import { HealthService } from '../../../core/services/health.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Cow, MilkProduction, HealthRecord } from '../../../core/models/models';
import { CowFormComponent } from '../cow-form/cow-form.component';
import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cow-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CowFormComponent],
  templateUrl: './cow-list.component.html'
})
export class CowListComponent implements OnInit, OnDestroy {

  // Table data
  cows: Cow[] = [];
  allCows: Cow[] = []; // for dropdowns/parent name/calves
  loading = false;

  // Detail popup
  showForm = false;
  showDetail = false;
  selectedCow: Cow | null = null;
  detailCow: Cow | null = null;
  detailMilkLogs: MilkProduction[] = [];
  detailHealthRecords: HealthRecord[] = [];
  detailCalves: Cow[] = [];
  detailLoading = false;

  // Theme
  isDark = false;
  hoveredRow: number | null = null;
  private themeSub!: Subscription;

  // Filters
  searchName = '';
  searchStatus = '';
  searchBreed = '';
  filtersApplied = false;
  tableSearch = '';
  private searchSubject = new Subject<string>();

  // Server-side pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  constructor(
    private cowService: CowService,
    private milkService: MilkService,
    private healthService: HealthService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.isDark = this.themeService.isDark();
    this.themeSub = this.themeService.isDark$.subscribe(dark => {
      this.isDark = dark;
    });

    // Debounce table search
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadCows();
    });

    this.loadAllCows();
    this.loadCows();
  }

  ngOnDestroy() {
    this.themeSub?.unsubscribe();
    this.searchSubject.complete();
  }

  // Load all cows for dropdowns parent names calves
  loadAllCows() {
    this.cowService.getAll().subscribe(data => {
      this.allCows = data;
    });
  }

  // Load paged cows from server
  loadCows() {
    this.loading = true;
    this.cowService.getPaged(
      this.currentPage,
      this.pageSize,
      this.tableSearch || undefined,
      this.searchStatus || undefined,
      this.searchBreed || undefined
    ).subscribe({
      next: (result: CowPagedResult) => {
        this.cows = result.data;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Summary getters use allCows
  get activeCount(): number { return this.allCows.filter(c => c.status === 'Active').length; }
  get loanCount(): number { return this.allCows.filter(c => c.hasLoan).length; }
  get insuranceCount(): number { return this.allCows.filter(c => c.hasInsurance).length; }
  get uniqueBreeds(): string[] {
    return [...new Set(this.allCows.map(c => c.breed).filter(Boolean))] as string[];
  }

  // Table search — debounced
  onTableSearch() {
    this.searchSubject.next(this.tableSearch);
  }

  clearTableSearch() {
    this.tableSearch = '';
    this.currentPage = 1;
    this.loadCows();
  }

  // Apply filters
  applyFilters() {
    this.currentPage = 1;
    this.filtersApplied = true;
    this.tableSearch = '';
    this.loadCows();
  }

  resetFilters() {
    this.currentPage = 1;
    this.searchName = '';
    this.searchStatus = '';
    this.searchBreed = '';
    this.filtersApplied = false;
    this.tableSearch = '';
    this.loadCows();
  }

  // Pagination
  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.hoveredRow = null;
    this.loadCows();
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

  // CRUD
  openAdd() { this.selectedCow = null; this.showForm = true; }

  openEdit(cow: Cow, event: Event) {
    event.stopPropagation();
    this.selectedCow = cow;
    this.showForm = true;
  }

  openDetail(cow: Cow) {
  this.detailCow = cow;
  this.detailLoading = true;
  this.showDetail = true;
  this.milkService.getByCow(cow.id).subscribe(milk => {
    this.detailMilkLogs = milk;
    this.healthService.getAll().subscribe(health => {
      this.detailHealthRecords = health
        .filter(h => h.cowId === cow.id)
        .sort((a, b) => new Date(b.checkupDate).getTime() - new Date(a.checkupDate).getTime());
      this.detailCalves = this.allCows.filter(c => c.parentId === cow.id);
      this.detailLoading = false;
    });
  });
}

  async deleteCow(id: number, event: Event) {
    event.stopPropagation();
    const result = await Swal.fire({
      title: 'Delete Cow?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      this.cowService.delete(id).subscribe({
        next: () => {
          Swal.fire({
            title: 'Deleted!',
            text: 'Cow has been deleted.',
            icon: 'success',
            confirmButtonColor: '#16a34a',
            timer: 1500,
            showConfirmButton: false
          });
          this.showDetail = false;
          this.loadAllCows();
          this.loadCows();
        },
        error: () => Swal.fire({
          title: 'Error!',
          text: 'Could not delete cow.',
          icon: 'error',
          confirmButtonColor: '#16a34a'
        })
      });
    }
  }

  onFormSaved() {
    this.showForm = false;
    Swal.fire({
      title: 'Saved!',
      text: 'Cow saved successfully.',
      icon: 'success',
      confirmButtonColor: '#16a34a',
      timer: 1500,
      showConfirmButton: false
    });
    this.loadAllCows();
    this.loadCows();
  }

  onFormClosed() { this.showForm = false; }

  // Detail helpers
  getTotalMilk(): number {
    return this.detailMilkLogs.reduce((s, m) => s + m.quantity, 0);
  }

  getTotalRevenue(): number {
    return this.detailMilkLogs.reduce((s, m) => s + (m.quantity * (m.pricePerLiter ?? 0)), 0);
  }

  getTotalMedicalCost(): number {
    return this.detailHealthRecords.reduce((s, h) => s + (h.medicalCost ?? 0), 0);
  }

  getAge(dateOfBirth?: string): string {
    if (!dateOfBirth) return '-';
    const dob = new Date(dateOfBirth);
    const now = new Date();
    const days = Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));
    const months = (days / 30).toFixed(1);
    return `${days} Days (${months} Months)`;
  }

  getLastHealthStatus(): string {
    if (!this.detailHealthRecords.length) return 'No records';
    return this.detailHealthRecords[0].diseaseName || 'Routine Checkup';
  }

  getParentName(parentId: number | null | undefined): string {
    if (!parentId || parentId === 0) return '-';
    const parent = this.allCows.find(c => c.id === parentId);
    return parent ? parent.name : '-';
  }
}