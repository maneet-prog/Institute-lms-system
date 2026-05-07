export interface FeatureItem {
  title: string;
  description: string;
}

export interface FeatureGroup {
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureItem[];
}

export const platformStats = [
  { value: "22+", label: "Years guiding language learners with confidence" },
  { value: "7+", label: "Signature programs across exam prep and spoken fluency" },
  { value: "4", label: "Role-based dashboards for admins, faculty, and students" },
  { value: "Daily", label: "Practice, progress, and coaching operations in one place" }
];

export const featureGroups: FeatureGroup[] = [
  {
    eyebrow: "Exam Readiness",
    title: "Training journeys inspired by high-touch coaching programs",
    description:
      "Organize IELTS, PTE, CELPIP, TOEFL, spoken English, French, and Duolingo preparation with clear modules, guided resources, and practical assignments.",
    items: [
      { title: "Program library", description: "Present each course path with a cleaner structure for learners and staff." },
      { title: "Practice delivery", description: "Support mock tests, written tasks, reading modules, and coaching resources." },
      { title: "Lesson sequencing", description: "Keep study material ordered so students know what to attempt next." },
      { title: "Progress visibility", description: "Track completion, responses, and readiness without extra spreadsheets." }
    ]
  },
  {
    eyebrow: "Student Journey",
    title: "Admissions, enrollments, and learner follow-through in one flow",
    description:
      "Guide students from registration and approval through assigned batches, submissions, and feedback with a calmer, more professional experience.",
    items: [
      { title: "OTP registration", description: "Register students securely before platform access is approved." },
      { title: "Batch assignment", description: "Place each learner into the right coaching group and course track." },
      { title: "Teacher feedback", description: "Collect attempts, review responses, and share marks from the same workspace." },
      { title: "Student confidence", description: "Reduce confusion with cleaner navigation, labels, and study cues." }
    ]
  },
  {
    eyebrow: "Coaching Operations",
    title: "Branch-ready administration for daily academic delivery",
    description:
      "Support admins, institute teams, and teachers with the tools needed to run schedules, manage content, review submissions, and stay aligned across branches.",
    items: [
      { title: "Faculty coordination", description: "Map instructors to active batches and keep delivery responsibilities visible." },
      { title: "Submission review", description: "Handle exam attempts, assignments, and manual grading without leaving the dashboard." },
      { title: "Operational clarity", description: "Monitor users, programs, and active groups from one polished control layer." },
      { title: "Brand consistency", description: "Present one TecOnline identity across marketing, dashboards, and exam views." }
    ]
  }
];

export const instituteServices = [
  "IELTS, PTE, CELPIP, TOEFL, Spoken English, French, and Duolingo program support",
  "Student onboarding, OTP verification, and approval workflows",
  "Teacher onboarding and faculty-to-batch assignment",
  "Course, subcourse, module, and exam content management",
  "Batch scheduling and classroom coordination",
  "TECAI exam delivery and reading practice workflows",
  "Assignments, submissions, and review queues",
  "Student progress and completion monitoring",
  "Branch and institute-level administration",
  "Daily notifications for pending approvals and academic actions",
  "Role-based portals for admins, teachers, and learners",
  "Study visa guidance workflows and learner support operations"
];