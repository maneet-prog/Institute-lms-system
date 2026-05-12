"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { BookOpen, CheckCircle, Clock, Target, Calendar } from "lucide-react";

interface UserProgressTabProps {
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
}

export function UserProgressTab({ progress }: UserProgressTabProps) {
  const completedCount = progress.filter(p => p.completed).length;
  const totalCount = progress.length;
  const averageProgress = totalCount > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.progress_percent, 0) / totalCount)
    : 0;

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
            <div className="text-sm text-gray-600">Completed Modules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalCount}</div>
            <div className="text-sm text-gray-600">Total Modules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{averageProgress}%</div>
            <div className="text-sm text-gray-600">Average Progress</div>
          </div>
        </div>
      </Card>

      {/* Progress List */}
      {progress.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No progress data available</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {progress.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
                  {item.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Target className="w-6 h-6 text-blue-600" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{item.module_name}</h4>
                    <Badge variant={item.completed ? "default" : "secondary"}>
                      {item.completed ? "Completed" : "In Progress"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {item.course_name} - {item.subcourse_name}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{item.progress_percent}%</span>
                    </div>
                    <Progress value={item.progress_percent} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last accessed {new Date(item.last_accessed).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}