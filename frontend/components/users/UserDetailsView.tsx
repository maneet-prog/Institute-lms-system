"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { useUserDetailsQuery } from "@/hooks/useLmsQueries";
import { UserCoursesTab } from "./UserCoursesTab";
import { UserBatchesTab } from "./UserBatchesTab";
import { UserContentTab } from "./UserContentTab";
import { UserSubmissionsTab } from "./UserSubmissionsTab";
import { UserProgressTab } from "./UserProgressTab";
import { ArrowLeft, User, Mail, Phone, Calendar, Building } from "lucide-react";

interface UserDetailsViewProps {
  userId: string;
}

export function UserDetailsView({ userId }: UserDetailsViewProps) {
  const router = useRouter();
  const { data: userDetails, isLoading, error } = useUserDetailsQuery(userId);

  if (!userId) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Invalid user ID</p>
            <Button onClick={() => router.push('/dashboard/institute-admin/users')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load user details</p>
            <Button onClick={() => router.push('/dashboard/institute-admin/users')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { user, courses, batches, progress, content, submissions } = userDetails;
  const userRoles = user.role_names ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <div className="flex gap-2">
            {userRoles.map((role) => (
              <Badge key={role} variant="secondary">
                {role.replace("_", " ")}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* User Info */}
      <Card>
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              {user.first_name} {user.last_name}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {user.mob_no}
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                {user.institute_name || "No Institute"}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Badge variant={user.is_approved ? "default" : "destructive"}>
                {user.is_approved ? "Approved" : "Pending Approval"}
              </Badge>
              <Badge variant={user.active ? "default" : "secondary"}>
                {user.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="courses">Courses ({courses.enrolled.length + courses.selected.length})</TabsTrigger>
            <TabsTrigger value="batches">Batches ({batches.assigned.length + batches.teaching.length})</TabsTrigger>
            <TabsTrigger value="content">Content ({content.length})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
            <TabsTrigger value="progress">Progress ({progress.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <UserCoursesTab userId={userId} courses={courses} />
          </TabsContent>

          <TabsContent value="batches">
            <UserBatchesTab userId={userId} batches={batches} />
          </TabsContent>

          <TabsContent value="content">
            <UserContentTab userId={userId} content={content} userRoles={userRoles} />
          </TabsContent>

          <TabsContent value="submissions">
            <UserSubmissionsTab userId={userId} submissions={submissions} />
          </TabsContent>

          <TabsContent value="progress">
            <UserProgressTab progress={progress} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
