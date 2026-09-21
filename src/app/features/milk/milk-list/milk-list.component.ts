import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MilkService, MilkPagedResult } from '../../../core/services/milk.service';
import { CowService } from '../../../core/services/cow.service';
import { ThemeService } from '../../../core/services/theme.service';
import { MilkProduction, Cow } from '../../../core/models/models';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-milk-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './milk-list.component.html'
})
export class MilkListComponent implements OnInit, OnDestroy {

  milkLogs: MilkProduction[] = [];
  cows: Cow[] = [];
  loading = false;
  showForm = false;
  error = '';
  selectedLog: MilkProduction | null = null;
  isDark = false;
  hoveredRow: number | null = null;
  private themeSub!: Subscription;
  private searchSubject = new Subject<string>();

  showDetail = false;
  detailLog: MilkProduction | null = null;

  searchShift = '';
  searchFromDate = '';
  searchToDate = '';
  filterShift = '';
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
    quantity: null as number | null,
    qualityDegree: null as number | null,
    pricePerLiter: null as number | null,
    shift: 'AM',
    logDate: new Date().toISOString().split('T')[0]
  };

  constructor(
    private milkService: MilkService,
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
    this.milkService.getPaged(
      this.currentPage,
      this.pageSize,
      this.tableSearch || undefined,
      this.filterShift || undefined,
      this.filterFromDate || undefined,
      this.filterToDate || undefined
    ).subscribe({
      next: (result: MilkPagedResult) => {
        this.milkLogs = result.data;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get femaleCows(): Cow[] {
    return this.cows.filter(c =>
      c.gender === 'Female' || c.gender === '' || c.gender == null
    );
  }

  getCowName(cowId: number): string {
    return this.cows.find(c => c.id === cowId)?.name ?? '-';
  }

  getCow(cowId: number): Cow | undefined {
    return this.cows.find(c => c.id === cowId);
  }

  get filteredTotalLiters(): number {
    return this.milkLogs.reduce((s, m) => s + m.quantity, 0);
  }

  get filteredTotalRevenue(): number {
    return this.milkLogs.reduce((s, m) => s + (m.quantity * (m.pricePerLiter ?? 0)), 0);
  }

  onTableSearch() {
    this.searchSubject.next(this.tableSearch);
  }

  clearTableSearch() {
    this.tableSearch = '';
    this.currentPage = 1;
    this.loadData();
  }

  applyFilters() {
    this.currentPage = 1;
    this.filterShift = this.searchShift;
    this.filterFromDate = this.searchFromDate;
    this.filterToDate = this.searchToDate;
    this.filtersApplied = true;
    this.tableSearch = '';
    this.loadData();
  }

  resetFilters() {
    this.currentPage = 1;
    this.searchShift = '';
    this.searchFromDate = '';
    this.searchToDate = '';
    this.filterShift = '';
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filtersApplied = false;
    this.tableSearch = '';
    this.loadData();
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.hoveredRow = null;
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

  openAdd() {
    this.resetForm();
    this.showForm = true;
  }

  openEdit(log: MilkProduction, event: Event) {
    event.stopPropagation();
    this.selectedLog = log;
    this.form = {
      cowId: log.cowId,
      quantity: log.quantity,
      qualityDegree: log.qualityDegree ?? null,
      pricePerLiter: log.pricePerLiter ?? null,
      shift: log.shift,
      logDate: log.logDate.toString()
    };
    this.error = '';
    this.showForm = true;
  }

  openDetail(log: MilkProduction) {
    this.detailLog = log;
    this.showDetail = true;
  }

  resetForm() {
    this.selectedLog = null;
    this.form = {
      cowId: null,
      quantity: null,
      qualityDegree: null,
      pricePerLiter: null,
      shift: 'AM',
      logDate: new Date().toISOString().split('T')[0]
    };
    this.error = '';
  }

  onSubmit() {
    if (!this.form.cowId || !this.form.quantity) {
      this.error = 'Cow and quantity are required.';
      return;
    }
    const selectedCow = this.cows.find(c => c.id === this.form.cowId);
    if (selectedCow?.gender === 'Male') {
      this.error = '🐂 Male cows cannot produce milk. Please select a female cow.';
      return;
    }
    this.error = '';
    const isEdit = !!this.selectedLog;
    if (isEdit) {
      this.milkService.update(this.selectedLog!.id, this.form).subscribe({
        next: () => {
          this.showForm = false;
          this.resetForm();
          Swal.fire({ title: 'Updated!', text: 'Milk log updated.', icon: 'success', confirmButtonColor: '#16a34a', timer: 1500, showConfirmButton: false });
          this.loadData();
        },
        error: () => { this.error = 'Something went wrong.'; }
      });
    } else {
      this.milkService.log(this.form as any).subscribe({
        next: () => {
          this.showForm = false;
          this.resetForm();
          Swal.fire({ title: 'Saved!', text: 'Milk log saved.', icon: 'success', confirmButtonColor: '#16a34a', timer: 1500, showConfirmButton: false });
          this.loadData();
        },
        error: () => { this.error = 'Something went wrong.'; }
      });
    }
  }

  async delete(id: number, event?: Event) {
    if (event) event.stopPropagation();
    const result = await Swal.fire({
      title: 'Delete milk log?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      this.milkService.delete(id).subscribe({
        next: () => {
          Swal.fire({ title: 'Deleted!', text: 'Milk log deleted.', icon: 'success', confirmButtonColor: '#16a34a', timer: 1500, showConfirmButton: false });
          this.showDetail = false;
          this.loadData();
        },
        error: () => Swal.fire({ title: 'Error!', text: 'Could not delete.', icon: 'error', confirmButtonColor: '#16a34a' })
      });
    }
  }
}