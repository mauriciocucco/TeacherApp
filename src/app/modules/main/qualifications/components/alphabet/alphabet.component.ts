import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	ViewChild,
	WritableSignal,
	computed,
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
import { Student } from 'src/app/core/interfaces/student.interface';

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
	private enabledLetters = computed(() =>
		this.students()
			.map(student => student.lastname?.charAt(0).toUpperCase())
			.filter((letter, index, self) => self.indexOf(letter) === index)
	);
	private qs = inject(QualificationsService);
	private vs = inject(ViewService);
	private students = this.qs.students;
	private checkedButton: MatButtonToggle | null = null;
	private router = inject(Router);
	private destroyRef = inject(DestroyRef);
	@ViewChild('alphabetToggleGroup', { static: false })
	alphabetToggleGroup?: ElementRef;

	ngOnInit(): void {
		this.listenCleanAlphabet();
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

		this.qs.letterSelected.set(null);
		this.qs.cleanAlphabet.next(false);
	}

	public showStudentsWithLetter(letter: string) {
		if (this.vs.screenType() === ScreenType.MOBILE) {
			this.qs.cleanShow(this.students as WritableSignal<Student[]>);
			this.qs.setShowByLetter(letter);
			this.qs.letterSelected.set(letter);
			return;
		}

		this.router.navigateByUrl(`/#${letter}`);
	}

	public toggleChange(event: MatButtonToggleChange) {
		this.checkedButton = event.source;
	}

	public checkIfExists(letter: string) {
		return this.enabledLetters().includes(letter);
	}
}
