import { Subject } from '../../../../../../core/interfaces/subject.interface';
export interface InfoPayload {
	name: string;
	date: string;
	description?: string;
	workId: number;
	workSubject: Subject;
}
