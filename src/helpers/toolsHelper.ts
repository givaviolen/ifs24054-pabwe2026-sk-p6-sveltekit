import Swal from "sweetalert2";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ActionResult } from "./apiHelper";

const PRIMARY_COLOR = "#4f46e5";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const showSuccessDialog = (message: string, title = "Berhasil") =>
  Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonColor: PRIMARY_COLOR,
  });

export const showErrorDialog = (message: string, title = "Gagal") =>
  Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonColor: PRIMARY_COLOR,
  });

export const showWarningDialog = (message: string, title = "Perhatian") =>
  Swal.fire({
    icon: "warning",
    title,
    text: message,
    confirmButtonColor: PRIMARY_COLOR,
  });

export const showConfirmDialog = async (
  message: string,
  title = "Apakah Anda yakin?",
  confirmText = "Ya, lanjutkan"
): Promise<boolean> => {
  const result = await Swal.fire({
    icon: "question",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Batal",
    confirmButtonColor: PRIMARY_COLOR,
  });
  return result.isConfirmed;
};

/** Menampilkan dialog sukses/gagal dari hasil aksi, lalu mengembalikan statusnya. */
export const notify = async (result: ActionResult): Promise<boolean> => {
  if (result.ok) {
    await showSuccessDialog(result.message);
  } else {
    await showErrorDialog(result.message);
  }
  return result.ok;
};

export const formatDate = (value?: string | null): string =>
  value
    ? new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

export const averageRating = (ratings: { rating: number }[]): number => {
  if (ratings.length === 0) {
    return 0;
  }
  const total = ratings.reduce((sum, item) => sum + item.rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
};

const YOUTUBE_PATTERN =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

/** Mengubah tautan YouTube biasa menjadi tautan embed. Kosong bila tidak valid. */
export const getYoutubeEmbedUrl = (url: string): string => {
  const match = YOUTUBE_PATTERN.exec(url);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
};

export const pickFile = (event: Event): File | undefined =>
  (event.currentTarget as HTMLInputElement).files[0];