import { Injectable, WritableSignal, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Observable, forkJoin, map, of, startWith } from 'rxjs';
import { Endpoints } from '../../../modules/main/qualifications/enums/endpoints.enum';
import { Subject as SchoolSubject } from '../../../core/interfaces/subject.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { Course } from '../../interfaces/course.interface';
import { Marking } from '../../interfaces/marking.interface';
import { Task } from '../../interfaces/task.interface';
import { Exam } from '../../interfaces/exam.interface';
import { Student } from '../../interfaces/student.interface';
import { TasksAndExamsParams } from '../../../modules/main/qualifications/interfaces/tasks-and-exams-params.interface';
import { StudentsParams } from '../../../modules/main/qualifications/interfaces/students-params.interface';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Work } from '../../../modules/main/qualifications/enums/work.enum';
import { AllWord } from '../../../modules/main/qualifications/enums/all-word.enum';

type ControlType = 'Students' | 'Tasks' | 'Exams';

@Injectable({
	providedIn: 'root',
})
export class QualificationsService {
	public subjects$: Observable<SchoolSubject[]> = this.apiService.get(
		Endpoints.SUBJECTS
	);
	public courses$: Observable<Course[]> = this.apiService.get(
		Endpoints.COURSES
	);
	public markings$: Observable<Marking[]> = this.apiService.get(
		Endpoints.MARKINGS
	);
	public subjects = toSignal(this.subjects$, { initialValue: [] });
	public courses = toSignal(this.courses$, { initialValue: [] });
	public markings = toSignal(this.markings$, { initialValue: [] });
	public tasks: WritableSignal<Task[]> = signal([]);
	public exams: WritableSignal<Exam[]> = signal([]);
	public students: WritableSignal<Student[]> = signal([]);
	public filteredTasks: WritableSignal<Task[]> = signal([]);
	public filteredExams: WritableSignal<Exam[]> = signal([]);
	public filteredStudents: WritableSignal<Student[]> = signal([]);
	public progressOn = signal(false);

	constructor(private apiService: ApiService) {}

	public getTasksExamsAndStudents(
		tasksAndExamsParams: TasksAndExamsParams | null,
		studentsParams: StudentsParams | null
	) {
		this.progressOn.set(true);

		const tasks$ = tasksAndExamsParams
			? this.apiService.get<Task[]>(Endpoints.TASKS, {
					params: tasksAndExamsParams,
			  })
			: of([]);
		const exams$ = tasksAndExamsParams
			? this.apiService.get<Exam[]>(Endpoints.EXAMS, {
					params: tasksAndExamsParams,
			  })
			: of([]);
		const students$ = studentsParams
			? this.apiService.get<Student[]>(Endpoints.STUDENTS, {
					params: studentsParams,
			  })
			: of([]);

		forkJoin([tasks$, exams$, students$]).subscribe(result => {
			const tasks = result[0];
			const exams = result[1];
			const students = result[2];

			this.tasks.set(tasks);
			this.exams.set(exams);
			this.students.set(students);
			this.cleanShow(this.tasks);
			this.cleanShow(this.exams);
			this.cleanShow(this.students);
			this.filteredTasks.set(tasks);
			this.filteredExams.set(exams);
			this.filteredStudents.set(students);

			this.progressOn.set(false);
		});
	}

	public processValueChanges(
		valueChanges$: Observable<string | null> | undefined,
		controlType: ControlType = 'Students'
	) {
		return valueChanges$?.pipe(
			startWith(''),
			map(value => this.filterValues(value, controlType))
		);
	}

	private filterValues(
		value: string | null,
		controlType: ControlType = 'Students'
	): Student[] | Task[] | Exam[] {
		let selectedArray: Student[] | Task[] | Exam[] = this.students();

		if (controlType === 'Tasks') selectedArray = this.tasks();
		if (controlType === 'Exams') selectedArray = this.exams();

		if (!value) return selectedArray;

		return this.processAutocompleteOutput(
			value.toLowerCase(),
			selectedArray
		);
	}

	private processAutocompleteOutput(
		filterValue: string,
		arrayToFilter: any[]
	) {
		return arrayToFilter.filter((element: Student | Task | Exam) => {
			if (this.isStudentElement(element)) {
				return `${element.name} ${element.lastname}`
					.toLowerCase()
					.includes(filterValue);
			}

			return element.name.toLowerCase().includes(filterValue);
		});
	}

	//es una función Type Guard de Tyepscript
	private isStudentElement(
		element: Student | Task | Exam
	): element is Student {
		return 'lastname' in element;
	}

	public showSelectedStudent(option: MatAutocompleteSelectedEvent) {
		const value = option.option.value;

		this.cleanShow(this.students);

		if (value === AllWord.INCLUSIVE) return;

		const studentSelected = this.students().find(
			student => `${student.name} ${student.lastname}` === value
		);

		this.students.mutate(students => {
			students.forEach(student => {
				if (student.id !== studentSelected?.id) student.show = false;
			});
		});
	}

	public showSelectedTaskOrExam(
		option: MatAutocompleteSelectedEvent,
		type = Work.TASK
	) {
		const valueSelected = option.option.value;
		let selectedSignal: WritableSignal<Task[]> | WritableSignal<Exam[]> =
			this.tasks;

		if (type === Work.EXAM) selectedSignal = this.exams;

		this.cleanShow(selectedSignal);

		if (valueSelected === AllWord.FEMALE || valueSelected === AllWord.MALE)
			return;

		const selectedElement = selectedSignal().find(
			element => element.name === valueSelected
		);

		selectedSignal.mutate(elements => {
			elements.forEach(element => {
				if (element.id !== selectedElement?.id) element.show = false;
			});
		});
	}

	public filterTasksAndExamsBySubject(subjectId: number) {
		this.cleanShow(this.tasks);
		this.cleanShow(this.exams);

		if (!subjectId) return;

		this.tasks.mutate(tasks => {
			tasks.forEach(task => {
				if (task.subjectId !== subjectId) task.show = false;
			});
		});

		this.exams.mutate(exams => {
			exams.forEach(exam => {
				if (exam.subjectId !== subjectId) exam.show = false;
			});
		});
	}

	private cleanShow(signal: WritableSignal<Task[] | Exam[] | Student[]>) {
		signal.mutate(elements => {
			elements.forEach(element => (element.show = true));
		});
	}
}
