"use client";

import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useRegister } from "@/hooks/useAuth";
import { usePublicCoursesQuery, usePublicSubCoursesQuery } from "@/hooks/useLmsQueries";
import { getApiErrorMessage } from "@/utils/apiError";

export function RegisterForm() {
  const register = useRegister();
  const { data: courses = [] } = usePublicCoursesQuery();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobNo, setMobNo] = useState("");
  const [password, setPassword] = useState("");
  const [courseId, setCourseId] = useState("");
  const [subCourseId, setSubCourseId] = useState("");
  const { data: subCourses = [] } = usePublicSubCoursesQuery(courseId);

  const registerErrorMessage = (() => {
    if (!register.error) {
      return null;
    }
    return getApiErrorMessage(register.error, "Registration failed.");
  })();

  const courseOptions = useMemo(
    () => [{ label: "Select course", value: "" }, ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))],
    [courses]
  );

  const subCourseOptions = useMemo(
    () => [
      { label: "Select subcourse", value: "" },
      ...subCourses.map((subCourse) => ({
        label: subCourse.subcourse_name,
        value: subCourse.subcourse_id
      }))
    ],
    [subCourses]
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    register.mutate({
      first_name: firstName,
      last_name: lastName,
      email,
      mob_no: mobNo,
      password,
      course_id: courseId,
      subcourse_id: subCourseId
    });
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Mobile" required value={mobNo} onChange={(e) => setMobNo(e.target.value)} />
      <Input
        label="Password"
        type="password"
        minLength={8}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Select
        label="Course"
        options={courseOptions}
        value={courseId}
        onChange={(e) => {
          setCourseId(e.target.value);
          setSubCourseId("");
        }}
        required
      />
      <Select
        label="SubCourse"
        options={subCourseOptions}
        value={subCourseId}
        onChange={(e) => setSubCourseId(e.target.value)}
        required
        disabled={!courseId}
      />
      <Button type="submit" className="w-full" disabled={register.isPending}>
        {register.isPending ? "Registering..." : "Register"}
      </Button>
      {register.isSuccess ? (
        <p className="text-sm text-emerald-700">Registered successfully. Await admin approval.</p>
      ) : null}
      {registerErrorMessage ? <p className="text-sm text-rose-600">{registerErrorMessage}</p> : null}
    </form>
  );
}
