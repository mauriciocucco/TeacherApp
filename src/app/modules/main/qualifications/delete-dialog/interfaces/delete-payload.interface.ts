import { Work } from '../../../../../core/enums/work.enum';

export interface DeletePayload {
	workId: number;
	workName: string;
	courseId: number;
	workType: Work;
}
