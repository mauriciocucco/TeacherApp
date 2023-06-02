export interface CreateExam {
	name: string;
	description: string;
	date: Date;
	subjectId: number;
	courseId: number;
}
