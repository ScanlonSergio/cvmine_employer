import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ImportsModule } from '../../imports';

// prime-ng imports
import { Table } from 'primeng/table';
import { ApiService } from '../services/api.service';
import { LoadingService } from '../../common/loading-spinner/loading.service';
import { MessageService } from 'primeng/api';
import { TableRowCollapseEvent, TableRowExpandEvent } from 'primeng/table';

interface Job {
    id: number;
    job_code: string;
    job_name: string;
    location: string;
    total_applications: number;
    shortlisted_applications: number;
    interviewed_applications: number;
    offered_applications: number;
    hired_applications: number;
    dropped_applications: number;
    published_date: string;
    status: string;
}

@Component({
    selector: 'app-jobs-list-page',
    templateUrl: './jobs-list-page.component.html',
    styleUrl: './jobs-list-page.component.scss',
    standalone: true,
    imports: [
        RouterLink, 
        CommonModule, 
        FormsModule,
        ReactiveFormsModule,
        ImportsModule
    ],
    providers: [MessageService]
})

export class JobsListPageComponent implements OnInit {
    @ViewChild('dt2') dt2!: Table;
    jobsList: Job[] = [];
    selectedJobs!: Job;
    expandedRows = {};
    jobStatuses: Array<{ value: string; label: string, status: number; statusTitle: string }> = []
    loading: boolean = true;
    formGroup!: FormGroup;
    requestBody = {
        "search": "",
        "sellerCode": null,
        "fromDate": null,
        "toDate": null,
        "updatedFromDate": null,
        "updatedToDate": null,
        "publishingType": null,
        "startPage": 1,
        "limit": 40,
        "productCode": [],
        "status": null,
        "dateFilterType": null,
        "jobType": null,
    }

    constructor(
        private apiService: ApiService,
        private loadingSpinnerService: LoadingService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.getDropdownValues();
    }

    getAllJobListings(): void {
        this.loadingSpinnerService.show();
        this.apiService.getJobListings(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data && response.data.list) {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: response.message });
                    this.loading = false;
                    this.loadingSpinnerService.hide();
                    this.jobsList = response.data.list.map((item: any) => ({
                        id: item.productCode,
                        job_code: item.productCode,
                        job_name: item.productName,
                        location: item.jobLocation,
                        total_applications: item.totalResCount,
                        shortlisted_applications: item.Shortlist || 0,
                        interviewed_applications: item.Interview || 0,
                        offered_applications: item.Offer || 0,
                        hired_applications: item.joined || 0,
                        dropped_applications: item.AllDropped || 0,
                        published_date: item.postedDate,
                        status: item.statusTitle,
                    }));
                }
            },
            error: (error: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message });
                this.loading = false;
                this.loadingSpinnerService.hide();
            },
        });
    }

    getDropdownValues(): void {
        this.loadingSpinnerService.show();
        const body = {};
        this.apiService.getDropdownsData(body).subscribe({
            next: (response) => {
                if (response.status && response.data && response.data.jobMasterData.jobStatusList) {
                    this.jobStatuses = response.data.jobMasterData.jobStatusList
                    .filter((item: any) => item.status !== 10)
                    .map((item: any) => ({
                        status: item.status,
                        statusTitle: item.statusTitle,
                        value: item.statusTitle.toLowerCase(),
                        label: item.statusTitle
                    }));
                    this.getAllJobListings();
                }
            },
            error: (error: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message });
                this.loading = false;
                this.loadingSpinnerService.hide();
            },
        });
    }

    expandAll() {
        // this.expandedRows = this.jobsList.reduce((acc: { [key: string]: boolean }, j) => (acc[j.id] = true) && acc, {});
        this.expandedRows = this.jobsList.reduce((acc, j) => {
            (acc as Record<number, boolean>)[j.id] = true;
            return acc;
        }, {});
    }

    collapseAll() {
        this.expandedRows = {};
    }

    onRowExpand(event: TableRowExpandEvent) {
        this.messageService.add({ severity: 'info', summary: 'Job Expanded', detail: event.data.name, life: 3000 });
    }

    onRowCollapse(event: TableRowCollapseEvent) {
        this.messageService.add({ severity: 'success', summary: 'Job Collapsed', detail: event.data.name, life: 3000 });
    }


    ngAfterViewInit(): void {
        
    }

    clear(table: Table) {
        table.clear();
    }

    onGlobalFilter(event: Event) {
        const input = event.target as HTMLInputElement;
        this.dt2.filterGlobal(input.value, 'contains');
    }

    getSeverity(status: string): any {
        switch (status) {
            case 'closed':
                return 'danger';

            case 'published':
                return 'success';

            case 'pending':
                return 'info';

            case 'paused':
                return 'warning';

            default:
                return '';
        }
    }

    onJobStatusChange(row: Job): void {
        let body = {
            "status": this.jobStatuses.find(item => item.statusTitle === row.status)?.status,
            "productCode": row.id,
        }
        this.apiService.changeJobStatus(body).subscribe({
            next: (response) => {
                if(response.status) {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: response.message });
                    this.getAllJobListings();
                }
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message });
                this.getAllJobListings();
            }
        })
    }

    formatPublishedDate(dateString: string): string {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true
        };
        const formattedDate = date.toLocaleString('en-GB', options).replace(',', '');
        return formattedDate;
    }

}