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
