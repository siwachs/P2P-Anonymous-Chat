"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";

import { setUser } from "@/lib/store/slices/userSlice";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { X } from "lucide-react";
import { countries } from "@/lib/constants/countries";

const UserInfoForm = () => {
  return <div>UserInfoForm</div>;
};

export default UserInfoForm;
