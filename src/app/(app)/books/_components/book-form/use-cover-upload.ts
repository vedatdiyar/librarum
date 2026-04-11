"use client";

import * as React from "react";
import type { BookFormMode, BookDetail, CoverUploadResponse } from "@/types";
import { readJsonResponse } from "@/lib/shared";

export function useCoverUpload(options: {
  mode: BookFormMode;
  initialBook?: BookDetail | null;
  currentCoverCustomUrl?: string;
  currentCoverUploadKey?: string;
  onCoverUploaded: (url: string, key: string) => void;
  onCoverReverted: () => void;
  onError: (error: string) => void;
}) {
  const [isUploadingCover, setIsUploadingCover] = React.useState(false);

  const resolveEndpoint = React.useCallback(() => {
    return options.mode === "edit" && options.initialBook?.id
      ? `/api/books/${options.initialBook.id}/cover`
      : "/api/books/cover";
  }, [options.initialBook?.id, options.mode]);

  const uploadCover = React.useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        options.onError("Kapak fotoğrafı boyutu en fazla 5MB olabilir.");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        options.onError("Sadece JPEG, PNG ve WEBP kapak formatları desteklenir.");
        return;
      }

      setIsUploadingCover(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(resolveEndpoint(), {
          method: "POST",
          body: formData
        });
        const result = await readJsonResponse<CoverUploadResponse>(response);

        options.onCoverUploaded(result.url, result.key);
      } catch (error) {
        options.onError(error instanceof Error ? error.message : "Kapak yüklenemedi.");
      } finally {
        setIsUploadingCover(false);
      }
    },
    [options, resolveEndpoint]
  );

  const revertCoverToDefault = React.useCallback(async () => {
    setIsUploadingCover(true);
    try {
      if (options.currentCoverCustomUrl) {
        await fetch(resolveEndpoint(), {
          method: "DELETE",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            key: options.currentCoverUploadKey || undefined,
            url: options.currentCoverCustomUrl
          })
        }).catch(() => undefined);
      }

      options.onCoverReverted();
    } finally {
      setIsUploadingCover(false);
    }
  }, [options, resolveEndpoint]);

  return {
    isUploadingCover,
    uploadCover,
    revertCoverToDefault
  };
}
