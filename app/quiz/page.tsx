"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createQuiz } from "@/lib/quiz-store";

export default function QuizSetup() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [questionCountInput, setQuestionCountInput] = useState<string>("40");
  const [questionCountError, setQuestionCountError] = useState<string>("");
  const [showStartConfirmDialog, setShowStartConfirmDialog] =
    useState<boolean>(false);

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setFileName(file.name);
      setPdfFile(file);
    }
  };

  // Handle question count input change
  const handleQuestionCountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setQuestionCountInput(value);

    // Validate input
    if (!value.trim()) {
      setQuestionCountError("Jumlah soal tidak boleh kosong");
    } else if (isNaN(Number(value)) || Number(value) <= 0) {
      setQuestionCountError("Jumlah soal harus berupa angka positif");
    } else if (Number(value) > 100) {
      setQuestionCountError("Jumlah soal maksimal 100");
    } else {
      setQuestionCountError("");
    }
  };

  // Handle start exam button
  const handleStartExamClick = () => {
    if (!pdfFile) {
      return;
    }

    if (!questionCountInput.trim()) {
      setQuestionCountError("Jumlah soal tidak boleh kosong");
      return;
    }

    const count = Number(questionCountInput);
    if (isNaN(count) || count <= 0) {
      setQuestionCountError("Jumlah soal harus berupa angka positif");
      return;
    }

    if (count > 100) {
      setQuestionCountError("Jumlah soal maksimal 100");
      return;
    }

    // Show confirmation dialog
    setShowStartConfirmDialog(true);
  };

  // Handle confirm start exam
  const handleConfirmStartExam = () => {
    if (!pdfFile) return;

    // Create a new quiz in the store
    const quizId = createQuiz(fileName, Number(questionCountInput));

    // Navigate to the quiz page with the quiz ID
    router.push(`/quiz/${quizId}?pdfUrl=${encodeURIComponent(pdfUrl || "")}`);
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pengaturan Ujian Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="pdf-file">Upload file soal PDF Anda</Label>
              <input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
            </div>

            {pdfFile && (
              <>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="file-name">File Soal</Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="truncate">{fileName}</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="question-count">Jumlah Soal</Label>
                  <Input
                    id="question-count"
                    type="number"
                    min="1"
                    max="100"
                    value={questionCountInput}
                    onChange={handleQuestionCountChange}
                    placeholder="Masukkan jumlah soal"
                    className={questionCountError ? "border-red-500" : ""}
                  />
                  {questionCountError && (
                    <p className="text-sm text-red-500">{questionCountError}</p>
                  )}
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={handleStartExamClick}
                  disabled={!!questionCountError || !pdfFile}
                >
                  <Play className="mr-2 h-4 w-4" /> Mulai Ujian
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Konfirmasi Mulai Ujian */}
      <Dialog
        open={showStartConfirmDialog}
        onOpenChange={setShowStartConfirmDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Mulai Ujian</DialogTitle>
            <DialogDescription>
              Pastikan pengaturan ujian sudah benar sebelum memulai.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="font-medium mb-2">Detail Ujian:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>File soal:</span>
                  <span className="font-medium truncate max-w-[200px]">
                    {fileName}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Jumlah soal:</span>
                  <span className="font-medium">{questionCountInput}</span>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStartConfirmDialog(false)}
            >
              Kembali
            </Button>
            <Button onClick={handleConfirmStartExam}>
              Mulai Ujian Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
