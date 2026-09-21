import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CowService } from '../../core/services/cow.service';
import { MilkService } from '../../core/services/milk.service';
import { HealthService } from '../../core/services/health.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ThemeService } from '../../core/services/theme.service';
import { Cow, MilkProduction, HealthRecord, Inventory } from '../../core/models/models';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('breedChart') breedChartRef!: ElementRef;
  @ViewChild('milkChart') milkChartRef!: ElementRef;
  @ViewChild('healthChart') healthChartRef!: ElementRef;
  @ViewChild('inventoryChart') inventoryChartRef!: ElementRef;

  cows: Cow[] = [];
  milkLogs: MilkProduction[] = [];
  healthRecords: HealthRecord[] = [];
  inventoryItems: Inventory[] = [];
  loading = true;
  isDark = false;
  private themeSub!: Subscription;

  cowFilter = 'month';
  milkFilter = 'month';
  healthFilter = 'month';
  inventoryFilter = 'month';

  breedChartInstance: Chart | null = null;
  milkChartInstance: Chart | null = null;
  healthChartInstance: Chart | null = null;
  inventoryChartInstance: Chart | null = null;

  constructor(
    private cowService: CowService,
    private milkService: MilkService,
    private healthService: HealthService,
    private inventoryService: InventoryService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.isDark = this.themeService.isDark();
    this.themeSub = this.themeService.isDark$.subscribe(dark => {
      this.isDark = dark;
      if (!this.loading) {
        setTimeout(() => this.renderAllCharts(), 100);
      }
    });
    this.loadAll();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.themeSub?.unsubscribe();
    this.breedChartInstance?.destroy();
    this.milkChartInstance?.destroy();
    this.healthChartInstance?.destroy();
    this.inventoryChartInstance?.destroy();
  }
  loadAll() {
  this.loading = true;
  this.cowService.getAll().subscribe((cows: Cow[]) => {
    this.cows = cows;
    // ✅ Use getPaged with large pageSize to get all milk logs for dashboard
    this.milkService.getPaged(1, 1000).subscribe((milkResult) => {
      this.milkLogs = milkResult.data; // ← extract .data array
      this.healthService.getAll().subscribe((health: HealthRecord[]) => {
        this.healthRecords = health;
        this.inventoryService.getAll().subscribe((inv: Inventory[]) => {
          this.inventoryItems = inv;
          this.loading = false;
          setTimeout(() => this.renderAllCharts(), 300);
        });
      });
    });
  });
}
  

  get totalCows(): number { return this.cows.length; }
  get activeCows(): number { return this.cows.filter(c => c.status === 'Active').length; }
  get totalMilkLiters(): number { return this.milkLogs.reduce((s, m) => s + m.quantity, 0); }
  get totalRevenue(): number { return this.milkLogs.reduce((s, m) => s + (m.quantity * (m.pricePerLiter ?? 0)), 0); }
  get totalMedicalCost(): number { return this.healthRecords.reduce((s, h) => s + (h.medicalCost ?? 0), 0); }
  get lowStockItems(): number { return this.inventoryItems.filter(i => i.quantityRemaining < 10).length; }

  navigate(path: string) { this.router.navigate([path]); }

  onFilterChange(chart: string) {
    setTimeout(() => {
      if (chart === 'cow') this.renderBreedChart();
      if (chart === 'milk') this.renderMilkChart();
      if (chart === 'health') this.renderHealthChart();
      if (chart === 'inventory') this.renderInventoryChart();
    }, 100);
  }

  renderAllCharts() {
    this.renderBreedChart();
    this.renderMilkChart();
    this.renderHealthChart();
    this.renderInventoryChart();
  }

  filterByPeriod<T>(items: T[], dateField: keyof T, period: string): T[] {
    const now = new Date();
    return items.filter(item => {
      const d = new Date(item[dateField] as string);
      if (period === 'day') return d.toDateString() === now.toDateString();
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    });
  }

  getChartTextColor(): string {
    return this.isDark ? '#d1d5db' : '#374151';
  }

  getChartGridColor(): string {
    return this.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  }

  renderBreedChart() {
    if (!this.breedChartRef) return;
    if (this.breedChartInstance) this.breedChartInstance.destroy();
    const filtered = this.cowFilter === 'year' ? this.cows
      : this.filterByPeriod(this.cows, 'createdDate', this.cowFilter);
    const breedMap: Record<string, number> = {};
    filtered.forEach((c: Cow) => {
      const b = c.breed || 'Unknown';
      breedMap[b] = (breedMap[b] || 0) + 1;
    });
    this.breedChartInstance = new Chart(this.breedChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: Object.keys(breedMap),
        datasets: [{
          data: Object.values(breedMap),
          backgroundColor: ['#16a34a','#22c55e','#86efac','#4ade80','#d97706','#f59e0b','#fcd34d','#3b82f6','#60a5fa','#93c5fd'],
          borderWidth: 2,
          borderColor: this.isDark ? '#1f2937' : '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: this.getChartTextColor(), font: { size: 10 }, padding: 8 }
          }
        }
      }
    });
  }

  renderMilkChart() {
    if (!this.milkChartRef) return;
    if (this.milkChartInstance) this.milkChartInstance.destroy();
    const filtered = this.filterByPeriod(this.milkLogs, 'logDate', this.milkFilter);
    const labels: string[] = [];
    const dataMap: Record<string, number> = {};
    if (this.milkFilter === 'day') {
      ['AM','PM'].forEach(s => dataMap[s] = 0);
      filtered.forEach((m: MilkProduction) => { dataMap[m.shift] = (dataMap[m.shift] || 0) + m.quantity; });
      labels.push(...Object.keys(dataMap));
    } else if (this.milkFilter === 'month') {
      for (let i = 1; i <= 31; i++) dataMap[i.toString()] = 0;
      filtered.forEach((m: MilkProduction) => {
        const day = new Date(m.logDate).getDate().toString();
        dataMap[day] = (dataMap[day] || 0) + m.quantity;
      });
      labels.push(...Object.keys(dataMap));
    } else {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      months.forEach(m => dataMap[m] = 0);
      filtered.forEach((m: MilkProduction) => {
        const mon = months[new Date(m.logDate).getMonth()];
        dataMap[mon] = (dataMap[mon] || 0) + m.quantity;
      });
      labels.push(...months);
    }
    this.milkChartInstance = new Chart(this.milkChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Milk (L)',
          data: labels.map(l => dataMap[l] || 0),
          backgroundColor: 'rgba(22,163,74,0.7)',
          borderColor: '#16a34a',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: this.getChartTextColor(), font: { size: 9 } }, grid: { display: false } },
          y: { ticks: { color: this.getChartTextColor(), font: { size: 9 } }, grid: { color: this.getChartGridColor() } }
        }
      }
    });
  }

  renderHealthChart() {
    if (!this.healthChartRef) return;
    if (this.healthChartInstance) this.healthChartInstance.destroy();
    const filtered = this.filterByPeriod(this.healthRecords, 'checkupDate', this.healthFilter);
    const diseaseMap: Record<string, number> = {};
    filtered.forEach((h: HealthRecord) => {
      const d = h.diseaseName || 'Routine';
      diseaseMap[d] = (diseaseMap[d] || 0) + 1;
    });
    this.healthChartInstance = new Chart(this.healthChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(diseaseMap),
        datasets: [{
          label: 'Cases',
          data: Object.values(diseaseMap),
          backgroundColor: 'rgba(239,68,68,0.7)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: this.getChartTextColor(), font: { size: 9 } }, grid: { display: false } },
          y: { ticks: { color: this.getChartTextColor(), font: { size: 9 } }, grid: { color: this.getChartGridColor() } }
        }
      }
    });
  }

  renderInventoryChart() {
    if (!this.inventoryChartRef) return;
    if (this.inventoryChartInstance) this.inventoryChartInstance.destroy();
    this.inventoryChartInstance = new Chart(this.inventoryChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.inventoryItems.map(i => i.itemName),
        datasets: [{
          label: 'Qty (kg)',
          data: this.inventoryItems.map(i => i.quantityRemaining),
          backgroundColor: this.inventoryItems.map(i =>
            i.quantityRemaining < 10 ? 'rgba(239,68,68,0.7)'
            : i.quantityRemaining < 50 ? 'rgba(234,179,8,0.7)'
            : 'rgba(22,163,74,0.7)'
          ),
          borderColor: this.inventoryItems.map(i =>
            i.quantityRemaining < 10 ? '#ef4444'
            : i.quantityRemaining < 50 ? '#eab308'
            : '#16a34a'
          ),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: this.getChartTextColor(), font: { size: 9 } }, grid: { display: false } },
          y: { ticks: { color: this.getChartTextColor(), font: { size: 9 } }, grid: { color: this.getChartGridColor() } }
        }
      }
    });
  }
}