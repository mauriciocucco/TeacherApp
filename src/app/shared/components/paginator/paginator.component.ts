import { Component, Input, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { PaginatorService } from '../../../core/services/paginator/paginator.service';
import { Work } from '../../../core/enums/work.enum';
import { PaginatedInfo } from '../../../core/interfaces/paginated-info.interface';

@Component({
	selector: 'app-paginator',
	templateUrl: './paginator.component.html',
	styleUrls: ['./paginator.component.scss'],
})
export class PaginatorComponent implements OnInit {
	public length = 0;
	public pageSize = 6;
	public pageIndex = 0;
	public pageSizeOptions = [];
	public hidePageSize = true;
	public showPageSizeOptions = false;
	public showFirstLastButtons = false;
	public disabled = false;
	public pageEvent!: PageEvent;
	@Input() workType = Work.TASK;

	constructor(private ps: PaginatorService) {}

	ngOnInit(): void {
		this.workType === Work.TASK
			? this.setPaginatedInfo(this.ps.tasksPaginatorInfo())
			: this.setPaginatedInfo(this.ps.examsPaginatorInfo());
	}

	private setPaginatedInfo({ total }: PaginatedInfo) {
		this.length = total;
	}

	public handlePageEvent(e: PageEvent) {
		console.log(e);
		// this.ps.setPages()
	}

	// setPageSizeOptions(setPageSizeOptionsInput: string) {
	//   if (setPageSizeOptionsInput) {
	//     this.pageSizeOptions = setPageSizeOptionsInput.split(',').map(str => +str);
	//   }
	// }
}
