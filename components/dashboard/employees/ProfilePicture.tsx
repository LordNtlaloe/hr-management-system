// components/ProfilePicture.tsx
"use client";

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { uploadProfilePicture } from "@/actions/employee.actions";

interface ProfilePictureProps {
  employeeId: string;
  currentPhotoUrl?: string | null;
}

export default function ProfilePicture({
  employeeId,
  currentPhotoUrl,
}: ProfilePictureProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    currentPhotoUrl || null
  );
  const [uploading, setUploading] = useState(false);

  // Better validation with clearer error messages
  const isValidEmployeeId = employeeId && employeeId.trim().length === 24;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    // Check if employeeId is valid
    if (!isValidEmployeeId) {
      alert(
        `Cannot upload: Invalid employee ID (${employeeId || "undefined"})`
      );
      return;
    }

    const file = e.target.files[0];

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    setUploading(true);

    try {
      console.log("Client: Starting upload for employeeId:", employeeId);
      console.log("Client: File selected:", file.name, file.size);

      const res: any = await uploadProfilePicture(employeeId, file);

      console.log("Client: Upload response:", res);

      if (res?.success) {
        setPhotoUrl(URL.createObjectURL(file));
        alert("Profile picture uploaded successfully!");
      } else {
        alert(res?.error || "Failed to upload profile picture");
      }
    } catch (err: any) {
      console.error("Client: Upload error:", err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Avatar className="w-32 h-32 border-2 border-gray-300 dark:border-gray-600">
        {photoUrl ? (
          <AvatarImage src={photoUrl} alt="Profile" className="object-cover" />
        ) : (
          <AvatarFallback className="p-2 bg-gray-100 dark:bg-gray-800">
            <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </AvatarFallback>
        )}
      </Avatar>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading || !isValidEmployeeId}
        className="text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
      />

      {!isValidEmployeeId && (
        <p className="text-xs text-red-500 text-center max-w-[200px]">
          Cannot upload: Invalid employee ID ({employeeId || "undefined"})
        </p>
      )}
      {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
    </div>
  );
}
