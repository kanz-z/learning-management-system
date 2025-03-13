"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Save,
  FileText,
  AlertTriangle,
  Play,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Quiz() {
  const router = useRouter();
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(40);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Timer states
  const [globalTimer, setGlobalTimer] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<Record<number, number>>({});
  const [currentQuestionStartTime, setCurrentQuestionStartTime] =
    useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isFileSelected, setIsFileSelected] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");

  // State untuk dialog konfirmasi
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  // State untuk setup ujian
  const [examSetupComplete, setExamSetupComplete] = useState<boolean>(false);
  const [showStartConfirmDialog, setShowStartConfirmDialog] =
    useState<boolean>(false);
  const [questionCountInput, setQuestionCountInput] = useState<string>("40");
  const [questionCountError, setQuestionCountError] = useState<string>("");

  // Fungsi untuk menangani navigasi PDF secara manual
  const handlePdfNavigation = (pageNumber: number) => {
    const pdfObject = document.querySelector(
      'object[type="application/pdf"]'
    ) as HTMLObjectElement;
    if (pdfObject && pdfObject.contentWindow) {
      try {
        // Coba navigasi ke halaman yang diinginkan
        const pdfWindow = pdfObject.contentWindow;
        pdfWindow.postMessage({ type: "navigate", page: pageNumber }, "*");
      } catch (error) {
        console.error("Error navigating PDF:", error);
      }
    }
  };

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setFileName(file.name);
      setIsFileSelected(true);
      setQuestionNumber(1); // Reset to first question

      // Reset timers and answers
      setGlobalTimer(0);
      setTimeSpent({});
      setAnswers({});
      setCurrentQuestionStartTime(Date.now());

      // Reset exam setup
      setExamSetupComplete(false);
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
    setTotalQuestions(Number(questionCountInput));
    setExamSetupComplete(true);
    setShowStartConfirmDialog(false);

    // Start the timer
    timerRef.current = setInterval(() => {
      setGlobalTimer((prev) => prev + 1);
    }, 1000);

    // Initialize start time for the current question
    setCurrentQuestionStartTime(Date.now());
  };

  // Initialize global timer when exam starts
  useEffect(() => {
    // Clean up timer when component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update time spent when changing questions
  useEffect(() => {
    if (examSetupComplete && questionNumber > 0) {
      const now = Date.now();
      const timeOnQuestion = Math.floor(
        (now - currentQuestionStartTime) / 1000
      );

      // Update time spent on the previous question
      setTimeSpent((prev) => ({
        ...prev,
        [questionNumber]: (prev[questionNumber] || 0) + timeOnQuestion,
      }));

      // Reset start time for the new question
      setCurrentQuestionStartTime(now);

      // Load the answer for the new question if it exists
      setSelectedAnswer(answers[questionNumber] || null);
    }
  }, [questionNumber, examSetupComplete]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Save current answer when it changes
  useEffect(() => {
    if (selectedAnswer !== null) {
      setAnswers((prev) => ({
        ...prev,
        [questionNumber]: selectedAnswer,
      }));
    }
  }, [selectedAnswer, questionNumber]);

  // Navigation functions
  const goToPrevQuestion = () => {
    if (questionNumber > 1) {
      // Update time spent on current question before navigating
      const now = Date.now();
      const timeOnQuestion = Math.floor(
        (now - currentQuestionStartTime) / 1000
      );

      setTimeSpent((prev) => ({
        ...prev,
        [questionNumber]: (prev[questionNumber] || 0) + timeOnQuestion,
      }));

      const newQuestionNumber = questionNumber - 1;
      setQuestionNumber(newQuestionNumber);
      setCurrentQuestionStartTime(now);

      // Try to navigate PDF to the corresponding page
      handlePdfNavigation(newQuestionNumber);
    }
  };

  const goToNextQuestion = () => {
    if (questionNumber < totalQuestions) {
      // Update time spent on current question before navigating
      const now = Date.now();
      const timeOnQuestion = Math.floor(
        (now - currentQuestionStartTime) / 1000
      );

      setTimeSpent((prev) => ({
        ...prev,
        [questionNumber]: (prev[questionNumber] || 0) + timeOnQuestion,
      }));

      const newQuestionNumber = questionNumber + 1;
      setQuestionNumber(newQuestionNumber);
      setCurrentQuestionStartTime(now);

      // Try to navigate PDF to the corresponding page
      handlePdfNavigation(newQuestionNumber);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Fungsi untuk menampilkan dialog konfirmasi
  const openConfirmDialog = () => {
    setShowConfirmDialog(true);
  };

  // Handle quiz submission
  const handleSubmit = () => {
    // Update time spent on the current question
    const now = Date.now();
    const timeOnQuestion = Math.floor((now - currentQuestionStartTime) / 1000);

    const finalTimeSpent = {
      ...timeSpent,
      [questionNumber]: (timeSpent[questionNumber] || 0) + timeOnQuestion,
    };

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Clean up URL
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    // Navigate to results page with data
    router.push(
      `/quiz/results?data=${encodeURIComponent(
        JSON.stringify({
          answers,
          timeSpent: finalTimeSpent,
          totalTime: globalTimer,
          totalQuestions,
          fileName,
        })
      )}`
    );
  };

  // Hitung jumlah soal yang sudah dijawab
  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  // Manual question input handler
  const handleQuestionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= totalQuestions) {
      // Update time spent on current question before navigating
      const now = Date.now();
      const timeOnQuestion = Math.floor(
        (now - currentQuestionStartTime) / 1000
      );

      setTimeSpent((prev) => ({
        ...prev,
        [questionNumber]: (prev[questionNumber] || 0) + timeOnQuestion,
      }));

      setQuestionNumber(value);
      setCurrentQuestionStartTime(now);

      // Try to navigate PDF to the corresponding page
      handlePdfNavigation(value);
    }
  };

  // Get time spent on current question
  const getCurrentQuestionTime = () => {
    const now = Date.now();
    const timeOnQuestion = Math.floor((now - currentQuestionStartTime) / 1000);
    return (timeSpent[questionNumber] || 0) + timeOnQuestion;
  };

  // Effect untuk menangani navigasi PDF saat questionNumber berubah
  useEffect(() => {
    if (examSetupComplete && pdfUrl) {
      // Coba navigasi ke halaman yang sesuai dengan nomor soal
      const iframe = document.querySelector(
        'iframe[src*="pdf"]'
      ) as HTMLIFrameElement;
      if (iframe) {
        try {
          // Jika ada iframe PDF, coba navigasi
          iframe.src = `${pdfUrl}#page=${questionNumber}`;
        } catch (error) {
          console.error("Error navigating PDF iframe:", error);
        }
      }

      // Alternatif menggunakan object tag
      const pdfObject = document.querySelector(
        'object[type="application/pdf"]'
      ) as HTMLObjectElement;
      if (pdfObject) {
        try {
          // Coba set data dengan parameter halaman
          pdfObject.data = `${pdfUrl}#page=${questionNumber}`;
        } catch (error) {
          console.error("Error navigating PDF object:", error);
        }
      }
    }
  }, [questionNumber, examSetupComplete, pdfUrl]);

  if (!isFileSelected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Pilih File PDF</CardTitle>
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tampilkan form setup ujian jika belum selesai setup
  if (!examSetupComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Pengaturan Ujian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
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
                disabled={!!questionCountError}
              >
                <Play className="mr-2 h-4 w-4" /> Mulai Ujian
              </Button>
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

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            Waktu total: {formatTime(globalTimer)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            Waktu di soal ini: {formatTime(getCurrentQuestionTime())}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Soal:</span>
          <input
            type="number"
            min="1"
            max={totalQuestions}
            value={questionNumber}
            onChange={handleQuestionInput}
            className="w-16 h-8 text-center border rounded"
          />
          <span className="text-sm font-medium">dari {totalQuestions}</span>
        </div>
      </div>

      <div className="w-full bg-primary text-primary-foreground py-3 px-4 mb-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-center">
          Soal Nomor {questionNumber} dari {totalQuestions}
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1">
        {/* PDF Viewer using iframe for better navigation */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-white">
          {pdfUrl ? (
            <div className="w-full h-[70vh] overflow-hidden">
              <iframe
                src={`${pdfUrl}#page=${questionNumber}`}
                className="w-full h-full"
                title="PDF Viewer"
              ></iframe>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Tidak ada PDF yang dimuat</p>
            </div>
          )}
        </div>

        {/* Answer Section */}
        <div className="w-full md:w-80">
          <Card>
            <CardHeader className="bg-muted">
              <CardTitle>Jawaban Soal {questionNumber}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RadioGroup
                value={selectedAnswer || ""}
                onValueChange={setSelectedAnswer}
                className="space-y-3"
              >
                {["a", "b", "c", "d"].map((option) => (
                  <div
                    key={option}
                    className={`flex items-center space-x-2 rounded-md border p-3 ${
                      selectedAnswer === option
                        ? "border-primary bg-primary/10"
                        : ""
                    }`}
                  >
                    <RadioGroupItem value={option} id={`option-${option}`} />
                    <Label
                      htmlFor={`option-${option}`}
                      className="flex-1 cursor-pointer"
                    >
                      Opsi {option.toUpperCase()}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevQuestion}
                disabled={questionNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextQuestion}
                disabled={questionNumber >= totalQuestions}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          {questionNumber === totalQuestions && (
            <Button
              className="w-full mt-4"
              onClick={openConfirmDialog}
              variant="default"
            >
              <Save className="mr-2 h-4 w-4" /> Selesai & Lihat Hasil
            </Button>
          )}
        </div>
      </div>

      {/* Dialog Konfirmasi Submit */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Konfirmasi Pengumpulan
            </DialogTitle>
            <DialogDescription>
              Anda akan mengakhiri ujian dan melihat hasil.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg bg-muted p-4 mb-4">
              <p className="font-medium mb-2">Ringkasan:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Total soal:</span>
                  <span className="font-medium">{totalQuestions}</span>
                </li>
                <li className="flex justify-between">
                  <span>Soal terjawab:</span>
                  <span className="font-medium">
                    {getAnsweredCount()} dari {totalQuestions}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Soal belum terjawab:</span>
                  <span className="font-medium">
                    {totalQuestions - getAnsweredCount()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Total waktu:</span>
                  <span className="font-medium">{formatTime(globalTimer)}</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Setelah mengumpulkan, Anda tidak dapat kembali untuk mengubah
              jawaban.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Kembali ke Soal
            </Button>
            <Button variant="default" onClick={handleSubmit}>
              Ya, Kumpulkan Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
