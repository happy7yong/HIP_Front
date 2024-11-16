import { Registration } from "../../enums/role.enums";

export interface CourseWithCourseRegistrationResponseData {
    course_id: number;          // 강의 ID
    course_title: string;       // 강의 제목
    description: string;        // 강의 설명
    instructor_name: string;    // 강사 이름
    generation: string;         // 기수
    course_notice: string | null; // 강의 공지사항 (null일 수 있음)
    course_registration: {
        id: number;
        status: Registration;
        date: Date;
        //...
    }[];
}

    