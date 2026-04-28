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
  { value: "360°", label: "Institute operations in one LMS" },
  { value: "4", label: "Role-based workspaces for every stakeholder" },
  { value: "12+", label: "Core institute service areas covered" },
  { value: "Multi-tenant", label: "Ready for groups, branches, and franchises" }
];

export const featureGroups: FeatureGroup[] = [
  {
    eyebrow: "Learning Delivery",
    title: "Academic structure built for institute workflows",
    description:
      "Manage courses, subcourses, modules, batches, classroom notes, schedules, and delivery paths from a single operational model.",
    items: [
      { title: "Course catalog", description: "Organize programs, certifications, and modular learning paths." },
      { title: "Batch management", description: "Run cohorts with timelines, rooms, start dates, and faculty assignment." },
      { title: "Content delivery", description: "Support videos, URLs, downloadable resources, instructions, and activity types." },
      { title: "Progress tracking", description: "Monitor completion, activity status, and learner movement through modules." }
    ]
  },
  {
    eyebrow: "People & Access",
    title: "Role-based administration for institutes",
    description:
      "Support central admins, institute admins, teachers, and students with permissions that match how training centers and campuses operate.",
    items: [
      { title: "Approval workflows", description: "Review registrations and activate users with institute-aware access rules." },
      { title: "Teacher assignment", description: "Map faculty to batches and course delivery responsibilities." },
      { title: "Student enrollment", description: "Place learners into the right course structures and teaching groups." },
      { title: "Tenant separation", description: "Keep institutes isolated while preserving central platform control." }
    ]
  },
  {
    eyebrow: "Institute Services",
    title: "Services inspired by full-suite LMS platforms",
    description:
      "Cover the service areas institutes expect when comparing platforms like TalentLMS: onboarding, compliance, reporting, communication, and branded delivery.",
    items: [
      { title: "Onboarding & induction", description: "Guide new students, teachers, and branch staff into the platform quickly." },
      { title: "Assessments & submissions", description: "Collect text, links, and assignment-style responses inside learning flows." },
      { title: "Notifications & alerts", description: "Keep admins aware of pending approvals and operational follow-ups." },
      { title: "Branch-ready branding", description: "Present one LMS experience that can serve multiple institutes or campuses." }
    ]
  }
];

export const instituteServices = [
  "Student onboarding, registration, and approval",
  "Teacher onboarding and faculty assignment",
  "Course, program, and module management",
  "Batch scheduling and classroom coordination",
  "Content hosting and blended learning delivery",
  "Assessments, submissions, and activity instructions",
  "Student progress and completion monitoring",
  "Multi-institute and branch-level administration",
  "Operational notifications for pending actions",
  "Role-based portals for admins, teachers, and learners",
  "Program scalability for coaching centers and academies",
  "Platform positioning for certificate, skill, and exam-prep institutes"
];

export const roleSpotlights = [
  {
    role: "Super Admin",
    summary: "Oversee multiple institutes, standardize catalog structures, and monitor platform-wide operations."
  },
  {
    role: "Institute Admin",
    summary: "Run admissions, batches, teachers, and course delivery for a specific institute or campus."
  },
  {
    role: "Teacher",
    summary: "Manage assigned batches, deliver modules, and track learner participation with less manual coordination."
  },
  {
    role: "Student",
    summary: "Access enrolled courses, submit work, revisit resources, and follow a clear learning path."
  }
];
