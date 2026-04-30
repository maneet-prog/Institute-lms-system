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
          label: "Institute Info",
          href: "/dashboard/admin/institutes",
          description: "Create and review institute records"
        },
        {
          label: "Courses & SubCourses",
          href: "/dashboard/admin/courses",
          description: "Manage course hierarchy and content"
        },
        {
          label: "Batches",
          href: "/dashboard/admin/batches",
          description: "Manage institute delivery groups"
        },
        {
          label: "Users Info",
          href: "/dashboard/admin/users",
          description: "Approve users and assign roles"
        },
        {
          label: "Teachers Info",
          href: "/dashboard/admin/teachers",
          description: "Manage teacher accounts"
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
          label: "Users Info",
          href: "/dashboard/institute-admin/users",
          description: "Manage approvals and enrollment"
        },
        {
          label: "Teachers Info",
          href: "/dashboard/institute-admin/teachers",
          description: "Manage teacher accounts"
        },
        {
          label: "Courses & SubCourses",
          href: "/dashboard/institute-admin/courses",
          description: "Create academic structure"
        },
        {
          label: "Batches",
          href: "/dashboard/institute-admin/batches",
          description: "Organize delivery groups"
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
