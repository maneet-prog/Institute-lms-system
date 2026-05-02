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
        { label: "My Modules", href: "/dashboard/student/modules", description: "Study material and progress" }
      ]
    },
    {
      title: "Personal",
      items: [{ label: "Profile", href: "/dashboard/profile", description: "Update login credentials" }]
    }
  ]
};
