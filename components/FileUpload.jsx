"use client";

import { useState } from "react";
import { uploadSubmissionFile } from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function FileUpload({ studentId, dayNumber, onUploadSuccess }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    }

    setUploading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadSubmissionFile(studentId, dayNumber, formData);

    setUploading(false);

    if (result.success) {
      if (onUploadSuccess) onUploadSuccess(result.url);
    } else {
      setErrorMsg(
        result.error || 
        (isRu ? "Ошибка при загрузке файла" : "Файлды жүктеу кезінде қате өтті")
      );
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/50 font-sans text-slate-900">
      <input
        type="file"
        id={`file-input-${dayNumber}`}
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <label
        htmlFor={`file-input-${dayNumber}`}
        className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm flex items-center gap-2"
      >
        {uploading ? (
          <>
            <span className="animate-spin">⏳</span> {isRu ? "Загрузка..." : "Жүктелуде..."}
          </>
        ) : (
          <>
            <span>📸</span> {isRu ? "Выбрать фото/файл задания" : "Тапсырма суретін/файлын таңдау"}
          </>
        )}
      </label>

      {preview && !uploading && (
        <div className="mt-2 relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
          <img src={preview} alt="Homework preview" className="w-full h-full object-cover" />
        </div>
      )}

      {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
    </div>
  );
}