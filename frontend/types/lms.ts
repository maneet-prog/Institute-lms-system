export interface Institute {
  institute_id: string;
  name: string;
  email: string;
  mob_no: string;
  country: string;
  state: string;
  place: string;
  pincode: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: string;
  institute_id: string;
  institute_name?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  mob_no: string;
  is_approved: boolean;
  active: boolean;
  role_names: string[];
  created_at: string;
  selected_courses?: Array<{
    course_id: string;
    course_name?: string | null;
    subcourse_id: string;
    subcourse_name?: string | null;
  }>;
  assigned_batches?: Array<{
    batch_id: string;
    batch_name?: string | null;
    course_id: string;
    course_name?: string | null;
    subcourse_id: string;
    subcourse_name?: string | null;
  }>;
}

export interface Course {
  course_id: string;
  institute_id: string;
  course_name: string;
  description?: string | null;
  image_url?: string | null;
  active: boolean;
}

export interface SubCourse {
  subcourse_id: string;
  course_id: string;
  institute_id: string;
  subcourse_name: string;
  description?: string | null;
  image_url?: string | null;
  active: boolean;
}

export interface Module {
  module_id: string;
  course_id: string;
  subcourse_id: string;
  institute_id: string;
  module_name: string;
  active: boolean;
}

export interface Content {
  content_id: string;
  institute_id: string;
  module_id: string;
  batch_id: string;
  created_by?: string | null;
  title: string;
  type: string;
  description?: string | null;
  file_url?: string | null;
  external_url?: string | null;
  resolved_url?: string | null;
  order_index: number;
  category?: string;
  body_text?: string | null;
  instructions?: string | null;
  downloadable?: boolean;
  response_type?: string | null;
  quiz?: {
    mode: "mcq" | "written" | "mixed";
    attempt_limit: number;
    questions: Array<{
      question_id: string;
      type: "mcq" | "written";
      prompt: string;
      options: Array<{
        option_id: string;
        text: string;
      }>;
      correct_option_id?: string | null;
      reference_answer?: string | null;
      max_marks: number;
    }>;
  } | null;
  url?: string | null;
  duration: number;
  created_at?: string;
  updated_at?: string | null;
}

export interface Batch {
  batch_id: string;
  institute_id: string;
  course_id: string;
  subcourse_id: string;
  batch_name: string;
  active: boolean;
  detail?: {
    description?: string | null;
    room_name?: string | null;
    schedule_notes?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
}

export interface BatchDetail {
  batch_id: string;
  batch_name: string;
  active: boolean;
  description?: string | null;
  room_name?: string | null;
  schedule_notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  course: {
    course_id: string;
    course_name: string;
    description?: string | null;
    image_url?: string | null;
  };
  subcourse: {
    subcourse_id: string;
    subcourse_name: string;
    description?: string | null;
    image_url?: string | null;
  };
  teachers: User[];
  students: User[];
}

export interface StudentBatchInfo {
  batch_id: string;
  batch_name: string;
  course_id: string;
  course_name: string;
  course_description?: string | null;
  course_image_url?: string | null;
  subcourse_id: string;
  subcourse_name: string;
  subcourse_description?: string | null;
  subcourse_image_url?: string | null;
  description?: string | null;
  room_name?: string | null;
  schedule_notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface StudentSubmission {
  submission_id: string;
  response_type: string;
  response_text?: string | null;
  response_url?: string | null;
  submission_kind: "activity" | "quiz";
  latest_attempt_number: number;
  latest_auto_score: number;
  latest_awarded_marks?: number | null;
  max_score: number;
  review_status: "pending" | "reviewed";
  feedback?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  attempts: Array<{
    attempt_number: number;
    response_type: string;
    response_text?: string | null;
    response_url?: string | null;
    auto_score: number;
    awarded_marks?: number | null;
    max_score: number;
    status: "submitted" | "reviewed";
    feedback?: string | null;
    reviewed_at?: string | null;
    reviewed_by?: string | null;
    submitted_at: string;
    answers: Array<{
      question_id: string;
      prompt: string;
      question_type: "mcq" | "written";
      selected_option_id?: string | null;
      selected_option_text?: string | null;
      response_text?: string | null;
      correct_option_id?: string | null;
      is_correct?: boolean | null;
      auto_marks: number;
      max_marks: number;
    }>;
  }>;
  submitted_at: string;
}

export interface StudentWorkspaceContent extends Content {
  submission?: StudentSubmission | null;
}

export interface StudentWorkspaceModule {
  module_id: string;
  module_name: string;
  subcourse_id: string;
  subcourse_name: string;
  batch_id: string;
  batch_name: string;
  content: StudentWorkspaceContent[];
}

export interface StudentBatchWorkspace {
  batch_id: string;
  batch_name: string;
  course_id: string;
  course_name?: string;
  course_description?: string | null;
  course_image_url?: string | null;
  subcourse_id: string;
  subcourse_name?: string;
  subcourse_description?: string | null;
  subcourse_image_url?: string | null;
  content_categories: string[];
  selected_category?: string | null;
  modules: StudentWorkspaceModule[];
}

export interface StudentModuleBundle {
  batch_id: string;
  batch_name: string;
  module_id: string;
  module_name: string;
  content: Content[];
}

export interface StudentDashboardOverview {
  batch_count: number;
  module_count: number;
  completed_module_count: number;
  pending_module_count: number;
  average_progress_percent: number;
  submission_count: number;
  reviewed_submission_count: number;
}

export interface StudentDashboardBatch extends StudentBatchInfo {
  module_count: number;
  completed_module_count: number;
  average_progress_percent: number;
}

export interface StudentDashboardModule {
  module_id: string;
  module_name: string;
  batch_id: string;
  batch_name: string;
  course_id: string;
  course_name: string;
  subcourse_id: string;
  subcourse_name: string;
  content_count: number;
  total_duration_minutes: number;
  next_content_title?: string | null;
  completed: boolean;
  progress_percent: number;
  last_accessed?: string | null;
}

export interface StudentDashboardData {
  student: {
    user_id: string;
    institute_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  overview: StudentDashboardOverview;
  activity_chart: Array<{
    label: string;
    submissions: number;
    module_completions: number;
  }>;
  batches: StudentDashboardBatch[];
  modules: StudentDashboardModule[];
  submissions: Array<StudentSubmission & {
    content_id: string;
    content_title: string;
    content_type: string;
    module_id: string;
    module_name: string;
    batch_id: string;
    batch_name: string;
    latest_submitted_at?: string | null;
  }>;
}

export interface ReviewableSubmission extends StudentSubmission {
  student: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    mob_no: string;
  } | null;
  batch: {
    batch_id: string;
    batch_name: string;
  };
  module: {
    module_id: string;
    module_name: string;
  };
  content: {
    content_id: string;
    title: string;
    type: string;
    category: string;
  };
  latest_submitted_at?: string | null;
}

export interface UserProgress {
  id: string;
  institute_id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  progress_percent: number;
  last_accessed: string;
}

export interface MessageResponse {
  message: string;
}
