"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useRegister, useVerifyRegistration } from "@/hooks/useAuth";
import { usePublicCoursesQuery, usePublicSubCoursesQuery } from "@/hooks/useLmsQueries";
import { getApiErrorMessage } from "@/utils/apiError";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const requestedCourseId = searchParams.get("courseId") || "";
  const requestedSubcourseId = searchParams.get("subcourseId") || "";

  const register = useRegister();
  const verifyRegistration = useVerifyRegistration();
  const { data: courses = [] } = usePublicCoursesQuery();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobNo, setMobNo] = useState("");
  const [password, setPassword] = useState("");
  const [courseId, setCourseId] = useState(requestedCourseId);
  const [subCourseId, setSubCourseId] = useState(requestedSubcourseId);
  const [verificationId, setVerificationId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [deliveryPreview, setDeliveryPreview] = useState<{
    email_otp?: string;
    mobile_otp?: string;
  } | null>(null);
  const { data: subCourses = [] } = usePublicSubCoursesQuery(courseId);

  useEffect(() => {
    if (requestedCourseId && !courseId) {
      setCourseId(requestedCourseId);
    }
  }, [courseId, requestedCourseId]);

  useEffect(() => {
    if (requestedSubcourseId && !subCourseId) {
      setSubCourseId(requestedSubcourseId);
    }
  }, [requestedSubcourseId, subCourseId]);

  const registerErrorMessage = register.error
    ? getApiErrorMessage(register.error, "Registration failed.")
    : null;
  const verifyErrorMessage = verifyRegistration.error
    ? getApiErrorMessage(verifyRegistration.error, "Verification failed.")
    : null;

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

  const onSubmitRegistration = (event: FormEvent) => {
    event.preventDefault();
    register.mutate(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        mob_no: mobNo,
        password,
        course_id: courseId,
        subcourse_id: subCourseId
      },
      {
        onSuccess: (data) => {
          setVerificationId(data.verification_id);
          setExpiresAt(data.expires_at);
          setDeliveryPreview(data.delivery ?? null);
        }
      }
    );
  };

  const onSubmitVerification = (event: FormEvent) => {
    event.preventDefault();
    verifyRegistration.mutate({
      verification_id: verificationId,
      email_otp: emailOtp,
      mobile_otp: mobileOtp
    });
  };

  if (verifyRegistration.isSuccess) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {verifyRegistration.data.message}
        </p>
        <p className="text-sm text-slate-600">
          Your account is created after OTP verification and now waits for admin approval before login.
        </p>
      </div>
    );
  }

  if (verificationId) {
    return (
      <form className="space-y-4" onSubmit={onSubmitVerification}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">OTP verification in progress</p>
          <p className="mt-2">We sent one OTP to your email and one OTP to your mobile number.</p>
          <p className="mt-1">Expires at: {new Date(expiresAt).toLocaleString("en-IN")}</p>
          {deliveryPreview?.email_otp || deliveryPreview?.mobile_otp ? (
            <p className="mt-2 text-xs text-brand-700">
              Dev preview: email OTP {deliveryPreview.email_otp || "-"}, mobile OTP {deliveryPreview.mobile_otp || "-"}
            </p>
          ) : null}
        </div>
        <Input
          label="Email OTP"
          required
          minLength={6}
          maxLength={6}
          value={emailOtp}
          onChange={(e) => setEmailOtp(e.target.value)}
        />
        <Input
          label="Mobile OTP"
          required
          minLength={6}
          maxLength={6}
          value={mobileOtp}
          onChange={(e) => setMobileOtp(e.target.value)}
        />
        <div className="flex gap-3">
          <Button type="submit" disabled={verifyRegistration.isPending}>
            {verifyRegistration.isPending ? "Verifying..." : "Verify And Finish Registration"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setVerificationId("");
              setExpiresAt("");
              setEmailOtp("");
              setMobileOtp("");
            }}
          >
            Edit Registration
          </Button>
        </div>
        {verifyErrorMessage ? <p className="text-sm text-rose-600">{verifyErrorMessage}</p> : null}
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmitRegistration}>
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
        {register.isPending ? "Sending OTPs..." : "Register With OTP Verification"}
      </Button>
      {registerErrorMessage ? <p className="text-sm text-rose-600">{registerErrorMessage}</p> : null}
    </form>
  );
}
