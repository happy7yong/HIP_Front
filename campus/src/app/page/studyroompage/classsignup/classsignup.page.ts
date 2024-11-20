import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CourseCreateModalComponent } from '../../../component/course-create-modal/course-create-modal.component';
import { CourseService } from '../../../services/course/course.service'; // CourseService 가져오기
import { firstValueFrom } from 'rxjs'; // firstValueFrom 가져오기
import { ApiResponse } from 'src/app/models/common/api-response.interface';
import { Registration } from '../../../models/enums/role.enums';
import { HttpErrorResponse } from '@angular/common/http';
import { CourseWithCourseRegistrationResponseData } from 'src/app/models/course/courses/course-with-courseregistration-resoinse.interface';
import { CourseResponseData } from 'src/app/models/course/courses/course-response.interface';
import { UserResponse } from 'src/app/models/common/user-response';
import { CourseRegistration } from 'src/app/models/course/courses/course-registation-response.interface';


@Component({
  selector: 'app-classsignup',
  templateUrl: './classsignup.page.html',
  styleUrls: ['./classsignup.page.scss'],
})




export class ClasssignupPage implements OnInit {
  registeredCourses: Set<number> = new Set();
  courses: CourseResponseData[] = [];
  // 클래스의 맨 위에 타입 정의 추가CourseWithCo
  CourseRegistrationResponseData: { [courseId: number]: CourseRegistration[] } = {};
  generations: string[] = ['1', '2', '3', '4', '5']; // 가능한 세대 목록(하드코딩)
  selectedGeneration: string = '3기' // 기본값으로 3세대 선택
  userRoleU : { [user_role : string ] : UserResponse[] } = {} ;

  constructor(
    private modalController: ModalController,
    private courseService: CourseService // 서비스 주입
  ) {}

  ngOnInit() {
    const savedGeneration = localStorage.getItem('selectedGeneration');
    const savedUserRole = localStorage.getItem('userRole');
    const courseId = Number(localStorage.getItem('courseId'));  // 예시: localStorage에서 courseId 가져오기
    const userId = Number(localStorage.getItem('userId'));      // 예시: localStorage에서 userId 가져오기

    if (savedGeneration) {
      this.selectedGeneration = savedGeneration;
    }

    // userRole 값 가져오기
    if (savedUserRole) {
      this.userRoleU = JSON.parse(savedUserRole); // JSON.parse로 파싱
    }

    this.loadCourses();

    // courseId와 userId가 존재할 때만 courseinqueryUser 호출
    if (courseId && userId) {
      this.courseinqueryUser(courseId, userId);
    }
  }

  /*
  async loadAllCourseInquiries() {
    for (const course of this.courses) {
      await this.courseinqueryUser(course);
    }
  }*/

  // 강의 신청 유저 조회하기
  async courseinqueryUser(courseId: number, userId: number) {
    try {
      const response: ApiResponse<CourseRegistration> = await firstValueFrom(
        this.courseService.getRegistration(courseId, userId)
      );
  
      if (response?.data) {        
        // applicant와 currentCourse가 존재하는지 먼저 확인
        const applicant = response.data.user;
        const currentCourse = response.data.course;
  
        if (!applicant || !currentCourse) {
          console.error('Required data is missing');
          return;
        }
  
        // 필수 데이터가 있는 경우에만 매핑 진행
        const mappedRegistration: CourseRegistration = {
          course_registration_id: response.data.course_registration_id,
          course_registration_status: response.data.course_registration_status,
          course_reporting_date: new Date(response.data.course_reporting_date),
          user: {
            user_id: applicant.user_id,
            id: applicant.id || '',  // 여기서는 user_id 사용
            user_name: applicant.user_name || '',
            email: applicant.email || '',
            user_role: applicant.user_role || ''
          },
          course: {
            course_id: currentCourse.course_id,
            course_title: currentCourse.course_title || '',
            description: currentCourse.description || '',
            instructor_name: currentCourse.instructor_name || '',
            course_notice: currentCourse.course_notice || '',
            generation: currentCourse.generation || ''
          }
        };
  
        this.CourseRegistrationResponseData[courseId] = [mappedRegistration];
        console.log('Mapped registration data:', this.CourseRegistrationResponseData[courseId]);
      }
  
    } catch (error) {
      console.error(`Error loading registrations for course ${courseId}`, error);
      alert('강의 등록 정보를 불러오는 중 오류가 발생했습니다.');
    }
  }





  //courseId를 받고 generation이 같을 경우 반환
  // getApplicantsForCourse(courseId: number): CourseWithCourseRegistrationResponseData[] {
  //   const applicants = (this.CourseWithCourseRegistrationResponseData[courseId] || [])
  //     .filter(registration => registration.currentCourse.generation === this.selectedGeneration);

  //   console.log(`Applicants for course ID ${courseId} (Generation ${this.selectedGeneration}):`, applicants);
  //   return applicants;
  // }


  //기수값 변경
  onGenerationChange() {
    sessionStorage.setItem('selectedGeneration', this.selectedGeneration.toString());
    this.loadCourses();
  }

  //모든 강의 정보 로드
  async loadCourses() {

    try {
      const response: ApiResponse<CourseResponseData[]> = await firstValueFrom(this.courseService.getAllCourses());
      console.log('All courses:', response.data);
      this.courses = response.data.filter(course => {
        return course.generation == this.selectedGeneration;
      });
      console.log('Filtered courses:', this.courses);
      if (this.courses.length === 0) {
        console.warn('No courses found for the selected generation');
      }
    } catch (error) {
      console.error('Error loading courses', error);
    }
  }



  async createCourse() {
    const modal = await this.modalController.create({
      component: CourseCreateModalComponent,
      cssClass: 'modal',
      componentProps: {
        selectedGeneration: this.selectedGeneration
      }
    });
    return await modal.present();
  }

  async updateCourse(course: CourseResponseData) {
    const modal = await this.modalController.create({
      component: CourseCreateModalComponent,
      cssClass: 'modal',
      componentProps: { course }
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        try {
          const updatedCourse = result.data;
          const response = await firstValueFrom(this.courseService.updateCourse(course.course_id, updatedCourse));
          console.log('Course updated successfully:', response);


          this.loadCourses();
        } catch (error) {
          console.error('Error updating course:', error);
        }
      }
    });

    return await modal.present();
  }



  async deleteCourse(courseId: number) {
    const confirmed = confirm('이 강의를 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }
    try {
      const response: ApiResponse<void> = await firstValueFrom(this.courseService.deleteCourse(courseId)); // 숫자를 문자열로 변환하여 삭제 API 호출
      console.log(response.message);
      this.loadCourses();
    } catch (error) {
      console.error('강의 삭제 중 오류 발생', error);
    }
  }

  async getCurrentDate(): Promise<Date> {
    return new Date();
  }

  //강의신청
// course.component.ts
async joinCourse(courseId: number) {
  const token = localStorage.getItem('token');

  if (!token) {
      console.error('토큰을 찾을 수 없습니다.');
      alert('로그인이 필요합니다.');
      return;
  }

  try {
      const courseReportingDate = await this.getCurrentDate();
      const registrationData: CourseRegistration = {
          course_registration_id: 0, // 백엔드에서 생성될 ID
          course_registration_status: Registration.PENDING,
          course_reporting_date: courseReportingDate,
          user: {
            user_id: Number(localStorage.getItem('UserId')),  // 숫자 타입의 user_id 사용
            id: localStorage.getItem('LoginId') || '',        // 문자열 타입의 id 사용
            user_name: localStorage.getItem('UserName') || '',
            email: '',
            user_role: localStorage.getItem('Role') || ''
          }
      };

      const response = await firstValueFrom(
          this.courseService.joinCourse(courseId, registrationData)
      );

      if (response.status === 200) {
          console.log('강의 신청 성공:', response.message);
          alert('강의 신청이 완료되었습니다.');
          this.registeredCourses.add(courseId);
      } else {
          throw new Error(response.message || '강의 신청에 실패했습니다.');
      }

  } catch (error) {
      console.error('강의 신청 중 오류 발생:', error);
      let errorMessage = '강의 신청 중 오류가 발생했습니다.';

      if (error instanceof HttpErrorResponse) {
          switch (error.status) {
              case 400:
                  errorMessage = '잘못된 요청입니다.';
                  break;
              case 401:
                  errorMessage = '로그인이 필요합니다.';
                  break;
              case 409:
                  errorMessage = '이미 신청한 강의입니다.';
                  break;
              default:
                  errorMessage = '서버 오류가 발생했습니다.';
          }
      }

      alert(errorMessage);
  }
}


  //현재 강의를 신청했는지에 대한 변수
  isRegistered(courseId: number): boolean {
    return this.registeredCourses.has(courseId); // 강의 ID가 Set에 존재하는지 확인
  }





  /*//취소하기 기능
  async cancelRegistration(courseId: number) {
    const confirmed = confirm('수강 신청을 취소하시겠습니까?');
    if (!confirmed) {
      return;
    }

    // courseId에 해당하는 등록 ID 가져오기
    const registrationId = this.getRegistrationId(courseId);
    if (!registrationId) {
      console.error('등록 ID를 찾을 수 없습니다.');
      return;
    }

    try {
      // 강의 취소 요청
      const response: ApiResponse<void> = await firstValueFrom(this.courseService.canceljoinCourse(courseId, registrationId));
      console.log(response.message);
      alert('수강 신청이 취소되었습니다.');
      this.registeredCourses.delete(courseId); // 신청 목록에서 삭제
      this.courseJoinUser(); // 목록 갱신
    } catch (error) {
      console.error('수강 신청 취소 중 오류 발생', error);
    }
  }*/


  /*getRegistrationId(courseId: number): number | null {
    const registration = this.coursesRegistration.find(reg => reg.course_id === courseId);
    return registration ? registration.id : null; // 등록된 ID 반환, 없으면 null 반환
  }*/


  acceptApplicant(userId: CourseWithCourseRegistrationResponseData) {
    // 유저 수락 로직을 여기에 구현
    console.log(`User ${userId} accepted.`);
  }

  rejectApplicant(userId: CourseWithCourseRegistrationResponseData) {
    // 유저 거절 로직을 여기에 구현
    console.log(`User ${userId} rejected.`);
  }



}
