"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { useUserPersistence } from "@/lib/hooks/useUserPersistence";

import { setUser } from "@/lib/store/slices/userSlice";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { X } from "lucide-react";

import { Age, Gender } from "@/types/user";
import { countries } from "@/lib/constants/countries";

const UserInfoForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser } = useUserPersistence();

  const [formData, setFormData] = useState({
    username: "",
    age: "",
    gender: "",
    country: "",
    interests: [] as string[],
  });
  const [currentInterest, setCurrentInterest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) router.replace("/chat");
  }, [currentUser, router]);

  const submitUserInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      dispatch(
        setUser({
          username: formData.username,
          age: formData.age as Age,
          gender: formData.gender as Gender,
          country: formData.country,
          interests: formData.interests,
        }),
      );
    } catch (error) {
      console.error("Error setting user:", error);
    }

    setIsSubmitting(false);
  };

  const addInterest = () => {
    const trimmedIntrest = currentInterest.trim();
    const numberOfInterests = formData.interests.length;
    if (!trimmedIntrest || numberOfInterests >= 5) return;

    setFormData({
      ...formData,
      interests: [...formData.interests, trimmedIntrest],
    });
    setCurrentInterest("");
  };

  const removeInterest = (index: number) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={submitUserInfo} className="space-y-6">
      {/* username */}
      <div className="space-y-2">
        <Label htmlFor="username">Choose a Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Anonymous123"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          required
          maxLength={20}
          pattern="[a-zA-Z0-9_\- ]+"
          title="Only letters, numbers, underscores, and hyphens allowed"
        />
        <p className="text-muted-foreground text-xs">
          This is how others will see you
        </p>
      </div>

      {/* Age & Gender Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age Range</Label>
          <Select
            value={formData.age}
            onValueChange={(value) => setFormData({ ...formData, age: value })}
            required
          >
            <SelectTrigger id="age" className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="18-24">18-24</SelectItem>
              <SelectItem value="25-34">25-34</SelectItem>
              <SelectItem value="35-44">35-44</SelectItem>
              <SelectItem value="45-54">45-54</SelectItem>
              <SelectItem value="55+">55+</SelectItem>
              <SelectItem value="prefer-not-to-say">
                Prefer not to say
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) =>
              setFormData({ ...formData, gender: value })
            }
            required
          >
            <SelectTrigger id="gender" className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Others">Other</SelectItem>
              <SelectItem value="Prefer not to say">
                Prefer not to say
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select
          value={formData.country}
          onValueChange={(value) =>
            setFormData({ ...formData, country: value })
          }
          required
        >
          <SelectTrigger id="country" className="w-full">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>

          <SelectContent>
            {Object.keys(countries)
              .sort()
              .map((key) => {
                const country = countries[key];

                return (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                );
              })}
          </SelectContent>
        </Select>
      </div>

      {/* Interests */}
      <div className="space-y-2">
        <Label htmlFor="interests">
          Interests (Optional)
          <span className="text-muted-foreground ml-2">
            {formData.interests.length}/5
          </span>
        </Label>

        <div className="flex gap-2">
          <Input
            id="interests"
            type="text"
            placeholder="e.g., Gaming, Music, Tech"
            value={currentInterest}
            onChange={(e) => setCurrentInterest(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addInterest())
            }
            maxLength={20}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addInterest}
            disabled={!currentInterest.trim() || formData.interests.length >= 5}
          >
            Add
          </Button>
        </div>

        {/* Interest Tags */}
        {formData.interests.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.interests.map((interest, index) => (
              <Badge key={index} variant="secondary" className="py-1 pr-1 pl-1">
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(index)}
                  className="hover:text-destructive ml-1"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={
          !formData.username ||
          !formData.age ||
          !formData.gender ||
          !formData.country ||
          isSubmitting
        }
      >
        {isSubmitting ? "Starting..." : "Start Chatting"}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        By continuing, you agree to chat respectfully and follow community
        guidelines
      </p>
    </form>
  );
};

export default UserInfoForm;
