import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Inventory } from '../../../core/models/models';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-list.component.html'
})
export class InventoryListComponent implements OnInit, OnDestroy {

  items: Inventory[] = [];
  loading = false;
  showForm = false;
  showDetail = false;
  selectedItem: Inventory | null = null;
  detailItem: Inventory | null = null;
  error = '';
  isDark = false;
  Math = Math;
  private themeSub!: Subscription;

  // Filters
  searchItem = '';
  searchStock = '';
  filterItem = '';
  filterStock = '';
  filtersApplied = false;
  tableSearch = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  form = {
    itemName: '',
    quantityRemaining: null as number | null,
    unitCost: null as number | null
  };

  feedItems = [
    'Green Grass', 'Dry Grass', 'Hay Rolls', 'Silage',
    'Cotton Seed', 'Groundnut Cake', 'Maize', 'Wheat Bran',
    'Rice Bran', 'Concentrate Feed', 'Mineral Mixture',
    'Salt', 'Vitamin Supplement', 'Soybean Meal',
    'Sunflower Cake', 'Coconut Oil Cake', 'Straw',
    'Jowar', 'Bajra', 'Ragi'
  ];

  constructor(
    private inventoryService: InventoryService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.isDark = this.themeService.isDark();
    this.themeSub = this.themeService.isDark$.subscribe(dark => {
      this.isDark = dark;
    });
    this.loadData();
  }

  ngOnDestroy() {
    this.themeSub?.unsubscribe();
  }

  loadData() {
    this.loading = true;
    this.inventoryService.getAll().subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // ── Filters ─────────────────────────────────────────
  get filteredItems(): Inventory[] {
    return this.items.filter(i => {
      const matchItem = this.filterItem
        ? i.itemName.toLowerCase().includes(this.filterItem.toLowerCase())
        : true;
      const matchStock = this.filterStock === 'low'
        ? i.quantityRemaining < 10
        : this.filterStock === 'medium'
        ? i.quantityRemaining >= 10 && i.quantityRemaining <= 50
        : this.filterStock === 'good'
        ? i.quantityRemaining > 50
        : true;
      return matchItem && matchStock;
    });
  }

  get tableFilteredItems(): Inventory[] {
    if (!this.tableSearch.trim()) return this.pagedItems;
    const s = this.tableSearch.toLowerCase();
    return this.filteredItems.filter(i =>
      i.itemName.toLowerCase().includes(s) ||
      i.quantityRemaining.toString().includes(s) ||
      i.unitCost.toString().includes(s) ||
      this.getStockStatus(i.quantityRemaining).toLowerCase().includes(s)
    );
  }

  get filteredTotalValue(): number {
    return this.filteredItems.reduce((s, i) => s + (i.quantityRemaining * i.unitCost), 0);
  }

  get filteredLowStockCount(): number {
    return this.filteredItems.filter(i => i.quantityRemaining < 10).length;
  }

  applyFilters() {
    this.currentPage = 1;
    this.filterItem = this.searchItem;
    this.filterStock = this.searchStock;
    this.filtersApplied = true;
    this.tableSearch = '';
  }

  resetFilters() {
    this.currentPage = 1;
    this.searchItem = '';
    this.searchStock = '';
    this.filterItem = '';
    this.filterStock = '';
    this.filtersApplied = false;
    this.tableSearch = '';
  }

  // ── Pagination ───────────────────────────────────────
  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize);
  }

  get pagedItems(): Inventory[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  // ── CRUD ─────────────────────────────────────────────
  openAdd() {
    this.selectedItem = null;
    this.form = { itemName: '', quantityRemaining: null, unitCost: null };
    this.error = '';
    this.showForm = true;
  }

  openEdit(item: Inventory, event?: Event) {
    if (event) event.stopPropagation();
    this.selectedItem = item;
    this.form = {
      itemName: item.itemName,
      quantityRemaining: item.quantityRemaining,
      unitCost: item.unitCost
    };
    this.error = '';
    this.showForm = true;
  }

  openDetail(item: Inventory) {
    this.detailItem = item;
    this.showDetail = true;
  }

  onSubmit() {
    if (!this.form.itemName || !this.form.quantityRemaining || !this.form.unitCost) {
      this.error = 'All fields are required.';
      return;
    }
    this.error = '';

    if (this.selectedItem) {
      this.inventoryService.update(this.selectedItem.id, this.form as any).subscribe({
        next: () => {
          this.showForm = false;
          Swal.fire({
            title: 'Updated!',
            text: 'Inventory item updated.',
            icon: 'success',
            confirmButtonColor: '#6FA83E',
            timer: 1500,
            showConfirmButton: false
          });
          this.loadData();
        },
        error: () => { this.error = 'Something went wrong.'; }
      });
    } else {
      this.inventoryService.add(this.form as any).subscribe({
        next: () => {
          this.showForm = false;
          Swal.fire({
            title: 'Saved!',
            text: 'Inventory item added.',
            icon: 'success',
            confirmButtonColor: '#6FA83E',
            timer: 1500,
            showConfirmButton: false
          });
          this.loadData();
        },
        error: () => { this.error = 'Something went wrong.'; }
      });
    }
  }

  async delete(id: number, event?: Event) {
    if (event) event.stopPropagation();
    const result = await Swal.fire({
      title: 'Delete item?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6FA83E',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      this.inventoryService.delete(id).subscribe({
        next: () => {
          Swal.fire({
            title: 'Deleted!',
            text: 'Item has been deleted.',
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
          text: 'Could not delete item.',
          icon: 'error',
          confirmButtonColor: '#6FA83E'
        })
      });
    }
  }

  // ── Helpers ──────────────────────────────────────────
  getStockStatus(qty: number): string {
    if (qty < 10) return 'Low Stock';
    if (qty <= 50) return 'Medium';
    return 'Good';
  }

  getStockClass(qty: number): string {
    if (qty < 10) return 'bg-red-100 text-red-600';
    if (qty <= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  }

  getStockBgClass(qty: number): string {
    if (qty < 10) return 'bg-red-50';
    if (qty <= 50) return 'bg-yellow-50';
    return 'bg-green-50';
  }

  getStockTextClass(qty: number): string {
    if (qty < 10) return 'text-red-500';
    if (qty <= 50) return 'text-yellow-600';
    return 'text-green-600';
  }

  getItemEmoji(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('grass')) return '🌿';
    if (n.includes('hay')) return '🌾';
    if (n.includes('silage')) return '🌽';
    if (n.includes('cotton')) return '🌱';
    if (n.includes('maize') || n.includes('corn')) return '🌽';
    if (n.includes('wheat')) return '🌾';
    if (n.includes('rice')) return '🍚';
    if (n.includes('salt')) return '🧂';
    if (n.includes('vitamin') || n.includes('mineral')) return '💊';
    if (n.includes('concentrate')) return '🥣';
    if (n.includes('groundnut') || n.includes('soybean') || n.includes('sunflower') || n.includes('coconut')) return '🫘';
    if (n.includes('straw')) return '🌾';
    if (n.includes('jowar') || n.includes('bajra') || n.includes('ragi')) return '🌾';
    return '📦';
  }
}