import { Injectable, WritableSignal, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
	BehaviorSubject,
	Observable,
	forkJoin,
	map,
	startWith,
	tap,
} from 'rxjs';
import { Endpoints } from '../../../modules/main/qualifications/enums/endpoints.enum';
import { Subject as SchoolSubject } from '../../../core/interfaces/subject.interface';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
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
	private subjects$: Observable<SchoolSubject[]> = this.apiService.get(
		Endpoints.SUBJECTS
	);
	private courses$: Observable<Course[]> = this.apiService.get(
		Endpoints.COURSES
	);
	private markings$: Observable<Marking[]> = this.apiService.get(
		Endpoints.MARKINGS
	);
	private tasksSub: BehaviorSubject<Task[]> = new BehaviorSubject(
		[] as Task[]
	);
	private examsSub: BehaviorSubject<Exam[]> = new BehaviorSubject(
		[] as Exam[]
	);
	private studentsSub: BehaviorSubject<Student[]> = new BehaviorSubject(
		[] as Student[]
	);
	public subjects = toSignal(this.subjects$, { initialValue: [] });
	public courses = toSignal(this.courses$, { initialValue: [] });
	public markings = toSignal(this.markings$, { initialValue: [] });
	public tasks = toSignal(this.tasksSub, { initialValue: [] });
	public tasks$ = toObservable(this.tasks).pipe(
		tap(value => this.filteredTasks.set(value))
	);
	public exams = toSignal(this.examsSub, { initialValue: [] });
	public exams$ = toObservable(this.exams).pipe(
		tap(value => this.filteredExams.set(value))
	);
	public students = toSignal(this.studentsSub, { initialValue: [] });
	public students$ = toObservable(this.students).pipe(
		tap(value => this.filteredStudents.set(value))
	);
	public filteredTasks: WritableSignal<Task[]> = signal([]);
	public filteredExams: WritableSignal<Exam[]> = signal([]);
	public filteredStudents: WritableSignal<Student[]> = signal([]);

	constructor(private apiService: ApiService) {}

	public getTasksAndExams(taskAndExamsParams: TasksAndExamsParams) {
		const obs1 = this.apiService.get<Task[]>(Endpoints.TASKS, {
			params: taskAndExamsParams,
		});
		const obs2 = this.apiService.get<Exam[]>(Endpoints.EXAMS, {
			params: taskAndExamsParams,
		});

		forkJoin([obs1, obs2]).subscribe(result => {
			this.tasksSub.next(result[0]); // Va a generar que tasks cambie porque está unido a tasks$ por toSignal
			this.examsSub.next(result[1]); // Va a generar que exams cambie porque está unido a exams$ por to Signal
		});
	}

	public getStudents(studentsParams: StudentsParams) {
		this.apiService
			.get<Student[]>(Endpoints.STUDENTS, {
				params: studentsParams,
			})
			.subscribe(result => {
				this.studentsSub.next(result);
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

		if (value === AllWord.INCLUSIVE)
			return this.filteredStudents.set(this.students());

		const student = this.students().find(
			student => `${student.name} ${student.lastname}` === value
		);

		this.filteredStudents.set([student as Student]);
	}

	public showSelectedTaskOrExam(
		option: MatAutocompleteSelectedEvent,
		type = Work.TASK
	) {
		const valueSelected = option.option.value;
		let completeArray: Task[] | Exam[] = this.tasks();
		let signalSelectedToFilter:
			| WritableSignal<Task[]>
			| WritableSignal<Exam[]> = this.filteredTasks;

		if (type === Work.EXAM) {
			completeArray = this.exams();
			signalSelectedToFilter = this.filteredExams;
		}

		if (valueSelected === AllWord.FEMALE || valueSelected === AllWord.MALE)
			return signalSelectedToFilter.set(completeArray);

		const objectToEmit = completeArray.find(
			element => element.name === valueSelected
		);

		return signalSelectedToFilter.set([objectToEmit as Task | Exam]);
	}

	public filterTasksAndExamsBySubject(subjectId: number) {
		const filteredTaks = this.tasks().filter(task => {
			return subjectId !== 0 ? task.subjectId === subjectId : true;
		});
		const filteredExams = this.exams().filter(exam => {
			return subjectId !== 0 ? exam.subjectId === subjectId : true;
		});

		this.filteredTasks.set(filteredTaks);
		this.filteredExams.set(filteredExams);
	}
}
