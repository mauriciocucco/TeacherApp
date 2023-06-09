import { Work } from '../../../../core/enums/work.enum';

export interface WorkInfo {
	workId: number;
	studentId: number;
	workType: Work;
}
