import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	ViewChild,
	inject,
} from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { QualificationsService } from '../../../../../core/services/qualifications/qualifications.service';
import { ViewService } from '../../../../../core/services/view/view.service';
import { ScreenType } from '../../../../../core/enums/screen-type.enum';
import { OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	MatButtonToggle,
	MatButtonToggleChange,
} from '@angular/material/button-toggle';
import { Router } from '@angular/router';

@Component({
	selector: 'app-alphabet',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './alphabet.component.html',
	styleUrls: ['./alphabet.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlphabetComponent implements OnInit {
	private alpha = Array.from(Array(26)).map((e, i) => i + 65);
	public alphabet = this.alpha.map(x => String.fromCharCode(x));
	private qs = inject(QualificationsService);
	private vs = inject(ViewService);
	private checkedButton: MatButtonToggle | null = null;
	private router = inject(Router);
	private destroyRef = inject(DestroyRef);
	@ViewChild('alphabetToggleGroup', { static: false })
	alphabetToggleGroup?: ElementRef;

	ngOnInit(): void {
		this.listenCleanAlphabet();
	}

	public showStudentsWithLetter(letter: string) {
		if (this.vs.screenType() === ScreenType.MOBILE) {
			this.qs.showStudentsByLetter.next(letter);
			this.qs.setShowByLetter(letter);
			this.qs.letterSelected.set(letter);
			return;
		}

		this.router.navigateByUrl(`/#${letter}`);
	}

	private listenCleanAlphabet() {
		this.qs.cleanAlphabet$
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(clean => {
				if (clean) this.removeSelectedButton();
			});
	}

	private removeSelectedButton() {
		if (this.checkedButton) this.checkedButton.checked = false;

		this.qs.cleanAlphabet.next(false);
	}

	public toggleChange(event: MatButtonToggleChange) {
		this.checkedButton = event.source;
	}
}
