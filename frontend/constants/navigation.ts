import { Role } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  super_admin: [
    {
      title: "Management",
      items: [
        {
          label: "Courses & SubCourses",
          href: "/dashboard/admin/courses",
          description: "Manage the course hierarchy for the institute"
        },
        {
          label: "Batches & Materials",
          href: "/dashboard/admin/batches",
          description: "Manage delivery groups and batch content"
        },
        {
          label: "Reusable Content",
          href: "/dashboard/admin/content",
          description: "Create once and assign subcourse content across batches"
        },
        {
          label: "Students",
          href: "/dashboard/admin/users",
          description: "Manage student approvals and access"
        },
        {
          label: "Teachers",
          href: "/dashboard/admin/teachers",
          description: "Manage teacher accounts"
        },
        {
          label: "All Users",
          href: "/dashboard/admin/all-users",
          description: "See every user account in one place"
        },
        {
          label: "Submissions",
          href: "/dashboard/admin/submissions",
          description: "Review learner attempts and results"
        },
        {
          label: "Notifications",
          href: "/dashboard/admin/notifications",
          description: "Review pending registrations"
        }
      ]
    },
    {
      title: "Personal",
      items: [{ label: "Profile", href: "/dashboard/profile", description: "Update login credentials" }]
    }
  ],
  institute_admin: [
    {
      title: "Management",
      items: [
        {
          label: "Students",
          href: "/dashboard/institute-admin/users",
          description: "Manage student approvals and enrollment"
        },
        {
          label: "All Users",
          href: "/dashboard/institute-admin/all-users",
          description: "See every user in your institute"
        },
        {
          label: "Teachers",
          href: "/dashboard/institute-admin/teachers",
          description: "Manage teacher accounts"
        },
        {
          label: "Batches & Materials",
          href: "/dashboard/institute-admin/batches",
          description: "Organize delivery groups and course materials"
        },
        {
          label: "Reusable Content",
          href: "/dashboard/institute-admin/content",
          description: "Create reusable subcourse content for your batches"
        },
        {
          label: "Submissions",
          href: "/dashboard/institute-admin/submissions",
          description: "Review learner attempts and results"
        }
      ]
    },
    {
      title: "Personal",
      items: [{ label: "Profile", href: "/dashboard/profile", description: "Update login credentials" }]
    }
  ],
  teacher: [
    {
      title: "Teaching",
      items: [
        { label: "My Batches", href: "/dashboard/teacher/batches", description: "Assigned class groups" },
        { label: "Modules", href: "/dashboard/teacher/modules", description: "Learning modules" },
        { label: "Submissions", href: "/dashboard/teacher/submissions", description: "Review learner work" }
      ]
    },
    {
      title: "Personal",
      items: [{ label: "Profile", href: "/dashboard/profile", description: "Update login credentials" }]
    }
  ],
  student: [
    {
      title: "Learning",
      items: [
        { label: "Overview", href: "/dashboard/student", description: "Fresh dashboard summary" },
        { label: "My Courses", href: "/dashboard/student/courses", description: "Enrolled programs" },
        { label: "My Modules", href: "/dashboard/student/modules", description: "Study material and progress" },
        { label: "Your Submissions", href: "/dashboard/student/submissions", description: "Your submission details" }
      ]
    },
    {
      title: "Personal",
      items: [{ label: "Profile", href: "/dashboard/profile", description: "Update login credentials" }]
    }
  ]
};
