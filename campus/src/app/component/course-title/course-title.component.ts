import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CourseService } from '../../services/course/course.service';
import { ApiResponse } from "../../models/common/api-response.interface";
import { ModalController } from '@ionic/angular';
import { CourseCreateModalComponent } from "../course-create-modal/course-create-modal.component";
import { UpdateCourseModalComponent } from "../update-course-modal/update-course-modal.component";
import { CourseResponseData } from 'src/app/models/course/courses/course-response.interface';

@Component({
  selector: 'app-course-title',
  templateUrl: './course-title.component.html',
  styleUrls: ['./course-title.component.scss'],
})
export class CourseTitleComponent implements OnInit {
  courses: CourseResponseData[] = [];
  courseId: number = 0;  // number 타입으로 수정
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private courseService: CourseService,
    private modalController: ModalController
  ) { 
    // localStorage에서 가져온 값을 number로 변환
    const storedCourseIds = localStorage.getItem('courseId');
    if (storedCourseIds) {
      try {
        const courseIds = JSON.parse(storedCourseIds); // 배열로 파싱
        if (Array.isArray(courseIds) && courseIds.length > 0) {
          this.courseId = courseIds[0]; // 배열의 첫 번째 값 사용
        }
      } catch (error) {
        console.error('Error parsing courseId:', error);
      }
    }
  }

  ngOnInit() {
    if (this.courseId) {
      this.loadTitleCourses();
    } else {
      this.errorMessage = '강좌 ID를 찾을 수 없습니다.';
      console.error('No courseId found in localStorage');
    }
  }

  // 코스에 대한 data 반환
  async loadTitleCourses() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (!this.courseId) {
        throw new Error('강좌 ID가 없습니다.');
      }

      const response: ApiResponse<CourseResponseData[]> = await firstValueFrom(
        this.courseService.getOneCourses(this.courseId)
      );

      if (!response || !response.data) {
        throw new Error('서버로부터 데이터를 받지 못했습니다.');
      }

      // response.data가 배열이 아닌 단일 객체일 경우 배열로 변환
      if (!Array.isArray(response.data)) {
        this.courses = [response.data];
      } else {
        this.courses = response.data;
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      this.errorMessage = error instanceof Error ? error.message : '강좌 정보를 불러오는 중 오류가 발생했습니다.';
      this.courses = [];
    } finally {
      this.isLoading = false;
    }
  }

  // 수정 모달 열기
  async openUpdateModal(course: CourseResponseData) {
    try {
      const modal = await this.modalController.create({
        component: UpdateCourseModalComponent,
        cssClass: 'modal',
        componentProps: { course }
      });

      await modal.present();

      // 모달이 닫힐 때 결과 처리
      const { data } = await modal.onWillDismiss();
      if (data?.updated) {
        // 강좌가 업데이트되었다면 목록 새로고침
        await this.loadTitleCourses();
      }
    } catch (error) {
      console.error('Error opening modal:', error);
      this.errorMessage = '모달을 여는 중 오류가 발생했습니다.';
    }
  }

  // 생성 모달 열기
  async openCreateModal() {
    try {
      const modal = await this.modalController.create({
        component: CourseCreateModalComponent,
        cssClass: 'modal'
      });

      await modal.present();

      // 모달이 닫힐 때 결과 처리
      const { data } = await modal.onWillDismiss();
      if (data?.created) {
        // 새 강좌가 생성되었다면 목록 새로고침
        await this.loadTitleCourses();
      }
    } catch (error) {
      console.error('Error opening create modal:', error);
      this.errorMessage = '모달을 여는 중 오류가 발생했습니다.';
    }
  }

  // 에러 메시지 초기화
  clearError() {
    this.errorMessage = '';
  }
}