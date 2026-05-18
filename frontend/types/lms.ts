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
  exam_type: "reading" | "writing" | "listening" | "speaking" | "general";
  module_subcategories: Array<{
    subcategory_id: string;
    name: string;
    active: boolean;
    is_default?: boolean;
  }>;
  active: boolean;
}

export interface QuizOption {
  option_id: string;
  text: string;
}

export interface TecaiParagraph {
  type?: "p" | "table";
  html: string;
  text: string;
}

export interface TecaiReadingRenderer {
  kind: "tecai_reading";
  timer_seconds: number;
  paragraphs: TecaiParagraph[];
}

export interface ExamAsset {
  asset_id: string | null;
  type: string;
  title?: string | null;
  url?: string | null;
  content?: string | null;
  mime_type?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface ExamPart {
  part_id: string | null;
  title: string;
  kind: "part" | "section" | "task" | string;
  instructions?: string | null;
  timer_seconds: number;
  passages: ExamAsset[];
  audio: ExamAsset[];
  images: ExamAsset[];
  resources: ExamAsset[];
  questions: Array<{
    question_id: string | null;
    type: string;
    prompt: string;
    instructions?: string | null;
    options: QuizOption[];
    answer_data?: Record<string, unknown> | null;
    answer_key?: Record<string, unknown> | null;
    max_marks: number;
    order_index: number;
  }>;
  answer_data?: Record<string, unknown> | null;
  order_index: number;
}

export interface TecaiWritingRenderer {
  kind: "tecai_writing";
  timer_seconds: number;
  instructions?: string;
  blocks?: TecaiParagraph[];
  parts?: Array<{
    part_id: string;
    title: string;
    kind: string;
    instructions?: string;
    prompt_html?: string;
    prompt_text?: string;
    minimum_words: number;
    placeholder?: string;
    resources: Array<{
      asset_id: string;
      type: string;
      title?: string;
      url?: string;
      content?: string;
    }>;
  }>;
}

export interface TecaiListeningRenderer {
  kind: "tecai_listening";
  timer_seconds: number;
  audio_url: string;
  prompt_file_url: string;
  instructions?: string;
}

export interface TecaiSpeakingRenderer {
  kind: "tecai_speaking";
  timer_seconds: number;
  exam_type?: string;
  instructions?: string;
  allow_rerecord?: boolean;
  voice?: {
    provider?: string | null;
    voice_id?: string | null;
  } | null;
  instruction_audio_asset?: ExamAsset | null;
  parts: Array<{
    part_id: string;
    title: string;
    kind: string;
    instructions?: string;
    instruction_audio_asset?: ExamAsset | null;
    questions: Array<{
      question_id: string;
      prompt: string;
      instructions?: string;
      prep_seconds: number;
      record_seconds: number;
      audio_asset?: ExamAsset | null;
      order_index: number;
    }>;
  }>;
}

export type TecaiQuizRenderer =
  | TecaiReadingRenderer
  | TecaiWritingRenderer
  | TecaiListeningRenderer
  | TecaiSpeakingRenderer;

export interface Content {
  content_id: string;
  institute_id: string;
  module_id: string;
  batch_id: string | null;
  source_content_id?: string | null;
  created_by?: string | null;
  is_reusable_template?: boolean;
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
  response_type?: string | null;
  visibility_scope?: "batch" | "selected_students";
  assigned_student_ids?: string[];
  hidden_student_ids?: string[];
  module_subcategory_id?: string;
  module_subcategory_name?: string;
  completed?: boolean;
  exam?: {
    exam_type_id?: string | null;
    module_id?: string | null;
    module_code?: string | null;
    module_label?: string | null;
    renderer_kind?: string | null;
    timer_seconds: number;
    parts: ExamPart[];
    metadata?: Record<string, unknown> | null;
  } | null;
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
    renderer?: TecaiQuizRenderer | null;
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
    renderer_kind?: string | null;
    time_taken_seconds?: number;
    transcript_text?: string | null;
    ai_evaluation?: Record<string, unknown> | null;
    fluency_score?: number | null;
    grammar_score?: number | null;
    pronunciation_score?: number | null;
    vocabulary_score?: number | null;
    auto_score: number;
    awarded_marks?: number | null;
    max_score: number;
    status: "submitted" | "reviewed";
    feedback?: string | null;
    reviewed_at?: string | null;
    reviewed_by?: string | null;
    submitted_at: string;
    exam_responses: Array<{
      part_id?: string | null;
      question_id?: string | null;
      response_text?: string | null;
      response_url?: string | null;
      storage_key?: string | null;
      response_data?: Record<string, unknown> | null;
      word_count: number;
      duration_seconds: number;
      transcript?: string | null;
      evaluation?: Record<string, unknown> | null;
      score?: number | null;
      fluency_score?: number | null;
      grammar_score?: number | null;
      pronunciation_score?: number | null;
      vocabulary_score?: number | null;
    }>;
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

export interface TecaiExamData {
  content: Content;
  renderer: TecaiQuizRenderer;
  student_name: string;
  submission?: StudentSubmission | null;
}

export interface CourseModuleExamData {
  route: {
    course_id: string;
    exam_type_id: string;
    module_id: string;
    batch_id?: string | null;
    content_id: string;
  };
  course: Course;
  exam_type: SubCourse;
  module: Module;
  content: Content;
  renderer: TecaiQuizRenderer;
  student_name: string;
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
  completed_content_ids: string[];
  total_content_count: number;
  completed_content_count: number;
  last_accessed: string;
}

export interface UserDetailsResponse {
  user: User;
  courses: {
    enrolled: Array<{
      id: string;
      course_id: string;
      course_name: string;
      subcourse_id: string;
      subcourse_name: string;
      enrolled_at: string;
    }>;
    selected: Array<{
      course_id: string;
      course_name: string;
      subcourse_id: string;
      subcourse_name: string;
    }>;
  };
  batches: {
    assigned: Array<{
      id: string;
      batch_id: string;
      batch_name: string;
      course_id: string;
      course_name: string;
      subcourse_id: string;
      subcourse_name: string;
      assigned_at: string;
    }>;
    teaching: Array<{
      id: string;
      batch_id: string;
      batch_name: string;
      course_id: string;
      course_name: string;
      subcourse_id: string;
      subcourse_name: string;
      assigned_at: string;
    }>;
  };
  modules: Array<{
    id: string;
    module_id: string;
    module_name: string;
    exam_type: "reading" | "writing" | "listening" | "speaking" | "general";
    course_id: string;
    course_name: string;
    subcourse_id: string;
    subcourse_name: string;
    enrolled_at: string;
  }>;
  progress: Array<{
    id: string;
    module_id: string;
    module_name: string;
    completed: boolean;
    progress_percent: number;
    last_accessed: string;
    course_id: string;
    course_name: string;
    subcourse_id: string;
    subcourse_name: string;
  }>;
  content: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
    file_url: string | null;
    external_url: string | null;
    order_index: number;
    duration: number;
    visibility_scope: string;
    created_at: string;
    module_id: string;
    module_name: string;
    batch_id: string | null;
    batch_name: string | null;
    created_by: string | null;
  }>;
  submissions: Array<{
    id: string;
    module_id: string;
    module_name: string;
    exam_id: string | null;
    status: string;
    attempts_count: number;
    latest_attempt: {
      attempt_number: number;
      submitted_at: string;
      auto_score: number;
      awarded_marks: number | null;
      max_score: number;
      status: string;
      feedback: string | null;
      reviewed_at: string | null;
      reviewed_by: string | null;
    } | null;
    course_id: string;
    course_name: string;
    subcourse_id: string;
    subcourse_name: string;
    created_at: string;
  }>;
}

export interface MessageResponse {
  message: string;
}

export interface SpeakingAudioUploadResponse {
  audio_url: string;
  storage_key: string;
  mime_type: string;
  original_name: string;
  size_bytes: number;
}
